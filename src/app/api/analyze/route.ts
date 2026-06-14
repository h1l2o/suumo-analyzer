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
