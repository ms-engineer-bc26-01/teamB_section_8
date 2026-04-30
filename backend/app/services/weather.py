from __future__ import annotations

import os
import re
from typing import Any

import httpx
from fastapi import HTTPException

OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY", "")  # 環境変数から読み込む
OPENWEATHER_DATA_BASE_URL = "https://api.openweathermap.org/data/2.5"
OPENWEATHER_COUNTRY_CODE = "JP"
HEARTRAILS_GEO_BASE_URL = "https://geoapi.heartrails.com/api/json"
OPENWEATHER_UNITS = "metric"
OPENWEATHER_CNT = "5" # 3時間ごとの予報を5件取得
OPENWEATHER_LANG = "ja"

WEATHER_MAIN_JA: dict[str, str] = {
    "Thunderstorm": "雷雨",
    "Drizzle": "霧雨",
    "Rain": "雨",
    "Snow": "雪",
    "Mist": "霧",
    "Smoke": "煙霧",
    "Haze": "もや",
    "Dust": "砂塵",
    "Fog": "濃霧",
    "Sand": "砂嵐",
    "Ash": "火山灰",
    "Squall": "スコール",
    "Tornado": "竜巻",
    "Clear": "晴れ",
    "Clouds": "曇り",
}


def _normalize_zip_code(zip_code: str) -> str:
	return re.sub(r"\D", "", zip_code)


async def _resolve_coordinates_by_zip(
	client: httpx.AsyncClient, zip_code: str
) -> tuple[float, float, str]:
	response = await client.get(
		HEARTRAILS_GEO_BASE_URL,
		params={
			"method": "searchByPostal",
			"postal": zip_code,
		},
	)

	if response.status_code >= 400:
		raise HTTPException(
			status_code=response.status_code,
			detail=f"Failed to resolve zip code: {response.text}",
		)

	data = response.json()
	locations = data.get("response", {}).get("location") or []
	if not locations:
		raise HTTPException(
			status_code=404,
			detail="Latitude/Longitude not found for this zip code",
		)

	location = locations[0]
	lat = location.get("y")
	lon = location.get("x")
	if lat is None or lon is None:
		raise HTTPException(
			status_code=404,
			detail="Latitude/Longitude not found for this zip code",
		)

	name = f"{location.get('prefecture', '')}{location.get('city', '')}{location.get('town', '')}".strip()
	return float(lat), float(lon), name or zip_code


async def fetch_weather_by_zip(zip_code: str) -> dict[str, Any]:
	if not OPENWEATHER_API_KEY:
		raise HTTPException(status_code=503, detail="OPENWEATHER_API_KEY is not set. Please configure the environment variable.")

	normalized_zip_code = _normalize_zip_code(zip_code)
	if len(normalized_zip_code) != 7:
		raise HTTPException(status_code=400, detail="Zip code must be a 7-digit number")

	async with httpx.AsyncClient(timeout=10.0) as client:
		lat, lon, location_name = await _resolve_coordinates_by_zip(
			client, normalized_zip_code
		)

		current_response = await client.get(
			f"{OPENWEATHER_DATA_BASE_URL}/weather",
			params={
				"lat": lat,
				"lon": lon,
				"appid": OPENWEATHER_API_KEY,
				"units": OPENWEATHER_UNITS,
				"lang": OPENWEATHER_LANG,
			},
		)

		forecast_response = await client.get(
			f"{OPENWEATHER_DATA_BASE_URL}/forecast",
			params={
				"lat": lat,
				"lon": lon,
				"appid": OPENWEATHER_API_KEY,
				"units": OPENWEATHER_UNITS,
				"lang": OPENWEATHER_LANG,
				"cnt": OPENWEATHER_CNT,
			},
		)

		if current_response.status_code >= 400:
			raise HTTPException(
				status_code=current_response.status_code,
				detail=f"Failed to fetch current weather data: {current_response.text}",
			)

		if forecast_response.status_code >= 400:
			raise HTTPException(
				status_code=forecast_response.status_code,
				detail=f"Failed to fetch forecast weather data: {forecast_response.text}",
			)

		"""
		weather_data = {
			"current": current_response.json(),
			"forecast": forecast_response.json(),
		}
		"""
		current_json = current_response.json()
		forecast_json = forecast_response.json()

		current = {
            "temp": round(current_json['main']['temp']),  # 気温
            "feels_like": round(current_json['main']['feels_like']),  # 体感
            "humidity": current_json['main']['humidity'],  # 湿度
            "weather": WEATHER_MAIN_JA.get(current_json["weather"][0]["main"], current_json["weather"][0]["main"]),  # 天気
            "description": current_json["weather"][0]["description"],  # 説明
             # "wind_speed": current_json["wind"]["speed"],  # 風速
        }

		forecast = [
            {
                "datetime": item["dt_txt"],  # 日時
                "temp": round(item['main']['temp']),  # 気温
                "weather": WEATHER_MAIN_JA.get(item["weather"][0]["main"], item["weather"][0]["main"]),  # 天気
                "pop": round(item.get('pop', 0) * 100),  # 降水確率（存在しない場合は0）
            }
            for item in forecast_json["list"]
		]
		weather_data = {
			"current": current,
			"forecast": forecast,
		}

	return {
		"location": {
			"zip_code": normalized_zip_code,
			"country_code": OPENWEATHER_COUNTRY_CODE,
			"name": location_name,
			"lat": lat,
			"lon": lon,
		},
		"weather": weather_data,
	}
