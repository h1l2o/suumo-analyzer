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
    (p['concerns'] as unknown[]).every((c) => typeof c === 'string') &&
    Array.isArray(p['checkItems']) &&
    (p['checkItems'] as unknown[]).every((c) => typeof c === 'string')
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
