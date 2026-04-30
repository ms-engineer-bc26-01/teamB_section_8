from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr


class UserUpdate(BaseModel):
    user_name: Optional[str] = None
    temperature_sensitivity: Optional[str] = None
    zip_code_1: Optional[str] = None
    zip_code_2: Optional[str] = None


class UserResponse(BaseModel):
    id: UUID
    email: EmailStr
    user_name: Optional[str] = None
    temperature_sensitivity: Optional[str] = None
    zip_code_1: Optional[str] = None
    zip_code_2: Optional[str] = None

    class Config:
        from_attributes = True
