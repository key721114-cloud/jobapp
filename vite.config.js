import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { request as httpsRequest } from 'node:https'

// Vite dev server에서 Node.js가 직접 채용포털을 fetch → CORS 없음
function jobProxyPlugin() {
  return {
    name: 'job-proxy',
    configureServer(server) {
      server.middlewares.use('/api/proxy', async (req, res) => {
        try {
          const qs = new URL(req.url, 'http://localhost')
          const rawUrl = qs.searchParams.get('url')
          if (!rawUrl) {
            res.statusCode = 400
            return res.end(JSON.stringify({ error: 'url 파라미터 필요' }))
          }

          // URL 정규화: 한국어 등 비ASCII 문자를 percent-encode
          const targetUrl = new URL(rawUrl).href

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
            res.statusCode = response.status
            return res.end(JSON.stringify({ error: `포털 응답 오류: ${response.status}` }))
          }

          const html = await response.text()
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.setHeader('Access-Control-Allow-Origin', '*')
          res.end(JSON.stringify({ contents: html, status: response.status }))
        } catch (e) {
          res.statusCode = 500
          res.end(JSON.stringify({ error: e.message }))
        }
      })
    },
  }
}

// 개발 서버에서 Claude API를 직접 호출 — node:https로 undici ByteString 이슈 완전 우회
function claudeApiPlugin(apiKey) {
  return {
    name: 'claude-api',
    configureServer(server) {
      server.middlewares.use('/api/claude', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.setHeader('Content-Type', 'application/json')
          return res.end(JSON.stringify({ error: 'Method not allowed' }))
        }

        if (!apiKey) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          return res.end(JSON.stringify({
            error: 'ANTHROPIC_API_KEY가 설정되지 않았습니다. 프로젝트 루트에 .env.local 파일을 만들고 ANTHROPIC_API_KEY=sk-ant-... 를 추가하세요.',
          }))
        }

        let body = ''
        req.on('data', chunk => { body += chunk.toString() })
        req.on('end', async () => {
          try {
            const { messages, model, max_tokens, system } = JSON.parse(body)
            const reqBody = {
              model: model || 'claude-sonnet-4-6',
              max_tokens: max_tokens || 1024,
              messages,
            }
            if (system) reqBody.system = system

            const jsonStr = JSON.stringify(reqBody)

            const { statusCode, data } = await new Promise((resolve, reject) => {
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
                  response.on('data', c => chunks.push(c))
                  response.on('end', () => {
                    try {
                      const text = Buffer.concat(chunks).toString('utf-8')
                      resolve({ statusCode: response.statusCode, data: JSON.parse(text) })
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

            res.statusCode = statusCode
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.end(JSON.stringify(data))
          } catch (e) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: e.message }))
          }
        })
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), jobProxyPlugin(), claudeApiPlugin(env.ANTHROPIC_API_KEY)],
    server: {
      port: 5173,
      strictPort: true,
    },
  }
})
