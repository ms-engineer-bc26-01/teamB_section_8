from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
import uuid as _uuid

from app.db import get_db
from app.schemas.item import ItemCreate, ItemUpdate, ItemResponse
from app.services import item as item_service

# 認証ロジックと uid_to_uuid をここで定義（main.pyと重複するため、後で共有モジュールに移動することを推奨）
import os
from firebase_admin import auth
import firebase_admin


def is_development_environment() -> bool:
    env = (
        os.getenv("APP_ENV") or ""
    ).lower()
    return env in {"dev", "development", "local"}


IS_DEV_ENV = is_development_environment()


def uid_to_uuid(uid: str) -> UUID:
    """Firebase UID など任意の文字列を決定論的に UUID へ変換する"""
    return _uuid.uuid5(_uuid.NAMESPACE_URL, uid)


async def get_current_user(authorization: str = Header(None)):
    """item ルーター用の認証依存関数"""
    if IS_DEV_ENV:
        return {
            "uid": os.getenv("DEV_USER_UID", "dev-user"),
            "email": os.getenv("DEV_USER_EMAIL", "dev@example.com"),
        }

    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    
    token = authorization.split("Bearer ")[1]
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")


router = APIRouter(prefix="/items", tags=["items"])


@router.post("", response_model=ItemResponse)
def create_item(
    item: ItemCreate,
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """アイテムを作成"""
    user_id = uid_to_uuid(user["uid"])
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


@router.get("/{item_id}", response_model=ItemResponse)
def read_item(
    item_id: UUID,
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """アイテムを取得"""
    item = item_service.get_item(db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if item.user_id != uid_to_uuid(user["uid"]):
        raise HTTPException(status_code=403, detail="Forbidden")
    return item


@router.get("", response_model=list[ItemResponse])
def list_items(
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """ユーザーの全アイテムを取得"""
    user_id = uid_to_uuid(user["uid"])
    return item_service.get_user_items(db, user_id)


@router.put("/{item_id}", response_model=ItemResponse)
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
    if item.user_id != uid_to_uuid(user["uid"]):
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


@router.delete("/{item_id}")
def delete_item(
    item_id: UUID,
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """アイテムを削除"""
    item = item_service.get_item(db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if item.user_id != uid_to_uuid(user["uid"]):
        raise HTTPException(status_code=403, detail="Forbidden")
    
    item_service.delete_item(db, item_id)
    return {"message": "Item deleted"}
