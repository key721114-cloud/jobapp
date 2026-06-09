import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite dev server에서 Node.js가 직접 채용포털을 fetch → CORS 없음
function jobProxyPlugin() {
  return {
    name: 'job-proxy',
    configureServer(server) {
      server.middlewares.use('/api/proxy', async (req, res) => {
        try {
          const qs = new URL(req.url, 'http://localhost')
          const targetUrl = qs.searchParams.get('url')
          if (!targetUrl) {
            res.statusCode = 400
            return res.end(JSON.stringify({ error: 'url 파라미터 필요' }))
          }

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

export default defineConfig({
  plugins: [react(), jobProxyPlugin()],
  server: {
    port: 5173,
    strictPort: true,
  },
})
