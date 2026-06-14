# SUUMO 物件アナライザー 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** SUUMO の賃貸物件 URL を貼ると Ollama (qwen3:8b) が懸念点・確認推奨事項を返す Next.js Web アプリを作る

**Architecture:** Next.js API Route が SUUMO ページをスクレイピングし cheerio でテキスト抽出、Ollama にプロンプトを送って JSON で結果を受け取る。フロントはシングルページで URL 入力 → 結果表示のみ。

**Tech Stack:** Next.js 15 (App Router) / TypeScript (strict) / cheerio / Tailwind CSS / Ollama localhost:11434

---

## ファイル構成

```
src/
  app/
    page.tsx                     # URL フォーム + 結果表示（フロント全体）
    api/analyze/route.ts         # POST エンドポイント（スクレイプ + Ollama 呼び出し）
  lib/
    scraper.ts                   # SUUMO HTML パーサー（cheerio）
    analyzer.ts                  # Ollama API クライアント + プロンプト
  components/
    ResultCard.tsx               # 懸念点・確認事項の表示カード
  __tests__/
    lib/scraper.test.ts          # scraper の単体テスト
    lib/analyzer.test.ts         # analyzer の単体テスト
```

---

## Task 1: プロジェクトセットアップ

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts` など (create-next-app が生成)
- Create: `jest.config.ts`

- [ ] **Step 1: Next.js プロジェクトを初期化**

```bash
cd C:/Users/hiro2/Dev/Private/suumo-analyzer
npx create-next-app@latest . --typescript --tailwind --app --src-dir --no-import-alias --eslint --yes
```

期待: `package.json`, `tsconfig.json`, `src/app/` 等が生成される

- [ ] **Step 2: cheerio と Jest をインストール**

```bash
npm install cheerio
npm install --save-dev jest jest-environment-node @types/jest
```

- [ ] **Step 3: jest.config.ts を作成**

```typescript
// jest.config.ts
import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({ dir: './' })

const config: Config = {
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
}

export default createJestConfig(config)
```

- [ ] **Step 4: tsconfig.json の strict モードを確認**

`tsconfig.json` に `"strict": true` があること、なければ追加する。

- [ ] **Step 5: テストコマンドを確認**

```bash
npx jest --version
```

期待: バージョン番号が出る

- [ ] **Step 6: git init とコミット**

```bash
git init
git add .
git commit -m "chore: Next.js プロジェクト初期化"
```

---

## Task 2: SUUMO スクレイパー実装 (lib/scraper.ts)

**Files:**
- Create: `src/lib/scraper.ts`
- Create: `src/__tests__/lib/scraper.test.ts`

- [ ] **Step 1: テストファイルを作成（失敗するテストを書く）**

```typescript
// src/__tests__/lib/scraper.test.ts
import { parsePropertyHtml } from '@/lib/scraper'

const MOCK_HTML = `
<html>
<head><title>テスト物件</title></head>
<body>
  <script>alert('remove me')</script>
  <nav>ナビ</nav>
  <main>
    <h1>渋谷区の1LDK</h1>
    <table>
      <tr><td>家賃</td><td>9.5万円</td></tr>
      <tr><td>間取り</td><td>1LDK</td></tr>
      <tr><td>築年数</td><td>15年</td></tr>
    </table>
    <p>告知事項なし</p>
  </main>
  <footer>フッター</footer>
</body>
</html>
`

