from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.dependencies import get_current_user, uid_to_uuid
from app.models import User
from app.schemas.users import UserResponse, UserUpdate

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserResponse)
def get_me(user=Depends(get_current_user), db: Session = Depends(get_db)):
    """ログイン中のユーザー情報を取得"""
    user_id = uid_to_uuid(user["uid"])
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user


@router.patch("/me", response_model=UserResponse)
def update_me(
    body: UserUpdate,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """ログイン中のユーザー情報を更新"""
    user_id = uid_to_uuid(user["uid"])
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(db_user, field, value)

    db.commit()
    db.refresh(db_user)
    return db_user
