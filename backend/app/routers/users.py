from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db import get_db
from app.main import get_current_user
from app.models import User

router = APIRouter(prefix="/users", tags=["users"])


class UserResponse(BaseModel):
    id: str
    email: str
    temperature_sensitivity: str | None


class UserUpdateRequest(BaseModel):
    temperature_sensitivity: str | None = None


@router.get("/me", response_model=UserResponse)
def get_me(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.email == current_user["email"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserResponse(
        id=str(user.id),
        email=user.email,
        temperature_sensitivity=user.temperature_sensitivity,
    )


@router.put("/me", response_model=UserResponse)
def update_me(
    req: UserUpdateRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.email == current_user["email"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if req.temperature_sensitivity is not None:
        user.temperature_sensitivity = req.temperature_sensitivity
    db.commit()
    db.refresh(user)
    return UserResponse(
        id=str(user.id),
        email=user.email,
        temperature_sensitivity=user.temperature_sensitivity,
    )
