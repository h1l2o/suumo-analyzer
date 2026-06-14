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
