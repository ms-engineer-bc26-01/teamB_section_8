import os
from fastapi import FastAPI, Depends, HTTPException, Header
import firebase_admin
from firebase_admin import credentials, auth

app = FastAPI()

# --- Firebase SDK の初期化 ---
# 環境変数などでパスを指定できるようにしておくと便利です [cite: 9]
cred_path = os.getenv("FIREBASE_CONFIG_PATH", "app/config/serviceAccountKey.json")
cred = credentials.Certificate(cred_path)
firebase_admin.initialize_app(cred)
print("Firebase Admin SDK initialized") # ログで確認 [cite: 6, 68]

# --- 共通の認証処理 (Dependency) --- [cite: 65, 67]
async def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    
    token = authorization.split("Bearer ")[1]
    try:
        # トークンの検証 
        decoded_token = auth.verify_id_token(token)
        return decoded_token # uid 等が含まれる
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")

# --- テスト用エンドポイント --- 
@app.get("/auth-test")
def auth_test(user=Depends(get_current_user)):
    return {"message": "Success!", "uid": user["uid"], "email": user.get("email")}

@app.get("/")
def read_root():
    return {"message": "Hello World"}