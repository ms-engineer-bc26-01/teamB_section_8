from uuid import UUID
from sqlalchemy.orm import Session
from app.models import Item


def create_item(db: Session, user_id: UUID, name: str, category: str, color: str, season: str, image_url: str | None = None) -> Item:
    """アイテムを作成"""
    item = Item(
        user_id=user_id,
        name=name,
        category=category,
        color=color,
        season=season,
        image_url=image_url
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def get_item(db: Session, item_id: UUID) -> Item | None:
    """アイテムを取得"""
    return db.query(Item).filter(Item.id == item_id).first()


def get_user_items(db: Session, user_id: UUID) -> list[Item]:
    """ユーザーの全アイテムを取得"""
    return db.query(Item).filter(Item.user_id == user_id).all()


def update_item(db: Session, item_id: UUID, **kwargs) -> Item | None:
    """アイテムを更新"""
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        return None
    
    for key, value in kwargs.items():
        if value is not None and hasattr(item, key):
            setattr(item, key, value)
    
    db.commit()
    db.refresh(item)
    return item


def delete_item(db: Session, item_id: UUID) -> bool:
    """アイテムを削除"""
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        return False
    
    db.delete(item)
    db.commit()
    return True
