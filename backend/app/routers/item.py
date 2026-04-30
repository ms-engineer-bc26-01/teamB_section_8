import logging
import os
import uuid as uuid_lib
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.db import get_db
from app.dependencies import get_current_user, uid_to_uuid
from app.schemas.item import CategoryEnum, ItemUpdate, ItemResponse, SeasonEnum
from app.services import item as item_service

logger = logging.getLogger(__name__)


def _nearest_existing_parent(path: str) -> str:
    """存在する最も近い親ディレクトリを返す。"""
    current = os.path.abspath(path)
    while not os.path.exists(current):
        parent = os.path.dirname(current)
        if parent == current:
            break
        current = parent
    return current


def _is_path_writable(target_dir: str) -> bool:
    parent = _nearest_existing_parent(target_dir)
    return os.access(parent, os.W_OK)


def _resolve_upload_dir() -> str:
    """コンテナ優先で、書き込み不可ならローカル開発向けパスへフォールバックする。"""
    local_fallback = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "../../../infra/uploads")
    )

    configured = os.getenv("UPLOAD_DIR")
    if configured:
        if _is_path_writable(configured):
            return configured

        logger.warning(
            "Configured UPLOAD_DIR '%s' is not writable. Falling back to '%s'.",
            configured,
            local_fallback,
        )
        return local_fallback

    container_default = "/app/uploads"
    if _is_path_writable(container_default):
        return container_default

    return local_fallback


UPLOAD_DIR = _resolve_upload_dir()
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

router = APIRouter(prefix="/items", tags=["items"])


