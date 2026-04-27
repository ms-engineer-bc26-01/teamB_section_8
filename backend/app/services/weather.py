from __future__ import annotations

import os
from typing import Any

import httpx
from fastapi import HTTPException

OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY", "")  # 環境変数から読み込む
OPENWEATHER_GEO_BASE_URL = "https://api.openweathermap.org/geo/1.0"
OPENWEATHER_DATA_BASE_URL = "https://api.openweathermap.org/data/2.5"
OPENWEATHER_COUNTRY_CODE = "JP"
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


async def fetch_weather_by_zip(zip_code: str) -> dict[str, Any]:
	if not OPENWEATHER_API_KEY:
		raise HTTPException(status_code=500, detail="OPENWEATHER_API_KEY is not set")

	zip_query = f"{zip_code},{OPENWEATHER_COUNTRY_CODE}"

	async with httpx.AsyncClient(timeout=10.0) as client:
		geo_response = await client.get(
			f"{OPENWEATHER_GEO_BASE_URL}/zip",
			params={
				"zip": zip_query,
				"appid": OPENWEATHER_API_KEY,
			},
		)

		if geo_response.status_code >= 400:
			raise HTTPException(
				status_code=geo_response.status_code,
				detail=f"Failed to resolve zip code: {geo_response.text}",
			)

		geo_data = geo_response.json()
		lat = geo_data.get("lat")
		lon = geo_data.get("lon")

		if lat is None or lon is None:
			raise HTTPException(
				status_code=404,
				detail="Latitude/Longitude not found for this zip code",
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
			"zip_code": zip_code,
			"country_code": OPENWEATHER_COUNTRY_CODE,
			"name": geo_data.get("name"),
			"lat": lat,
			"lon": lon,
		},
		"weather": weather_data,
	}
