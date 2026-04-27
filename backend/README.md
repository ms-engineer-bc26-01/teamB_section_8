# Backend セットアップ手順

このディレクトリのPython仮想環境は、`venv`フォルダ自体を配布するのではなく、`requirements.txt`を使って各メンバーのローカル環境で再現します。

## 前提

- Python 3.12系がインストール済み
- Docker / Docker Compose が使える
- 実行場所はこの `backend` ディレクトリ

## 1. 初回セットアップ（最初の1回だけ）

### 1-1. backend ディレクトリへ移動

```bash
cd backend
```

### 1-2. 仮想環境を作成

```bash
python3 -m venv .venv
```

### 1-3. 仮想環境を有効化

```bash
source .venv/bin/activate
```

- Windowsの場合は

```PowerShell
.venv\Scripts\Activate
```

→　(.venu)が行の頭に表示される。

### 1-4. 依存パッケージをインストール

```bash
pip install -r requirements.txt
```

### 1-5. DBコンテナを起動（プロジェクトルートで実行）

```bash
cd ../infra
docker compose up -d
cd ../backend
```

### 1-6. マイグレーション適用

```bash
alembic upgrade head
```

### 1-7. APIサーバー起動

```bash
uvicorn app.main:app --reload
```

起動後: http://127.0.0.1:8000

## 2. 2回目以降の起動手順

```bash
cd backend
source .venv/bin/activate
cd ../infra && docker compose up -d && cd ../backend
uvicorn app.main:app --reload
```

## 3. 依存関係を更新したとき（共有方法）

新しいライブラリを追加した人は、以下を実施してコミットしてください。

```bash
pip install <package_name>
pip freeze > requirements.txt
```

他メンバーは、最新コード取得後に以下で同期します。

```bash
cd backend
source .venv/bin/activate
pip install -r requirements.txt
```

## 4. よく使うコマンド

## 5. 起動時シード（開発環境のみ）

`scripts/entrypoint.sh` は、起動時に以下の順で実行されます。

1. DB作成（存在しない場合）
2. Alembicマイグレーション
3. 開発環境のみシード実行
4. API起動

シード実行条件:

- `APP_ENV` が `development` / `dev` / `local` のいずれか
- かつ `RUN_SEED_ON_STARTUP` が有効（`true` / `1` / `yes` / `on`）

`RUN_SEED_ON_STARTUP` 未指定時は、開発環境では `true` 扱いです。

無効化したい場合は、`RUN_SEED_ON_STARTUP=false` を指定してください。

開発用ユーザーIDについて:

- シードする `users.id` は固定UUIDではなく `DEV_USER_UID` から UUIDv5 で生成されます
- 認証スキップ時のAPI実行ユーザーも同じ `DEV_USER_UID` を使うため、`POST /items` の外部キー不整合を防げます
- `docker compose` の backend サービスでは、既定値として `DEV_USER_UID=dev-user` / `DEV_USER_EMAIL=dev@example.com` を設定しています

### サーバー停止

`Ctrl + C`

### 仮想環境を抜ける

```bash
deactivate
```

### DBコンテナ停止

```bash
cd ../infra
docker compose down
```
