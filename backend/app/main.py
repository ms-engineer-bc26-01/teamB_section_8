# 標準ライブラリ
import os

# load .env
from dotenv import load_dotenv
load_dotenv()

# サードパーティ
from fastapi import FastAPI, Query
import firebase_admin
from firebase_admin import credentials
from pydantic import BaseModel

# 自作モジュール
from app.services.weather import fetch_weather_by_zip
from app.schemas.recommend import RecommendRequest
from app.services.outfit import generate_outfit
from app.services.llm import generate_response
from app.routers import item as item_router
from app.routers import outfit as outfit_router
from app.dependencies import IS_DEV_ENV

app = FastAPI()

# ルーターのインクルード
app.include_router(item_router.router)
app.include_router(outfit_router.router)

# --- Firebase SDK の初期化 ---
if IS_DEV_ENV:
    print("Development mode: Firebase auth is disabled")
else:
    # 環境変数などでパスを指定できるようにしておくと便利です [cite: 9]
    cred_path = os.getenv("FIREBASE_CONFIG_PATH", "app/config/serviceAccountKey.json")
    try:
        cred = credentials.Certificate(cred_path)
        if not firebase_admin._apps:
            firebase_admin.initialize_app(cred)  # reload時のクラッシュ防止
        print("Firebase Admin SDK initialized")  # ログで確認 [cite: 6, 68]
    except Exception as e:
        raise RuntimeError(
            "Firebase initialization failed. "
            "Set FIREBASE_CONFIG_PATH or run with APP_ENV=development."
        ) from e


@app.get("/")
def root():
    return {"message": "API is running"}

# --- コーディネート提案APIエンドポイント ---
@app.post("/recommend")
def recommend(req: RecommendRequest):
    outfit = generate_outfit(req.temperature, req.weather)

    return {
        "temperature": req.temperature,
        "weather": req.weather,
        "recommendation": outfit
    }

# --- 天気情報取得APIエンドポイント ---
@app.get("/weather")
async def get_weather(zip_code: str = Query(..., description="郵便番号。例: 1000001")):
	return await fetch_weather_by_zip(zip_code)

# --- チャットAPIエンドポイント ---
class ChatRequest(BaseModel):
    message: str

@app.post("/chat")
def chat(req: ChatRequest):
    reply = generate_response(req.message)
    return {"reply": reply}
