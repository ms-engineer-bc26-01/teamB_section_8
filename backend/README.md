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
