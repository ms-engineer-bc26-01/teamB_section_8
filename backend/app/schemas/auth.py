from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr


class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    user_name: Optional[str] = None
    temperature_sensitivity: Optional[str] = None
    zip_code_1: Optional[str] = None
    zip_code_2: Optional[str] = None





class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    user_id: str
    access_token: str


class UserUpdate(BaseModel):
    user_name: Optional[str] = None
    temperature_sensitivity: Optional[str] = None
    zip_code_1: Optional[str] = None
    zip_code_2: Optional[str] = None


class UserResponse(BaseModel):
    id: UUID
    email: str
    user_name: Optional[str] = None
    temperature_sensitivity: Optional[str] = None
    zip_code_1: Optional[str] = None
    zip_code_2: Optional[str] = None

    class Config:
        from_attributes = True
