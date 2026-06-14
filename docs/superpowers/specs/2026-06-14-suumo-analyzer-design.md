# SUUMO 物件アナライザー 設計書

## Goal

SUUMO の物件 URL を貼ると、ローカル LLM（Ollama / qwen3:8b）が懸念点と確認推奨事項を出力する Web アプリ。

## Constraints

- 対応サイト：SUUMO のみ（境界明確化）
- LLM：Ollama (localhost:11434 / qwen3:8b)。API キー・課金なし
- デプロイ：ローカル動作を前提。Vercel 等は任意
- 認証・保存・複数物件比較は MVP スコープ外
- フロント・バックエンドともに自分で調整できる構成にする

## Acceptance Criteria

- SUUMO の賃貸物件 URL を入力すると物件情報が取得できる
- 懸念点リスト（⚠）と確認推奨事項リスト（✓）が表示される
- 件数サマリー（「懸念 N件 / 確認推奨 N件」）が一目でわかる
- SUUMO 以外の URL はエラーメッセージを表示する
- Ollama 未起動 / 応答なし時はエラーメッセージを表示する

---

## アーキテクチャ

```
[ブラウザ]
  └─ URL 入力フォーム (page.tsx)
       │ POST /api/analyze  { url: string }
       ▼
[Next.js API Route: /api/analyze/route.ts]
  1. URL バリデーション（suumo.jp を含むか）
  2. SUUMO ページを fetch（User-Agent 付き）
  3. cheerio で物件テキスト抽出
  4. Ollama localhost:11434/api/chat に送信
  5. JSON パース → 失敗時 1 回リトライ
  6. { summary, concerns, checkItems } を返却
       │
       ▼
[ブラウザ]
  └─ ResultCard.tsx で結果表示
```

## ファイル構成

```
src/
  app/
    page.tsx                  # URL 入力フォーム + 結果表示
    api/
      analyze/
        route.ts              # スクレイピング + Ollama 呼び出し
  lib/
    scraper.ts                # SUUMO HTML パーサー（cheerio）
    analyzer.ts               # Ollama API クライアント + プロンプト
  components/
    ResultCard.tsx            # 懸念点・確認事項の表示コンポーネント
```

## 技術スタック

| 役割 | 技術 | 備考 |
|---|---|---|
| フレームワーク | Next.js (App Router) | フロント・バックを一体管理 |
| HTML パース | cheerio | サーバーサイドのみで使用 |
| LLM | Ollama REST API | localhost:11434、ライブラリ不要 |
| スタイル | Tailwind CSS | |
| 言語 | TypeScript | strict モード |

## UI レイアウト（1 画面）

```
┌─────────────────────────────────────┐
│  SUUMO URL を貼ってください           │
│  [__________________________] [分析] │
├─────────────────────────────────────┤
│  ■ 物件サマリー                      │
│  家賃 9.5万 / 1LDK / 築15年 / 渋谷駅5分 │
├─────────────────────────────────────┤
│  ⚠ 懸念点  3件                       │
│  · 築年数の割に家賃が高め             │
│  · 告知事項欄が空白                  │
│  · 管理会社の記載なし                │
├─────────────────────────────────────┤
│  ✓ 確認推奨事項  5件                 │
│  · 管理費・共益費の内訳を確認         │
│  · 周辺騒音（道路・線路）を内見で確認 │
│  · ...                              │
└─────────────────────────────────────┘
```

## Ollama 連携仕様

- エンドポイント：`POST http://localhost:11434/api/chat`
- モデル：`qwen3:8b`
- オプション：`"format": "json"` で JSON 出力を強制
- 期待レスポンス：
  ```json
  {
    "summary": "家賃9.5万 / 1LDK / 築15年 / 渋谷駅5分",
    "concerns": ["懸念点1", "懸念点2"],
    "checkItems": ["確認事項1", "確認事項2"]
  }
  ```
- パース失敗時：同一プロンプトで 1 回リトライ。それでも失敗なら `{ error: "分析できませんでした" }`

## エラーハンドリング

| ケース | 対応 |
|---|---|
| SUUMO 以外の URL | 即時エラー表示（バリデーション） |
| SUUMO fetch 失敗 / ブロック | 「物件情報を取得できませんでした」 |
| Ollama 未起動 / タイムアウト | 「Ollama に接続できませんでした（localhost:11434）」 |
| JSON パース失敗（リトライ後） | 「分析できませんでした」 |

## スコープ外（v2 以降）

- 複数物件の比較
- 分析履歴の保存
- SUUMO 以外のサイト対応
- ユーザー認証
