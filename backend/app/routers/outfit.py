from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.dependencies import get_current_user, uid_to_uuid
from app.schemas.outfit import OutfitCreate, OutfitUpdate, OutfitResponse
from app.services import outfit as outfit_service


router = APIRouter(prefix="/outfits", tags=["outfits"])


@router.post("", response_model=OutfitResponse)
def create_outfit(
    outfit: OutfitCreate,
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """コーディネートを作成"""
    user_id = uid_to_uuid(user["uid"])
    created_outfit = outfit_service.create_outfit(
        db,
        user_id=user_id,
        title=outfit.title,
        reason=outfit.reason,
        item_ids=outfit.item_ids
    )
    return created_outfit


@router.get("/{outfit_id}", response_model=OutfitResponse)
def read_outfit(
    outfit_id: UUID,
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """コーディネートを取得"""
    outfit = outfit_service.get_outfit(db, outfit_id)
    if not outfit:
        raise HTTPException(status_code=404, detail="Outfit not found")
    if outfit.user_id != uid_to_uuid(user["uid"]):
        raise HTTPException(status_code=403, detail="Forbidden")
    return outfit


@router.get("", response_model=list[OutfitResponse])
def list_outfits(
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """ユーザーの全コーディネートを取得"""
    user_id = uid_to_uuid(user["uid"])
    return outfit_service.get_user_outfits(db, user_id)


@router.put("/{outfit_id}", response_model=OutfitResponse)
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
    if outfit.user_id != uid_to_uuid(user["uid"]):
        raise HTTPException(status_code=403, detail="Forbidden")

    updated_outfit = outfit_service.update_outfit(
        db,
        outfit_id,
        title=outfit_update.title,
        reason=outfit_update.reason,
        item_ids=outfit_update.item_ids
    )
    return updated_outfit


@router.delete("/{outfit_id}")
def delete_outfit(
    outfit_id: UUID,
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """コーディネートを削除"""
    outfit = outfit_service.get_outfit(db, outfit_id)
    if not outfit:
        raise HTTPException(status_code=404, detail="Outfit not found")
    if outfit.user_id != uid_to_uuid(user["uid"]):
        raise HTTPException(status_code=403, detail="Forbidden")

    outfit_service.delete_outfit(db, outfit_id)
    return {"message": "Outfit deleted"}