import * as cheerio from 'cheerio'

export type PropertyData = {
  title: string
  rawText: string
}

function normalizeValue(raw: string): string | null {
  const v = raw.replace(/\s+/g, ' ').trim()
  if (!v || v === '-' || v === '－') return null
  return v
}

export function parsePropertyHtml(html: string): PropertyData {
  const $ = cheerio.load(html)
  const title = $('h1').first().text().trim()

  const isBuildingPage = $('.cassetteitem').length > 0
  const buildingWarning = isBuildingPage
    ? '※この URL は複数部屋がまとまった建物ページの可能性があります。特定の1部屋の情報ではないため、分析は概算になります。\n\n'
    : ''

  $('script, style, nav, footer, header, noscript, aside').remove()

  const specMap = new Map<string, string>()

  function extractFromRows(selector: string) {
    $(selector).each((_, tr) => {
      const cells = $(tr).children('th, td').toArray()
      for (let i = 0; i < cells.length - 1; i++) {
        if ($(cells[i]).is('th')) {
          const label = $(cells[i]).text().replace(/\s+/g, ' ').trim()
          const value = normalizeValue($(cells[i + 1]).text())
          if (label && value && !specMap.has(label)) specMap.set(label, value)
        }
      }
    })
  }

  // SUUMO 固有テーブルが存在すれば優先、なければ全テーブルにフォールバック（テスト用モック対応）
  const hasSuumoTables = $('table.property_view_table, table.data_table').length > 0
  if (hasSuumoTables) {
    extractFromRows('table.property_view_table tr') // 主要スペック（所在地・間取り・面積・築年数・駅徒歩等）
    extractFromRows('table.data_table tr')           // 建物詳細・費用・契約条件
  } else {
    extractFromRows('table tr') // 汎用フォールバック
  }

  // dl/dt/dd（設備・特徴が dl 形式の場合に対応）
  $('dl').each((_, dl) => {
    $(dl)
      .find('dt')
      .each((_, dt) => {
        const label = $(dt).text().replace(/\s+/g, ' ').trim()
        const value = normalizeValue($(dt).next('dd').text())
        if (label && value && !specMap.has(label)) specMap.set(label, value)
      })
  })

  // 設備系ラベルの値を読点・スラッシュで分解して個別語にする
  const featureItems: string[] = []
  for (const label of ['設備', '設備条件', '条件', '物件の特徴']) {
    const val = specMap.get(label)
    if (val) {
      val
        .split(/[、,，／/]/)
        .map((s) => s.trim())
        .filter((s) => s.length >= 2)
        .forEach((s) => featureItems.push(s))
    }
  }

  // リンクタグ除去後にメインコンテンツのテキストを取得
  // .property_view-detail は SUUMO 物件詳細の本体領域（ul li ノイズ要素を含む外側を除外）
  $('a').remove()
  const mainEl = $('main, .property_view-detail, article, #mainContents, .main').first()
  const bodyText = (mainEl.length ? mainEl : $('body'))
    .text()
    .replace(/\s+/g, ' ')
    .trim()

  const specLines = [...specMap.entries()].map(([k, v]) => `${k}: ${v}`).join('\n')
  const featuresSection =
    featureItems.length > 0
      ? `\n\n【設備・特徴】\n${[...new Set(featureItems)].join(' / ')}`
      : ''

  const combined =
    buildingWarning + `【物件詳細】\n${specLines}${featuresSection}\n\n【その他情報】\n${bodyText}`

  return { title, rawText: combined.slice(0, 6000) }
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
  return parsePropertyHtml(await res.text())
}
