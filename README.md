# teamB_section_8
# ClimateClosetAI 🧥✨
「持っている服」×「その日の天気」で、毎朝の服選びをスマートにするAIスタイリスト

---

## 📖 プロジェクト概要
ClimateClosetAIは、ユーザーのクローゼット情報とリアルタイムの気象データを組み合わせ、LLM（大規模言語モデル）が最適なコーディネートを提案するWebアプリケーションです。

「服はあるのに着る服がない」という日常の悩みを、テクノロジーで解決します。

---

## 🎯 開発スコープ

### ✅ MVP（今回作る範囲）
- デジタルクローゼット（服の登録・一覧表示）
- 天気連動コーデ提案（気温・天候ベース）
- AIコーデ提案（基本プロンプト）

### 🚧 今後の拡張
- RAGによるパーソナライズ
- LINE連携
- コーデ履歴・フィードバック機能

---

## 🚀 主な機能
- 👕 デジタルクローゼット  
  所持アイテムを登録・管理

- 🌤 お天気連動提案  
  気温・天候に応じたコーデ生成

- 🤖 AIコーデ提案  
  LLMによる自然言語でのスタイリング提案

---

## 🛠 技術スタック
- **Frontend**: Next.js (App Router), Tailwind CSS  
- **Backend**: Python (FastAPI / LangChain)  
- **Database**: Supabase（PostgreSQL / Vector Store）  
- **AI/LLM**: OpenAI GPT-4o / GPT-4o-mini  
- **External API**: OpenWeatherMap API  

---

## 📝 チーム開発ルール（Working Agreement）

### 1. Git / GitHub 運用

#### ブランチ戦略
- main: 本番
- develop: 開発統合
- feature/xxx: 機能開発

#### 命名規則
```
feature/add-weather-api
fix/login-error
```

#### コミットメッセージ
```feat: 天気APIの取得処理を追加
fix: ログインエラーを修正
refactor: APIクライアント整理
```

#### Pull Request
- 必ず **1人以上レビュー必須**
- 小さく出す（1PR = 1機能）

---

### 2. 環境変数の設定（初回のみ）
- .env.example をコピー
- .env を作成
- 各自の値を設定
```
 cp .env.example .env
```
※ .env はGitに含まれません

### 2-1．環境変数の管理
- `.env` は **絶対にコミット禁止** : /.gitignoreで管理されています
- `.env.example` を必ず更新
- 追加時はチームに共有

---

### 3. API仕様の同期（重要）
- フロント/バック間の **I/O変更は事前相談**
- JSON構造はドキュメント化する

#### トラブル時チェック
- APIキー
- エンドポイントURL
- データ型（string / number）

---

### 4. AI / RAG運用ルール
- 回答精度が悪い場合  
  → まず **DBのベクトルデータを確認**
- プロンプト調整は最後

---

## 🏃‍♂️ セットアップ（開発者向け）

### 1. リポジトリ取得 ※まずはプロジェクト一式を PC にダウンロードします。
```git clone <repo-url>
cd teamB_section_8
```
### 2. フロントエンド
```
cd frontend
npm install
npm run dev
```

### 3. バックエンド （仮）
```
！以下はバックエンド構築後に書き換え！
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### 4. 環境変数
```
cp .env.example .env
```

 ## 💡 開発環境の更新手順（パッケージ追加時）

他のメンバーが新しいライブラリを追加したり、環境設定を変更したりした場合、自分のローカル環境も最新の状態に更新し、コンテナをリビルドする必要があります。

### 🔄 更新のフロー

新しいパッケージが追加されたときは、ターミナルで以下のステップを実行するだけでOKです！

1. **最新のコードをローカルに取り込む**
   現在のブランチで最新のソースコードを取得します。

   ```bash
   git pull origin main
   ```
2. **コンテナを停止し、再構築（ビルド）して起動する**
   ```bash
   docker-compose down
   docker-compose up -d --build
   ```

### ❓ なぜ `--build` が必要なの？

`git pull` を実行してコード（`package.json` や `requirements.txt` など）が新しくなっても、起動中のコンテナ内にある環境は古いままだからです。
`--build` オプションを付けて実行することで、Dockerが設定ファイルの変更を検知し、新しいパッケージを自動でインストールして最新のイメージを作り直してくれます。

---

### 🆘 迷ったらこのコマンド！（トラブルシューティング）

「ライブラリが見つからない」というエラーが出たり、他の人のコードが動かなかったりしたら、まずは `git pull` して `--build` 付きで立ち上げ直すのがチーム開発の鉄則です。

もし「黄金フロー」を試してもパッケージが反映されない場合は、一度ボリュームを削除して、完全にクリーンな状態から立ち上げ直してみてください。

```bash
docker-compose down -v
docker-compose up -d --build
```

---

## 📂 ディレクトリ構成（例）
```
/frontend
/backend
/docs
```

---

## 💡 補足
- 困ったら **PR or Discordで即相談**
- 「止まらないこと」が最優先
- docs/ に設計書まとめる