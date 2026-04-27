# 標準ライブラリ
import os

# サードパーティ
from uuid import UUID
from fastapi import FastAPI, Depends, HTTPException, Header, Query
import firebase_admin
from firebase_admin import credentials, auth
from pydantic import BaseModel
from sqlalchemy.orm import Session

# 自作モジュール
from weather import fetch_weather_by_zip
from app.db import get_db
from app.schemas.recommend import RecommendRequest
from app.schemas.item import ItemCreate, ItemUpdate, ItemResponse
from app.schemas.outfit import OutfitCreate, OutfitUpdate, OutfitResponse
from app.services.outfit import generate_outfit
from app.services.llm import generate_response
from app.services import item as item_service
from app.services import outfit as outfit_service

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
# --- Item CRUD エンドポイント ---
@app.post("/items", response_model=ItemResponse)
def create_item(
    item: ItemCreate,
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """アイテムを作成"""
    user_id = UUID(user["uid"])
    created_item = item_service.create_item(
        db,
        user_id=user_id,
        name=item.name,
        category=item.category,
        color=item.color,
        season=item.season,
        image_url=item.image_url
    )
    return created_item


@app.get("/items/{item_id}", response_model=ItemResponse)
def read_item(
    item_id: UUID,
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """アイテムを取得"""
    item = item_service.get_item(db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if str(item.user_id) != user["uid"]:
        raise HTTPException(status_code=403, detail="Forbidden")
    return item


@app.get("/items", response_model=list[ItemResponse])
def list_items(
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """ユーザーの全アイテムを取得"""
    user_id = UUID(user["uid"])
    return item_service.get_user_items(db, user_id)


@app.put("/items/{item_id}", response_model=ItemResponse)
def update_item(
    item_id: UUID,
    item_update: ItemUpdate,
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """アイテムを更新"""
    item = item_service.get_item(db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if str(item.user_id) != user["uid"]:
        raise HTTPException(status_code=403, detail="Forbidden")
    
    updated_item = item_service.update_item(
        db,
        item_id,
        name=item_update.name,
        category=item_update.category,
        color=item_update.color,
        season=item_update.season
    )
    return updated_item


@app.delete("/items/{item_id}")
def delete_item(
    item_id: UUID,
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """アイテムを削除"""
    item = item_service.get_item(db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if str(item.user_id) != user["uid"]:
        raise HTTPException(status_code=403, detail="Forbidden")
    
    item_service.delete_item(db, item_id)
    return {"message": "Item deleted"}


# --- Outfit CRUD エンドポイント ---
@app.post("/outfits", response_model=OutfitResponse)
def create_outfit(
    outfit: OutfitCreate,
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """コーディネートを作成"""
    user_id = UUID(user["uid"])
    created_outfit = outfit_service.create_outfit(
        db,
        user_id=user_id,
        title=outfit.title,
        reason=outfit.reason,
        item_ids=outfit.item_ids
    )
    return created_outfit


@app.get("/outfits/{outfit_id}", response_model=OutfitResponse)
def read_outfit(
    outfit_id: UUID,
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """コーディネートを取得"""
    outfit = outfit_service.get_outfit(db, outfit_id)
    if not outfit:
        raise HTTPException(status_code=404, detail="Outfit not found")
    if str(outfit.user_id) != user["uid"]:
        raise HTTPException(status_code=403, detail="Forbidden")
    return outfit


@app.get("/outfits", response_model=list[OutfitResponse])
def list_outfits(
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """ユーザーの全コーディネートを取得"""
    user_id = UUID(user["uid"])
    return outfit_service.get_user_outfits(db, user_id)


@app.put("/outfits/{outfit_id}", response_model=OutfitResponse)
def update_outfit(
    outfit_id: UUID,
    outfit_update: OutfitUpdate,
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """コーディネートを更新"""
    outfit = outfit_service.get_outfit(db, outfit_id)
    if not outfit:
        raise HTTPException(status_code=404, detail="Outfit not found")
    if str(outfit.user_id) != user["uid"]:
        raise HTTPException(status_code=403, detail="Forbidden")
    
    updated_outfit = outfit_service.update_outfit(
        db,
        outfit_id,
        title=outfit_update.title,
        reason=outfit_update.reason,
        item_ids=outfit_update.item_ids
    )
    return updated_outfit


@app.delete("/outfits/{outfit_id}")
def delete_outfit(
    outfit_id: UUID,
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """コーディネートを削除"""
    outfit = outfit_service.get_outfit(db, outfit_id)
    if not outfit:
        raise HTTPException(status_code=404, detail="Outfit not found")
    if str(outfit.user_id) != user["uid"]:
        raise HTTPException(status_code=403, detail="Forbidden")
    
    outfit_service.delete_outfit(db, outfit_id)
    return {"message": "Outfit deleted"}


# --- テスト用エンドポイント --- 
@app.get("/auth-test")
def auth_test(user=Depends(get_current_user)):
    return {"message": "Success!", "uid": user["uid"], "email": user.get("email")}
