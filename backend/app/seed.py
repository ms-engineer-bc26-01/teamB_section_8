import uuid
import os

from sqlalchemy.dialects.postgresql import insert

from app.db import engine
from app.models import Item, User


def uid_to_uuid(uid: str) -> uuid.UUID:
    return uuid.uuid5(uuid.NAMESPACE_URL, uid)


DEV_USER_UID = os.getenv("DEV_USER_UID", "dev-user")
DEV_USER_EMAIL = os.getenv("DEV_USER_EMAIL", "dev@example.com")
DEV_USER_ID = uid_to_uuid(DEV_USER_UID)

DEV_ITEMS = [
    {
        "id": uuid.UUID("2e4d9384-1695-5756-bc7d-b4bd979fb594"),
        "name": "White Oxford Shirt",
        "category": "tops",
        "color": "white",
        "season": "all",
        "image_url": None,
    },
    {
        "id": uuid.UUID("42ff6f4b-4af4-526c-ae86-a73e804473d5"),
        "name": "Navy Chino Pants",
        "category": "bottoms",
        "color": "navy",
        "season": "all",
        "image_url": None,
    },
    {
        "id": uuid.UUID("9f96f8d9-94ab-5319-8bcb-8a36f37d991f"),
        "name": "Light Gray Cardigan",
        "category": "outer",
        "color": "gray",
        "season": "spring",
        "image_url": None,
    },
]


def seed() -> None:
    with engine.begin() as conn:
        conn.execute(
            insert(User).values(
                id=DEV_USER_ID,
                email=DEV_USER_EMAIL,
                temperature_sensitivity="normal",
            ).on_conflict_do_nothing(index_elements=["id"])
        )

        for item in DEV_ITEMS:
            conn.execute(
                insert(Item).values(
                    id=item["id"],
                    user_id=DEV_USER_ID,
                    name=item["name"],
                    category=item["category"],
                    color=item["color"],
                    season=item["season"],
                    image_url=item["image_url"],
                ).on_conflict_do_nothing(index_elements=["id"])
            )


if __name__ == "__main__":
    seed()
    print(f"Seed completed (uid={DEV_USER_UID}, user_id={DEV_USER_ID})")
