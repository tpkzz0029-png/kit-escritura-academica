// Función serverless (Vercel/Netlify u otro runtime Node): expone POST
// /api/humanize. La lógica compartida vive en humanize-handler.ts, que
// también usa el middleware del servidor de desarrollo de Vite.

import { handleHumanize } from './humanize-handler'

type Req = { method?: string; body?: unknown }
type Res = {
  status: (n: number) => { json: (o: unknown) => void }
  setHeader?: (k: string, v: string) => void
}

export default async function handler(req: Req, res: Res): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido' })
    return
  }
  try {
    const { status, json } = await handleHumanize(req.body)
    res.status(status).json(json)
  } catch {
    res.status(500).json({ error: 'Error interno del servidor de humanización.' })
  }
}
