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
