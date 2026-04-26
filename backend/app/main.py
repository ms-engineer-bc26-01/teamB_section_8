# 標準ライブラリ
import os

# サードパーティ
from fastapi import FastAPI, Depends, HTTPException, Header, Query
import firebase_admin
from firebase_admin import credentials, auth
from pydantic import BaseModel

# 自作モジュール
from weather import fetch_weather_by_zip
from app.schemas.recommend import RecommendRequest
from app.services.outfit import generate_outfit
from app.services.llm import generate_response

app = FastAPI()

# 開発環境判定
def is_development_environment() -> bool:
    env = (
        os.getenv("APP_ENV") or ""
    ).lower()
    return env in {"dev", "development", "local"}


IS_DEV_ENV = is_development_environment()

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

# --- 共通の認証処理 (Dependency) --- [cite: 65, 67]
async def get_current_user(authorization: str = Header(None)):
    if IS_DEV_ENV:
        return {
            "uid": os.getenv("DEV_USER_UID", "dev-user"),
            "email": os.getenv("DEV_USER_EMAIL", "dev@example.com"),
        }

    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    
    token = authorization.split("Bearer ")[1]
    try:
        # トークンの検証 
        decoded_token = auth.verify_id_token(token)
        return decoded_token # uid 等が含まれる
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")


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


# --- テスト用エンドポイント --- 
@app.get("/auth-test")
def auth_test(user=Depends(get_current_user)):
    return {"message": "Success!", "uid": user["uid"], "email": user.get("email")}
