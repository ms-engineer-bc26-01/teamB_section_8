# app/schemas/recommend.py --- データ定義 ---
from pydantic import BaseModel

class RecommendRequest(BaseModel):
    temperature: float
    weather: str
    message: str | None = None