import os

import httpx
from fastapi import APIRouter, Depends, HTTPException
from firebase_admin import auth
from sqlalchemy.orm import Session

from app.db import get_db
from app.dependencies import IS_DEV_ENV, uid_to_uuid
from app.models import User
from app.schemas.auth import AuthResponse, LoginRequest, SignupRequest

router = APIRouter(prefix="/auth", tags=["auth"])

FIREBASE_WEB_API_KEY = os.getenv("FIREBASE_WEB_API_KEY")
ALLOW_DEV_AUTH_BYPASS = os.getenv("ALLOW_DEV_AUTH_BYPASS", "").lower() in {"true", "1", "yes"}


@router.post("/signup", response_model=AuthResponse)
async def signup(req: SignupRequest, db: Session = Depends(get_db)):
    # 開発環境: Firebase をスキップしてDBのみ操作（IS_DEV_ENV と ALLOW_DEV_AUTH_BYPASS の両方が必要）
    if IS_DEV_ENV and ALLOW_DEV_AUTH_BYPASS:
        dev_uid = os.getenv("DEV_USER_UID", "dev-user")
        user_id = uid_to_uuid(dev_uid)
        existing_by_email = db.query(User).filter(User.email == req.email).first()
        if existing_by_email:
            raise HTTPException(status_code=400, detail="Email already exists")
        existing_by_id = db.query(User).filter(User.id == user_id).first()
        if existing_by_id:
            raise HTTPException(
                status_code=400,
                detail="Dev user already registered. Change DEV_USER_UID to register a different dev user.",
            )
        db_user = User(id=user_id, email=req.email)
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return AuthResponse(user_id=str(db_user.id), access_token="dev-token")

    # Firebase にユーザー作成
    try:
        firebase_user = auth.create_user(email=req.email, password=req.password)
    except auth.EmailAlreadyExistsError:
        raise HTTPException(status_code=400, detail="Email already exists")
    except Exception as e:
        if "CONFIGURATION_NOT_FOUND" in str(e):
            raise HTTPException(
                status_code=500,
                detail=(
                    "Firebase email/password provider is not enabled or misconfigured. "
                    "Enable Email/Password in Firebase Authentication settings."
                ),
            )
        raise HTTPException(status_code=400, detail=str(e))

    # DBにユーザーレコードを作成（失敗時は Firebase ユーザーを削除してロールバック）
    user_id = uid_to_uuid(firebase_user.uid)
    db_user = User(id=user_id, email=req.email)
    db.add(db_user)
    try:
        db.commit()
        db.refresh(db_user)
    except Exception as e:
        db.rollback()
        try:
            auth.delete_user(firebase_user.uid)
        except Exception:
            pass
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create user record: {str(e)}",
        ) from e

    if not FIREBASE_WEB_API_KEY:
        raise HTTPException(status_code=500, detail="FIREBASE_WEB_API_KEY is not configured")

    # サインアップ後に Firebase へメール/パスワードでサインインし、API 認証に使える ID トークンを取得
    url = (
        "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword"
        f"?key={FIREBASE_WEB_API_KEY}"
    )
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            url,
            json={"email": req.email, "password": req.password, "returnSecureToken": True},
        )

    if resp.status_code != 200:
        try:
            error_message = resp.json().get("error", {}).get("message", "")
        except Exception:
            error_message = ""

        if error_message == "CONFIGURATION_NOT_FOUND":
            raise HTTPException(
                status_code=500,
                detail=(
                    "Firebase email/password provider is not enabled or misconfigured. "
                    "Enable Email/Password in Firebase Authentication settings."
                ),
            )
        raise HTTPException(
            status_code=500,
            detail=f"Failed to obtain Firebase ID token: {error_message or resp.text}",
        )

    data = resp.json()
    id_token: str = data["idToken"]

    return AuthResponse(
        user_id=str(db_user.id),
        access_token=id_token,
    )


@router.post("/login", response_model=AuthResponse)
async def login(req: LoginRequest, db: Session = Depends(get_db)):
    # 開発環境: Firebase をスキップしてDBのみで認証（IS_DEV_ENV と ALLOW_DEV_AUTH_BYPASS の両方が必要）
    if IS_DEV_ENV and ALLOW_DEV_AUTH_BYPASS:
        db_user = db.query(User).filter(User.email == req.email).first()
        if not db_user:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        return AuthResponse(user_id=str(db_user.id), access_token="dev-token")

    if not FIREBASE_WEB_API_KEY:
        raise HTTPException(status_code=500, detail="FIREBASE_WEB_API_KEY is not configured")

    # Firebase Identity Toolkit REST API でメール/パスワード認証
    url = (
        "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword"
        f"?key={FIREBASE_WEB_API_KEY}"
    )
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            url,
            json={"email": req.email, "password": req.password, "returnSecureToken": True},
        )

    if resp.status_code != 200:
        try:
            error_message = resp.json().get("error", {}).get("message", "")
        except Exception:
            error_message = ""

        if error_message == "CONFIGURATION_NOT_FOUND":
            raise HTTPException(
                status_code=500,
                detail=(
                    "Firebase email/password provider is not enabled or misconfigured. "
                    "Enable Email/Password in Firebase Authentication settings."
                ),
            )
        raise HTTPException(status_code=401, detail="Invalid email or password")

    data = resp.json()
    id_token: str = data["idToken"]
    firebase_uid: str = data["localId"]

    # DBユーザーを取得（存在しなければ作成）
    user_id = uid_to_uuid(firebase_uid)
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        db_user = User(id=user_id, email=req.email)
        db.add(db_user)
        db.commit()
        db.refresh(db_user)

    return AuthResponse(
        user_id=str(db_user.id),
        access_token=id_token,
    )
