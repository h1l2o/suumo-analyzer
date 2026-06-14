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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <main className="mx-auto max-w-2xl px-4 py-14">

        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex items-center gap-2.5">
            <span className="text-3xl">🏠</span>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              SUUMO アナライザー
            </h1>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
            SUUMO の賃貸物件 URL を貼ると、掲載情報の空白・組み合わせから
            <br className="hidden sm:inline" />
            見落としやすいリスクと確認事項をローカル LLM が出力します。
          </p>
        </div>

        {/* 入力フォーム */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://suumo.jp/chintai/jnc_..."
              required
              disabled={state.status === 'loading'}
              className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500 dark:focus:ring-blue-400"
            />
            <button
              type="submit"
              disabled={state.status === 'loading'}
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white transition-opacity hover:bg-blue-500 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-400"
            >
              分析
            </button>
          </form>

          <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
            Ollama（localhost:11434）+ qwen3:8b が起動している必要があります。分析には 30〜60 秒かかります。
          </p>
        </div>

        {/* ローディング */}
        {state.status === 'loading' && (
          <div className="mt-10 flex flex-col items-center gap-4 text-gray-400 dark:text-gray-500">
            <svg
              className="h-7 w-7 animate-spin text-blue-500 dark:text-blue-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-sm">物件情報を取得・分析しています…</p>
          </div>
        )}

        {/* エラー */}
        {state.status === 'error' && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">
            {state.message}
          </div>
        )}

        {/* 結果 */}
        {state.status === 'success' && <ResultCard result={state.result} />}

      </main>
    </div>
  )
}
