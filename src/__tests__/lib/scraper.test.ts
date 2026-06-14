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
