import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig, type Plugin } from "vite"
import { inspectAttr } from 'kimi-plugin-inspect-react'
import { handleHumanize } from './api/humanize-handler'

// Proxy interno para desarrollo: la app llama a /api/humanize y el
// middleware lo resuelve aquí (la clave del gateway vive solo en el
// servidor, nunca en el navegador). Al desplegar, api/humanize.ts actúa
// como función serverless con la misma lógica.
function humanizeApi(): Plugin {
  return {
    name: 'humanize-api',
    configureServer(server) {
      server.middlewares.use('/api/humanize', (req, res) => {
        void (async () => {
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          if (req.method !== 'POST') {
            res.statusCode = 405
            res.end(JSON.stringify({ error: 'Método no permitido' }))
            return
          }
          try {
            const chunks: Buffer[] = []
            for await (const chunk of req) chunks.push(chunk as Buffer)
            const body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')
            const { status, json } = await handleHumanize(body)
            res.statusCode = status
            res.end(JSON.stringify(json))
          } catch {
            res.statusCode = 500
            res.end(JSON.stringify({ error: 'Error interno del proxy de humanización.' }))
          }
        })()
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [inspectAttr(), react(), humanizeApi()],
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
