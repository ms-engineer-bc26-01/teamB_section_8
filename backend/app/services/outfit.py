# app/services/outfit.py --- コーディネート生成ロジック・CRUD ---
from uuid import UUID
from sqlalchemy.orm import Session
from app.models import Outfit, OutfitItem, Item


def generate_outfit(temp: float, weather: str) -> str:
    """コーディネート提案"""
    if weather == "rain":
        return "防水ジャケット + スニーカーがおすすめです"

    if temp >= 25:
        return "Tシャツ + ショートパンツがおすすめです"
    elif temp >= 18:
        return "長袖シャツ + デニムがちょうどいいです"
    elif temp >= 10:
        return "ニット + コートで暖かくしましょう"
    else:
        return "ダウンジャケット必須です"


def create_outfit(db: Session, user_id: UUID, title: str, reason: str, item_ids: list[UUID]) -> Outfit:
    """コーディネートを作成"""
    outfit = Outfit(
        user_id=user_id,
        title=title,
        reason=reason
    )
    db.add(outfit)
    db.flush()  # outfit.id を取得するためにflush
    
    for item_id in item_ids:
        outfit_item = OutfitItem(
            outfit_id=outfit.id,
            item_id=item_id
        )
        db.add(outfit_item)
    
    db.commit()
    db.refresh(outfit)
    return outfit


def get_outfit(db: Session, outfit_id: UUID) -> Outfit | None:
    """コーディネートを取得"""
    return db.query(Outfit).filter(Outfit.id == outfit_id).first()


def get_user_outfits(db: Session, user_id: UUID) -> list[Outfit]:
    """ユーザーの全コーディネートを取得"""
    return db.query(Outfit).filter(Outfit.user_id == user_id).all()


def update_outfit(db: Session, outfit_id: UUID, title: str | None = None, reason: str | None = None, item_ids: list[UUID] | None = None) -> Outfit | None:
    """コーディネートを更新"""
    outfit = db.query(Outfit).filter(Outfit.id == outfit_id).first()
    if not outfit:
        return None
    
    if title is not None:
        outfit.title = title
    if reason is not None:
        outfit.reason = reason
    
    if item_ids is not None:
        # 既存のアイテムを削除
        db.query(OutfitItem).filter(OutfitItem.outfit_id == outfit_id).delete()
        # 新しいアイテムを追加
        for item_id in item_ids:
            outfit_item = OutfitItem(
                outfit_id=outfit_id,
                item_id=item_id
            )
            db.add(outfit_item)
    
    db.commit()
    db.refresh(outfit)
    return outfit


def delete_outfit(db: Session, outfit_id: UUID) -> bool:
    """コーディネートを削除"""
    outfit = db.query(Outfit).filter(Outfit.id == outfit_id).first()
    if not outfit:
        return False
    
    db.delete(outfit)
    db.commit()
    return True