import { analyzeProperty, type AnalysisResult } from '@/lib/analyzer'

const VALID_RESPONSE: AnalysisResult = {
  summary: '家賃9.5万 / 1LDK / 築15年 / 渋谷駅5分',
  concerns: ['築年数の割に家賃が高め'],
  checkItems: ['管理費の内訳を確認'],
}

describe('analyzeProperty', () => {
  beforeEach(() => {
    global.fetch = jest.fn()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('Ollama が正常な JSON を返した場合 AnalysisResult を返す', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: { content: JSON.stringify(VALID_RESPONSE) } }),
    })

    const result = await analyzeProperty('テスト物件テキスト')
    expect(result.summary).toBe(VALID_RESPONSE.summary)
    expect(result.concerns).toEqual(VALID_RESPONSE.concerns)
    expect(result.checkItems).toEqual(VALID_RESPONSE.checkItems)
  })

  it('1回目が不正 JSON でも 2回目で成功すれば結果を返す', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: { content: 'invalid json' } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: { content: JSON.stringify(VALID_RESPONSE) } }),
      })

    const result = await analyzeProperty('テスト物件テキスト')
    expect(result.summary).toBe(VALID_RESPONSE.summary)
  })

  it('2回ともパース失敗の場合 Error を投げる', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ message: { content: 'not json' } }),
    })

    await expect(analyzeProperty('テスト物件テキスト')).rejects.toThrow('分析できませんでした')
  })

  it('Ollama に接続できない場合 Error を投げる', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValue(new TypeError('fetch failed'))

    await expect(analyzeProperty('テスト物件テキスト')).rejects.toThrow(
      'Ollama に接続できませんでした'
    )
  })
})
