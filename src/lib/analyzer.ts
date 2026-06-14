export type AnalysisResult = {
  summary: string
  concerns: string[]
  checkItems: string[]
}

const OLLAMA_URL = 'http://localhost:11434/api/chat'
const MODEL = 'qwen3:8b'

function buildPrompt(propertyText: string): string {
  return `あなたは賃貸物件の専門家です。以下の物件情報を読み、借主が見落としやすいリスクと、内見・契約前に具体的に確認すべき事項を日本語で指摘してください。

【厳守ルール】
- 物件情報に書いてある数字・事実をそのまま繰り返さない（「築29年なので古い」「家賃7万円」など自明な情報は不要）
- 表記がない・曖昧な点から推察できるリスクを優先する（管理費の記載なし・告知事項の有無・更新料・設備の欠如等）
- 懸念点は「なぜそれが問題か」の理由まで1文で書く
- 確認事項は「何を・誰に・どう確認するか」を具体的に書く（「確認する」だけは不可）
- summary は「賃料/間取り/専有面積/築年数/最寄り駅徒歩分数」の順で1行

【禁止出力の例】
{
  "summary": "70,000円の1DK物件、築29年、阿佐ケ谷駅12分",
  "concerns": ["築年数が古い", "管理費が高い", "駅から遠い"],
  "checkItems": ["管理費・敷金の詳細確認", "建物の状態確認", "契約条件確認"]
}
上記は掲載情報の言い換えのみで付加価値ゼロ。このような出力は厳禁。

【良い出力の例】
{
  "summary": "7万円/1DK/24.57㎡/築29年/阿佐ケ谷駅徒歩12分",
  "concerns": [
    "管理費が「-（なし）」表記のため共用部の清掃・電球交換等が住人の自己負担か不明。管理が個人対応だとクレーム窓口もない",
    "分譲賃貸かつ礼金なしの組み合わせは、オーナーが売却を検討中の可能性がある。入居後1〜2年で立退き要求が来るリスクがある"
  ],
  "checkItems": [
    "管理会社に「ゴミ置き場・廊下の電球切れは誰が対応するか」を書面で確認する",
    "契約書の中途解約特約と立退き料の有無を事前に確認し、口頭ではなく書面化してもらう"
  ]
}

物件情報:
${propertyText}

必ず以下のJSON形式のみで回答してください（説明文・前置き不要）:
{
  "summary": "賃料/間取り/専有面積/築年数/最寄り駅徒歩分数を1行で",
  "concerns": ["見落としやすいリスク（理由付き）"],
  "checkItems": ["具体的な確認事項（何を・誰に・どう確認するか）"]
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
        think: false,
        keep_alive: '1m',
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
    // qwen3 が thinking タグを混入させた場合に除去する
    const cleaned = content.replace(/<think>[\s\S]*?<\/think>/g, '').trim()
    const parsed: unknown = JSON.parse(cleaned)
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
