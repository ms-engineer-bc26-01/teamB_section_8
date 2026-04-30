# 標準ライブラリ
import logging
import os

# load .env
from dotenv import load_dotenv
load_dotenv()

# サードパーティ
from fastapi import Depends, FastAPI, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
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
from app.routers import users as users_router
from app.dependencies import IS_DEV_ENV, get_current_user

app = FastAPI()

logger = logging.getLogger(__name__)

cors_allow_origins = os.getenv("CORS_ALLOW_ORIGINS", "*").split(",")
cors_allow_origins = [origin.strip() for origin in cors_allow_origins if origin.strip()]
allow_all_origins = "*" in cors_allow_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_allow_origins or ["*"],
    allow_credentials=not allow_all_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception(
        "Unhandled exception: %s %s",
        request.method,
        request.url.path,
    )
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal Server Error",
            "error": str(exc),
        },
    )

# ルーター登録（循環インポート回避のため初期化後に import）
from app.routers import auth as auth_router  # noqa: E402

app.include_router(auth_router.router)

# ルーターのインクルード
app.include_router(item_router.router)
app.include_router(outfit_router.router)
app.include_router(users_router.router)



# --- Firebase SDK の初期化 ---
if IS_DEV_ENV:
    print("Development mode: Firebase auth is disabled")
else:
    # 既定はリポジトリ直下の共通シークレット配置を参照（__file__ 基準の絶対パスで解決）
    _default_cred_path = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "../../.secrets/firebase/serviceAccountKey.json")
    )
    cred_path = os.getenv("FIREBASE_CONFIG_PATH", _default_cred_path)
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
def recommend(req: RecommendRequest, user=Depends(get_current_user)):
    outfit = generate_outfit(req.temperature, req.weather)

    return {
        "temperature": req.temperature,
        "weather": req.weather,
        "recommendation": outfit
    }

# --- 天気情報取得APIエンドポイント ---
@app.get("/weather")
async def get_weather(zip_code: str = Query(..., description="郵便番号。例: 1000001"), user=Depends(get_current_user)):
	return await fetch_weather_by_zip(zip_code)

# --- チャットAPIエンドポイント ---
class ChatRequest(BaseModel):
    message: str

@app.post("/chat")
def chat(req: ChatRequest, user=Depends(get_current_user)):
    reply = generate_response(req.message)
    return {"reply": reply}