@router.post("", response_model=ItemResponse)
async def create_item(
    name: str = Form(...),
    category: CategoryEnum = Form(...),
    color: str = Form(...),
    season: SeasonEnum = Form(...),
    image: UploadFile | None = File(None),
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """アイテムを作成（画像は任意）"""
    image_url: str | None = None

    if image is not None:
        if image.content_type not in ALLOWED_CONTENT_TYPES:
            raise HTTPException(status_code=400, detail="Invalid image type. Allowed: jpeg, png, webp, gif")

        ext = image.content_type.split("/")[-1]
        filename = f"{uuid_lib.uuid4()}.{ext}"
        os.makedirs(UPLOAD_DIR, exist_ok=True)
        file_path = os.path.join(UPLOAD_DIR, filename)

        chunk_size = 1024 * 1024  # 1MB
        total_size = 0

        try:
            with open(file_path, "wb") as f:
                while True:
                    chunk = await image.read(chunk_size)
                    if not chunk:
                        break

                    total_size += len(chunk)
                    if total_size > MAX_FILE_SIZE:
                        raise HTTPException(status_code=400, detail="Image size exceeds 10MB limit")

                    f.write(chunk)
        except HTTPException:
            if os.path.exists(file_path):
                os.remove(file_path)
            raise

        image_url = filename

    user_id = uid_to_uuid(user["uid"])
    try:
        created_item = item_service.create_item(
            db,
            user_id=user_id,
            name=name,
            category=category,
            color=color,
            season=season,
            image_url=image_url
        )
    except Exception:
        # DBコミット失敗時は書き込み済みファイルを削除して孤立ファイルを防ぐ
        if image_url:
            orphan_path = os.path.join(UPLOAD_DIR, image_url)
            try:
                if os.path.exists(orphan_path):
                    os.remove(orphan_path)
            except OSError:
                logger.error("Failed to clean up orphaned file: %s", orphan_path)
        raise
    return created_item


@router.get("/{item_id}", response_model=ItemResponse)
def read_item(
    item_id: UUID,
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """アイテムを取得"""
    item = item_service.get_item(db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if item.user_id != uid_to_uuid(user["uid"]):
        raise HTTPException(status_code=403, detail="Forbidden")
    return item


@router.get("", response_model=list[ItemResponse])
def list_items(
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """ユーザーの全アイテムを取得"""
    user_id = uid_to_uuid(user["uid"])
    return item_service.get_user_items(db, user_id)


@router.put("/{item_id}", response_model=ItemResponse)
def update_item(
    item_id: UUID,
    item_update: ItemUpdate,
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """アイテムを更新"""
    item = item_service.get_item(db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if item.user_id != uid_to_uuid(user["uid"]):
        raise HTTPException(status_code=403, detail="Forbidden")
    
    updated_item = item_service.update_item(
        db,
        item_id,
        name=item_update.name,
        category=item_update.category,
        color=item_update.color,
        season=item_update.season
    )
    return updated_item


@router.get("/{item_id}/image")
def get_item_image(
    item_id: UUID,
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """アイテムの画像を配信"""
    item = item_service.get_item(db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if item.user_id != uid_to_uuid(user["uid"]):
        raise HTTPException(status_code=403, detail="Forbidden")
    if not item.image_url:
        raise HTTPException(status_code=404, detail="Image not found")

    file_path = os.path.join(UPLOAD_DIR, item.image_url)
    if not os.path.isfile(file_path):
        raise HTTPException(status_code=404, detail="Image file not found")

    return FileResponse(file_path)


@router.put("/{item_id}/image", response_model=ItemResponse)
async def update_item_image(
    item_id: UUID,
    image: UploadFile = File(...),
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """アイテムの画像を変更"""
    item = item_service.get_item(db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if item.user_id != uid_to_uuid(user["uid"]):
        raise HTTPException(status_code=403, detail="Forbidden")

    if image.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=400, detail="Invalid image type. Allowed: jpeg, png, webp, gif")

    content = await image.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="Image size exceeds 10MB limit")

    # 旧ファイル名を保存（後で削除するため）
    old_filename = item.image_url

    # 新ファイルを先に保存
    ext = image.content_type.split("/")[-1]
    filename = f"{uuid_lib.uuid4()}.{ext}"
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    file_path = os.path.join(UPLOAD_DIR, filename)
    with open(file_path, "wb") as f:
        f.write(content)

    # DB更新
    try:
        updated_item = item_service.update_item(db, item_id, image_url=filename)
    except Exception:
        # DB更新失敗時は書き込んだ新ファイルを削除してロールバック
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
        except OSError:
            logger.error("Failed to clean up new image file after DB error: %s", file_path)
        raise

    # DB更新成功後に旧ファイルを削除
    if old_filename:
        old_path = os.path.join(UPLOAD_DIR, old_filename)
        try:
            if os.path.isfile(old_path):
                os.remove(old_path)
        except OSError:
            logger.error("Failed to delete old image file: %s", old_path)

    return updated_item


@router.delete("/{item_id}/image")
def delete_item_image(
    item_id: UUID,
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """アイテムの画像を削除"""
    item = item_service.get_item(db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if item.user_id != uid_to_uuid(user["uid"]):
        raise HTTPException(status_code=403, detail="Forbidden")
    if not item.image_url:
        raise HTTPException(status_code=404, detail="Image not found")

    image_filename = item.image_url

    # DBを先に更新してからファイルを削除（DB失敗時の不整合を防ぐ）
    item_service.update_item(db, item_id, image_url=None)

    file_path = os.path.join(UPLOAD_DIR, image_filename)
    try:
        if os.path.isfile(file_path):
            os.remove(file_path)
    except OSError:
        logger.error("Failed to delete image file: %s", file_path)

    return {"message": "Image deleted"}


@router.delete("/{item_id}")
def delete_item(
    item_id: UUID,
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """アイテムを削除"""
    item = item_service.get_item(db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if item.user_id != uid_to_uuid(user["uid"]):
        raise HTTPException(status_code=403, detail="Forbidden")

    # 画像ファイルも合わせて削除（DBを先に削除してからファイルを削除）
    image_filename = item.image_url

    item_service.delete_item(db, item_id)

    if image_filename:
        file_path = os.path.join(UPLOAD_DIR, image_filename)
        try:
            if os.path.isfile(file_path):
                os.remove(file_path)
        except OSError:
            logger.error("Failed to delete image file: %s", file_path)

    return {"message": "Item deleted"}