describe('parsePropertyHtml', () => {
  it('h1 のテキストをタイトルとして返す', () => {
    const result = parsePropertyHtml(MOCK_HTML)
    expect(result.title).toBe('渋谷区の1LDK')
  })

  it('script・nav・footer のテキストを除外する', () => {
    const result = parsePropertyHtml(MOCK_HTML)
    expect(result.rawText).not.toContain("alert('remove me')")
    expect(result.rawText).not.toContain('ナビ')
    expect(result.rawText).not.toContain('フッター')
  })

  it('物件情報のテキストを含む', () => {
    const result = parsePropertyHtml(MOCK_HTML)
    expect(result.rawText).toContain('9.5万円')
    expect(result.rawText).toContain('1LDK')
  })

  it('rawText は 3000 文字以内', () => {
    const result = parsePropertyHtml(MOCK_HTML)
    expect(result.rawText.length).toBeLessThanOrEqual(3000)
  })
})
```

- [ ] **Step 2: テストが失敗することを確認**

```bash
npx jest src/__tests__/lib/scraper.test.ts
```

期待: `Cannot find module '@/lib/scraper'` などのエラー

- [ ] **Step 3: scraper.ts を実装**

```typescript
// src/lib/scraper.ts
import * as cheerio from 'cheerio'

export type PropertyData = {
  title: string
  rawText: string
}

export function parsePropertyHtml(html: string): PropertyData {
  const $ = cheerio.load(html)
  const title = $('h1').first().text().trim()
  $('script, style, nav, footer, header, noscript').remove()
  const rawText = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 3000)
  return { title, rawText }
}

export async function scrapeProperty(url: string): Promise<PropertyData> {
  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    },
    signal: AbortSignal.timeout(15000),
  })
  if (!res.ok) throw new Error(`SUUMO fetch failed: ${res.status}`)
  const html = await res.text()
  return parsePropertyHtml(html)
}
```

- [ ] **Step 4: テストが通ることを確認**

```bash
npx jest src/__tests__/lib/scraper.test.ts
```

期待: `4 passed`

- [ ] **Step 5: コミット**

```bash
git add src/lib/scraper.ts src/__tests__/lib/scraper.test.ts
git commit -m "feat: SUUMO HTML パーサーを実装"
```

---

## Task 3: Ollama アナライザー実装 (lib/analyzer.ts)

**Files:**
- Create: `src/lib/analyzer.ts`
- Create: `src/__tests__/lib/analyzer.test.ts`

- [ ] **Step 1: テストファイルを作成（失敗するテストを書く）**

```typescript
// src/__tests__/lib/analyzer.test.ts
import { analyzeProperty, type AnalysisResult } from '@/lib/analyzer'

const VALID_RESPONSE: AnalysisResult = {
  summary: '家賃9.5万 / 1LDK / 築15年 / 渋谷駅5分',
  concerns: ['築年数の割に家賃が高め'],
  checkItems: ['管理費の内訳を確認'],
}

describe('analyzeProperty', () => {
  beforeEach(() => {
    global.fetch = jest.fn()
  })

  it('Ollama が正常な JSON を返した場合 AnalysisResult を返す', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: { content: JSON.stringify(VALID_RESPONSE) } }),
    })

    const result = await analyzeProperty('テスト物件テキスト')
    expect(result.summary).toBe(VALID_RESPONSE.summary)
    expect(result.concerns).toEqual(VALID_RESPONSE.concerns)
    expect(result.checkItems).toEqual(VALID_RESPONSE.checkItems)
  })

  it('1回目が不正 JSON でも 2回目で成功すれば結果を返す', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: { content: 'invalid json' } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: { content: JSON.stringify(VALID_RESPONSE) } }),
      })

    const result = await analyzeProperty('テスト物件テキスト')
    expect(result.summary).toBe(VALID_RESPONSE.summary)
  })

  it('2回ともパース失敗の場合 Error を投げる', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ message: { content: 'not json' } }),
    })

    await expect(analyzeProperty('テスト物件テキスト')).rejects.toThrow('分析できませんでした')
  })

  it('Ollama に接続できない場合 Error を投げる', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValue(new TypeError('fetch failed'))

    await expect(analyzeProperty('テスト物件テキスト')).rejects.toThrow(
      'Ollama に接続できませんでした'
    )
  })
})
```

- [ ] **Step 2: テストが失敗することを確認**

```bash
npx jest src/__tests__/lib/analyzer.test.ts
```

期待: `Cannot find module '@/lib/analyzer'` などのエラー

- [ ] **Step 3: analyzer.ts を実装**

```typescript
// src/lib/analyzer.ts

