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
