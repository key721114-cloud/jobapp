export default async function handler(req, res) {
  const targetUrl = req.query?.url
  if (!targetUrl) {
    return res.status(400).json({ error: 'url 파라미터 필요' })
  }

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8',
        'Accept-Encoding': 'identity',
        'Referer': new URL(targetUrl).origin,
        'Cache-Control': 'no-cache',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(10000),
    })

    if (!response.ok) {
      return res.status(response.status).json({ error: `포털 응답 오류: ${response.status}` })
    }

    const html = await response.text()
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    return res.status(200).json({ contents: html, status: response.status })
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}
