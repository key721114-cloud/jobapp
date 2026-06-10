import { request as httpsRequest } from 'node:https'

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

    const requestBody = {
      model: model || 'claude-sonnet-4-6',
      max_tokens: max_tokens || 1024,
      messages,
    }
    if (system) requestBody.system = system

    const jsonStr = JSON.stringify(requestBody)

    const { statusCode, responseJson } = await new Promise((resolve, reject) => {
      const chunks = []
      const r = httpsRequest(
        {
          hostname: 'api.anthropic.com',
          path: '/v1/messages',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(jsonStr, 'utf-8'),
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
          },
        },
        (response) => {
          response.on('data', (chunk) => chunks.push(chunk))
          response.on('end', () => {
            try {
              const text = Buffer.concat(chunks).toString('utf-8')
              resolve({ statusCode: response.statusCode, responseJson: JSON.parse(text) })
            } catch {
              reject(new Error('Claude API 응답 파싱 실패'))
            }
          })
        },
      )
      r.on('error', reject)
      r.write(jsonStr)
      r.end()
    })

    return res.status(statusCode).json(responseJson)
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}