export type AnalysisResult = {
  summary: string
  concerns: string[]
  checkItems: string[]
}

const OLLAMA_URL = 'http://localhost:11434/api/chat'
const MODEL = 'qwen3:8b'

function buildPrompt(propertyText: string): string {
  return `以下の賃貸物件情報を分析してください。

物件情報:
${propertyText}

必ず以下のJSON形式のみで回答してください（説明文・前置き不要）:
{
  "summary": "家賃・間取り・築年数・駅距離を1行で簡潔に",
  "concerns": ["懸念点1", "懸念点2"],
  "checkItems": ["確認推奨事項1", "確認推奨事項2"]
}`
}

function isValidResult(parsed: unknown): parsed is AnalysisResult {
  if (typeof parsed !== 'object' || parsed === null) return false
  const p = parsed as Record<string, unknown>
  return (
    typeof p['summary'] === 'string' &&
    Array.isArray(p['concerns']) &&
    Array.isArray(p['checkItems'])
  )
}

async function callOllama(propertyText: string): Promise<AnalysisResult | null> {
  let res: Response
  try {
    res = await fetch(OLLAMA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        format: 'json',
        stream: false,
        messages: [{ role: 'user', content: buildPrompt(propertyText) }],
      }),
      signal: AbortSignal.timeout(60000),
    })
  } catch {
    throw new Error('Ollama に接続できませんでした (localhost:11434)')
  }

  if (!res.ok) return null

  try {
    const data = (await res.json()) as { message?: { content?: string } }
    const content = data.message?.content
    if (!content) return null
    const parsed: unknown = JSON.parse(content)
    return isValidResult(parsed) ? parsed : null
  } catch {
    return null
  }
}

export async function analyzeProperty(propertyText: string): Promise<AnalysisResult> {
  const first = await callOllama(propertyText)
  if (first) return first
  const second = await callOllama(propertyText)
  if (second) return second
  throw new Error('分析できませんでした')
}
```

- [ ] **Step 4: テストが通ることを確認**

```bash
npx jest src/__tests__/lib/analyzer.test.ts
```

期待: `4 passed`

- [ ] **Step 5: コミット**

```bash
git add src/lib/analyzer.ts src/__tests__/lib/analyzer.test.ts
git commit -m "feat: Ollama アナライザーを実装"
```

---

## Task 4: API Route 実装 (app/api/analyze/route.ts)

**Files:**
- Create: `src/app/api/analyze/route.ts`

- [ ] **Step 1: route.ts を実装**

```typescript
// src/app/api/analyze/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { scrapeProperty } from '@/lib/scraper'
import { analyzeProperty, type AnalysisResult } from '@/lib/analyzer'

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = (await req.json()) as { url?: unknown }
  const url = body.url

  if (typeof url !== 'string' || !url.includes('suumo.jp')) {
    return NextResponse.json(
      { error: 'SUUMO の URL を入力してください（suumo.jp のリンク）' },
      { status: 400 }
    )
  }

  let propertyData
  try {
    propertyData = await scrapeProperty(url)
  } catch {
    return NextResponse.json({ error: '物件情報を取得できませんでした' }, { status: 502 })
  }

  let result: AnalysisResult
  try {
    result = await analyzeProperty(propertyData.rawText)
  } catch (err) {
    const message = err instanceof Error ? err.message : '分析できませんでした'
    return NextResponse.json({ error: message }, { status: 502 })
  }

  return NextResponse.json(result)
}
```

- [ ] **Step 2: 全テストが通ることを確認**

```bash
npx jest
```

期待: `scraper: 4 passed`, `analyzer: 4 passed`

- [ ] **Step 3: コミット**

```bash
git add src/app/api/analyze/route.ts
git commit -m "feat: /api/analyze エンドポイントを実装"
```

---

## Task 5: ResultCard コンポーネント実装

**Files:**
- Create: `src/components/ResultCard.tsx`

- [ ] **Step 1: ResultCard.tsx を実装**

```typescript
// src/components/ResultCard.tsx
import type { AnalysisResult } from '@/lib/analyzer'

