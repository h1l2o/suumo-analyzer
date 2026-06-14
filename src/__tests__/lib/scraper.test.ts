import { parsePropertyHtml } from '@/lib/scraper'

const MOCK_HTML = `
<html>
<head><title>テスト物件</title></head>
<body>
  <script>alert('remove me')</script>
  <nav>グローバルナビゲーション</nav>
  <main>
    <h1>渋谷区の1LDK</h1>
    <table>
      <tr><td>家賃</td><td>9.5万円</td></tr>
      <tr><td>間取り</td><td>1LDK</td></tr>
      <tr><td>築年数</td><td>15年</td></tr>
      <tr><th>構造</th><td>鉄骨造</td><th>所在階</th><td>3階</td></tr>
      <tr><th>礼金</th><td>-</td></tr>
    </table>
    <dl>
      <dt>管理費</dt><dd>5,000円</dd>
      <dt>敷金</dt><dd>1ヶ月</dd>
      <dt>設備</dt><dd>バルコニー、エアコン、光ファイバー</dd>
    </dl>
    <ul>
      <li>バス・トイレ別</li>
      <li>オートロック</li>
      <li><a href="/nav">ナビリンク</a></li>
    </ul>
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
    expect(result.rawText).not.toContain('グローバルナビゲーション')
    expect(result.rawText).not.toContain('フッター')
  })

  it('物件情報のテキストを含む', () => {
    const result = parsePropertyHtml(MOCK_HTML)
    expect(result.rawText).toContain('9.5万円')
    expect(result.rawText).toContain('1LDK')
  })

  it('rawText は 6000 文字以内', () => {
    const result = parsePropertyHtml(MOCK_HTML)
    expect(result.rawText.length).toBeLessThanOrEqual(6000)
  })

  it('dt/dd の構造化データを "ラベル: 値" 形式で含む', () => {
    const result = parsePropertyHtml(MOCK_HTML)
    expect(result.rawText).toContain('管理費: 5,000円')
    expect(result.rawText).toContain('敷金: 1ヶ月')
  })

  it('リンクなし li を設備リストとして含み、リンクあり li は除外する', () => {
    const result = parsePropertyHtml(MOCK_HTML)
    expect(result.rawText).toContain('バス・トイレ別')
    expect(result.rawText).toContain('オートロック')
    expect(result.rawText).not.toContain('ナビリンク')
  })

  it('横並び th/td ペアの1行から複数ラベル:値を抽出する', () => {
    const result = parsePropertyHtml(MOCK_HTML)
    expect(result.rawText).toContain('構造: 鉄骨造')
    expect(result.rawText).toContain('所在階: 3階')
  })

  it('"-" の値は構造化セクションに出力しない', () => {
    const result = parsePropertyHtml(MOCK_HTML)
    expect(result.rawText).not.toContain('礼金: -')
  })

  it('読点区切りの設備文字列を個別語として特徴リストに含む', () => {
    const result = parsePropertyHtml(MOCK_HTML)
    expect(result.rawText).toContain('バルコニー')
    expect(result.rawText).toContain('エアコン')
    expect(result.rawText).toContain('光ファイバー')
  })
})
