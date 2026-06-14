import type { AnalysisResult } from '@/lib/analyzer'

type Props = {
  result: AnalysisResult
}

export function ResultCard({ result }: Props) {
  return (
    <div className="mt-6 space-y-4">

      {/* サマリー */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
          物件サマリー
        </p>
        <p className="mt-2 text-base font-medium text-gray-900 dark:text-gray-100">
          {result.summary}
        </p>
      </div>

      {/* 懸念点 */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="border-b border-gray-100 px-5 py-3 dark:border-gray-800">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 dark:text-amber-400">
            ⚠ 懸念点 {result.concerns.length} 件
          </p>
        </div>
        <ol className="divide-y divide-gray-100 dark:divide-gray-800">
          {result.concerns.map((item, i) => (
            <li key={i} className="flex gap-3 px-5 py-4">
              <span className="mt-0.5 shrink-0 text-xs font-bold text-amber-400 dark:text-amber-500">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">{item}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* 確認推奨事項 */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="border-b border-gray-100 px-5 py-3 dark:border-gray-800">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-500 dark:text-emerald-400">
            ✓ 確認推奨事項 {result.checkItems.length} 件
          </p>
        </div>
        <ol className="divide-y divide-gray-100 dark:divide-gray-800">
          {result.checkItems.map((item, i) => (
            <li key={i} className="flex gap-3 px-5 py-4">
              <span className="mt-0.5 shrink-0 text-xs font-bold text-emerald-400 dark:text-emerald-500">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">{item}</span>
            </li>
          ))}
        </ol>
      </div>

    </div>
  )
}