type Props = {
  result: AnalysisResult
}

export function ResultCard({ result }: Props) {
  return (
    <div className="mt-6 space-y-4">
      {/* サマリー */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <p className="text-sm font-medium text-gray-500">物件サマリー</p>
        <p className="mt-1 text-base text-gray-900">{result.summary}</p>
      </div>

      {/* 懸念点 */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm font-medium text-amber-700">
          ⚠ 懸念点 {result.concerns.length}件
        </p>
        <ul className="mt-2 space-y-1">
          {result.concerns.map((item, i) => (
            <li key={i} className="text-sm text-amber-900">
              · {item}
            </li>
          ))}
        </ul>
      </div>

      {/* 確認推奨事項 */}
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
        <p className="text-sm font-medium text-emerald-700">
          ✓ 確認推奨事項 {result.checkItems.length}件
        </p>
        <ul className="mt-2 space-y-1">
          {result.checkItems.map((item, i) => (
            <li key={i} className="text-sm text-emerald-900">
              · {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: コミット**

```bash
git add src/components/ResultCard.tsx
git commit -m "feat: ResultCard コンポーネントを実装"
```

---

## Task 6: メインページ実装 (app/page.tsx)

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: page.tsx を実装**

```typescript
// src/app/page.tsx
'use client'

import { useState } from 'react'
import { ResultCard } from '@/components/ResultCard'
import type { AnalysisResult } from '@/lib/analyzer'

type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; result: AnalysisResult }
  | { status: 'error'; message: string }

export default function Home() {
  const [url, setUrl] = useState('')
  const [state, setState] = useState<State>({ status: 'idle' })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setState({ status: 'loading' })

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      const data = (await res.json()) as AnalysisResult | { error: string }

      if (!res.ok || 'error' in data) {
        setState({ status: 'error', message: 'error' in data ? data.error : '不明なエラー' })
        return
      }

      setState({ status: 'success', result: data })
    } catch {
      setState({ status: 'error', message: 'サーバーに接続できませんでした' })
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900">SUUMO 物件アナライザー</h1>
      <p className="mt-1 text-sm text-gray-500">SUUMO の賃貸物件 URL を貼ると懸念点を出します</p>

      <form onSubmit={handleSubmit} className="mt-6 flex gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://suumo.jp/chintai/jnc_..."
          required
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={state.status === 'loading'}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {state.status === 'loading' ? '分析中...' : '分析'}
        </button>
      </form>

      {state.status === 'error' && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {state.message}
        </div>
      )}

      {state.status === 'success' && <ResultCard result={state.result} />}
    </main>
  )
}
```

- [ ] **Step 2: デフォルトの `globals.css` と `page.tsx` を確認し、Tailwind が有効なことを確認**

`src/app/globals.css` に `@tailwind base;` 等が含まれていること。

- [ ] **Step 3: コミット**

```bash
git add src/app/page.tsx
git commit -m "feat: メインページを実装"
```

---

## Task 7: 動作確認

- [ ] **Step 1: 開発サーバーを起動**

```bash
npm run dev
```

期待: `http://localhost:3000` でサーバーが起動する

- [ ] **Step 2: ブラウザで http://localhost:3000 を開く**

フォームが表示されること。

- [ ] **Step 3: 無効な URL でエラーが出ることを確認**

`https://example.com` を入力 → 「SUUMO の URL を入力してください」が表示されること。

- [ ] **Step 4: 実際の SUUMO URL で分析を実行**

SUUMO で適当な賃貸物件を開き URL をコピー → フォームに貼り付け → 分析ボタン → 懸念点・確認推奨事項が表示されること。

Ollama が起動していない場合は先に起動する:

```bash
ollama serve
```

- [ ] **Step 5: 最終コミット**

```bash
git add .
git commit -m "chore: 動作確認完了"
```
