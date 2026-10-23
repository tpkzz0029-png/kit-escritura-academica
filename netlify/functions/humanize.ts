// Función serverless de Netlify: expone POST /api/humanize.
// Reutiliza la misma lógica que el middleware de desarrollo de Vite y la
// función de Vercel (api/humanize-handler.ts). La clave del gateway Kimi se
// resuelve en el servidor (variable de entorno KIMI_AGENT_GW_KEY → clave de
// respaldo integrada); el navegador nunca la ve.

import { handleHumanize } from '../../api/humanize-handler'

type Event = { httpMethod?: string; body?: string | null }
type Result = { statusCode: number; headers: Record<string, string>; body: string }

export async function handler(event: Event): Promise<Result> {
  const headers = { 'Content-Type': 'application/json; charset=utf-8' }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Método no permitido' }) }
  }
  try {
    const body = event.body ? (JSON.parse(event.body) as unknown) : {}
    const { status, json } = await handleHumanize(body)
    return { statusCode: status, headers, body: JSON.stringify(json) }
  } catch {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Error interno del servidor de humanización.' }),
    }
  }
}
