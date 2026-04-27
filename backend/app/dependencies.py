import os
import uuid as _uuid
from uuid import UUID

from fastapi import Header, HTTPException
from firebase_admin import auth


def is_development_environment() -> bool:
    env = (os.getenv("APP_ENV") or "").lower()
    return env in {"dev", "development", "local"}


IS_DEV_ENV = is_development_environment()


def uid_to_uuid(uid: str) -> UUID:
    """Firebase UID など任意の文字列を決定論的に UUID へ変換する"""
    return _uuid.uuid5(_uuid.NAMESPACE_URL, uid)


async def get_current_user(authorization: str = Header(None)):
    """共通の認証依存関数"""
    if IS_DEV_ENV:
        return {
            "uid": os.getenv("DEV_USER_UID", "dev-user"),
            "email": os.getenv("DEV_USER_EMAIL", "dev@example.com"),
        }

    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")

    token = authorization.split("Bearer ")[1]
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")
