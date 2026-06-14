# SUUMO アナライザー

SUUMO の物件ページ URL を入力すると、ローカル LLM が掲載情報の空白・組み合わせから**見落としやすいリスク**と**具体的な確認事項**を日本語で出力するツールです。

「築年数が古い」「初期費用が高い」といった掲載値の言い換えではなく、管理費未記載の意味・木造最上階の夏季リスク・礼金と建物種別の組み合わせから読み取れる立退きリスクなど、不動産の経験がないと気づきにくい観点を指摘します。

## スタック

| 役割 | 技術 |
|------|------|
| フレームワーク | Next.js 15 (App Router) |
| スクレイピング | cheerio（サーバーサイド静的 HTML パース）|
| LLM | Ollama + qwen3:8b（ローカル実行）|
| 言語 | TypeScript (strict) |
| スタイリング | Tailwind CSS |
| テスト | Jest |

## 前提条件

- Node.js 18 以上
- [Ollama](https://ollama.com/) がインストール済みで起動していること

```bash
# qwen3:8b を未取得の場合
ollama pull qwen3:8b
```

## セットアップ

```bash
git clone https://github.com/h1l2o/suumo-analyzer.git
cd suumo-analyzer
npm install
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開き、SUUMO の物件詳細 URL を入力してください。

## 使い方

1. SUUMO の物件詳細ページの URL をコピー（例: `https://suumo.jp/chintai/jnc_XXXXXXXXXX/`）
2. 入力欄に貼り付けて「分析する」をクリック
3. 物件サマリー・懸念点・確認推奨事項が表示されます

> **Note:** 分析には Ollama（`localhost:11434`）が必要です。起動していない場合はエラーが表示されます。

## アーキテクチャ

```
ブラウザ
  └─ POST /api/analyze (Next.js Route Handler)
       ├─ scraper.ts  → fetch + cheerio で HTML をパース → 構造化テキスト
       └─ analyzer.ts → Ollama REST API (qwen3:8b) → JSON 形式の分析結果
```

SUUMO 固有のテーブルクラス（`property_view_table` / `data_table`）を対象に取得することで、検索フィルターや関連物件リストのノイズを除外しています。

## テスト

```bash
npm test
```

## 設計判断の記録

技術選定・アーキテクチャの判断根拠は [`docs/RATIONALE.md`](docs/RATIONALE.md) にまとめています。
