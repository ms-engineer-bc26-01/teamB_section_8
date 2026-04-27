from enum import Enum

from pydantic import BaseModel
from datetime import datetime
from uuid import UUID


class CategoryEnum(str, Enum):
    tops = "tops"
    bottoms = "bottoms"
    outerwear = "outerwear"
    shoes = "shoes"
    accessories = "accessories"
    other = "other"


class SeasonEnum(str, Enum):
    spring = "spring"
    summer = "summer"
    autumn = "autumn"
    winter = "winter"
    all_season = "all_season"


class ItemBase(BaseModel):
    name: str
    category: CategoryEnum
    color: str
    season: SeasonEnum
    image_url: str | None = None


class ItemCreate(ItemBase):
    pass


class ItemUpdate(BaseModel):
    name: str | None = None
    category: CategoryEnum | None = None
    color: str | None = None
    season: SeasonEnum | None = None
    image_url: str | None = None


class ItemResponse(ItemBase):
    id: UUID
    user_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True
