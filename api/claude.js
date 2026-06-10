export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY가 서버에 설정되지 않았습니다. Vercel 환경변수를 확인하세요.' })
  }

  try {
    const { messages, model, max_tokens, system } = req.body

    const body = {
      model: model || 'claude-sonnet-4-6',
      max_tokens: max_tokens || 1024,
      messages,
    }
    if (system) body.system = system

    const bodyBuf = Buffer.from(JSON.stringify(body), 'utf-8')
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Length': String(bodyBuf.length),
      },
      body: bodyBuf,
    })

    const data = await response.json()
    return res.status(response.status).json(data)
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}
