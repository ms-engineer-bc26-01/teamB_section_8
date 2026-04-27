from pydantic import BaseModel
from datetime import datetime
from uuid import UUID


class ItemBase(BaseModel):
    name: str
    category: str
    color: str
    season: str
    image_url: str | None = None


class ItemCreate(ItemBase):
    pass


class ItemUpdate(BaseModel):
    name: str | None = None
    category: str | None = None
    color: str | None = None
    season: str | None = None
    image_url: str | None = None


class ItemResponse(ItemBase):
    id: UUID
    user_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True
