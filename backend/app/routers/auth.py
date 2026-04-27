import os

import httpx
from fastapi import APIRouter, Depends, HTTPException
from firebase_admin import auth
from sqlalchemy.orm import Session

from app.db import get_db
from app.dependencies import IS_DEV_ENV
from app.models import User
from app.schemas.auth import AuthResponse, LoginRequest, SignupRequest

router = APIRouter(prefix="/auth", tags=["auth"])

FIREBASE_WEB_API_KEY = os.getenv("FIREBASE_WEB_API_KEY")


@router.post("/signup", response_model=AuthResponse)
async def signup(req: SignupRequest, db: Session = Depends(get_db)):
    # 開発環境: Firebase をスキップしてDBのみ操作
    if IS_DEV_ENV:
        existing = db.query(User).filter(User.email == req.email).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already exists")
        db_user = User(email=req.email)
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

    # DBにユーザーレコードを作成
    db_user = User(email=req.email)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    # カスタムトークン発行（クライアントで signInWithCustomToken() を使い ID トークンに交換）
    custom_token: bytes = auth.create_custom_token(firebase_user.uid)

    return AuthResponse(
        user_id=str(db_user.id),
        access_token=custom_token.decode("utf-8"),
    )


@router.post("/login", response_model=AuthResponse)
async def login(req: LoginRequest, db: Session = Depends(get_db)):
    # 開発環境: Firebase をスキップしてDBのみで認証
    if IS_DEV_ENV:
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

    # DBユーザーを取得（存在しなければ作成）
    db_user = db.query(User).filter(User.email == req.email).first()
    if not db_user:
        db_user = User(email=req.email)
        db.add(db_user)
        db.commit()
        db.refresh(db_user)

    return AuthResponse(
        user_id=str(db_user.id),
        access_token=id_token,
    )
