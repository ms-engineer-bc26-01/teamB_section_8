from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.dependencies import get_current_user, uid_to_uuid
from app.schemas.item import ItemCreate, ItemUpdate, ItemResponse
from app.services import item as item_service


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
