// Función serverless de Netlify: expone POST /api/translate.
// Reutiliza la misma lógica que el middleware de desarrollo de Vite y la
// función de Vercel (api/translate-handler.ts). La IA (Gemini o Perplexity) y
// su clave se leen de las variables de entorno (GEMINI_API_KEY, etc.)
// configuradas en Netlify, y el navegador nunca la ve.

import { handleTranslate } from '../../api/translate-handler'

type Event = { httpMethod?: string; body?: string | null }
type Result = { statusCode: number; headers: Record<string, string>; body: string }

export async function handler(event: Event): Promise<Result> {
  const headers = { 'Content-Type': 'application/json; charset=utf-8' }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Método no permitido' }) }
  }
  try {
    const body = event.body ? (JSON.parse(event.body) as unknown) : {}
    const { status, json } = await handleTranslate(body)
    return { statusCode: status, headers, body: JSON.stringify(json) }
  } catch {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Error interno del servidor de traducción.' }),
    }
  }
}
