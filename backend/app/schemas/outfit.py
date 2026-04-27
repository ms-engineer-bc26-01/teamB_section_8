from pydantic import BaseModel
from datetime import datetime
from uuid import UUID


class OutfitItemResponse(BaseModel):
    id: UUID
    outfit_id: UUID
    item_id: UUID

    class Config:
        from_attributes = True


class OutfitBase(BaseModel):
    title: str
    reason: str


class OutfitCreate(OutfitBase):
    item_ids: list[UUID]


class OutfitUpdate(BaseModel):
    title: str | None = None
    reason: str | None = None
    item_ids: list[UUID] | None = None


class OutfitResponse(OutfitBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    outfit_items: list[OutfitItemResponse] = []

    class Config:
        from_attributes = True
