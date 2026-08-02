# 日々録（daily-log）

毎日の日記をログとして残し、成長につなげるための自分専用Webアプリ。

- **今日**: 日記フォーマット（うまくいったこと / 感謝 / 健康 / つながり / セルフトーク / 学び）に沿って記帳。保存後に **AIカウンセラーのレビュー**（Claude API）を生成できます
- **記録**: カレンダーと一覧で過去の日記を振り返り。継続日数（ストリーク）表示
- **目標**: 「明日の目標」を立てて、あとから ⚪︎ / △ / × で達成を記録。達成率を集計
- **振り返り**: 週次・月次で「うまくいったこと」「学び」「感謝」を集約表示

## 技術構成

- Next.js 16 (App Router) + Tailwind CSS v4
- Cloudflare Workers（[@opennextjs/cloudflare](https://opennext.js.org/cloudflare)）
- Cloudflare D1 + Drizzle ORM
- Claude API（`claude-opus-4-8`）でカウンセラーレビュー生成
- 認証: 自分専用のパスワードログイン（HMAC署名Cookie）

## ローカル開発

```bash
npm install

# ローカルD1にマイグレーション適用
npm run db:migrate:local

# 初回のみ: .dev.vars を作成して編集
cp .dev.vars.example .dev.vars

npm run dev
# http://localhost:3000
```

`.dev.vars` の例:

```
APP_PASSWORD=好きなパスワード
AUTH_SECRET=ランダムな長い文字列
ANTHROPIC_API_KEY=sk-ant-...
```

## デプロイ（Cloudflare）

1. D1データベースを作成し、IDを `wrangler.jsonc` に反映

   ```bash
   npx wrangler d1 create daily-log-db
   # 出力された database_id を wrangler.jsonc の REPLACE_WITH_YOUR_D1_DATABASE_ID に貼る
   ```

2. 本番DBにマイグレーション適用

   ```bash
   npm run db:migrate:remote
   ```

3. シークレットを設定

   ```bash
   npx wrangler secret put APP_PASSWORD
   npx wrangler secret put AUTH_SECRET      # openssl rand -hex 32 などで生成
   npx wrangler secret put ANTHROPIC_API_KEY
   ```

4. デプロイ

   ```bash
   npm run deploy
   ```

## スクリプト

| コマンド | 内容 |
| --- | --- |
| `npm run dev` | ローカル開発（next dev + wranglerプロキシでD1バインディング利用） |
| `npm run preview` | Workersランタイムでローカル実行 |
| `npm run deploy` | ビルドしてCloudflareへデプロイ |
| `npm run db:migrate:local` / `:remote` | D1マイグレーション適用 |
| `npm run cf-typegen` | wrangler.jsonc から環境の型定義を再生成 |
