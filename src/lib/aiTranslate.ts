// Traducción vía el proxy interno de la app (/api/translate), con la misma
// clave de IA que el humanizador (solo en el servidor). Igual que la
// humanización, el texto largo se divide en trozos por párrafos para no
// superar el límite de ~10 s de las funciones serverless de Netlify.

import { splitIntoChunks } from '@/lib/aiHumanize'

export type TranslateTarget = 'en' | 'es'
export type TranslateStyle = 'normal' | 'literal'

async function translateChunk(
  text: string,
  target: TranslateTarget,
  style: TranslateStyle
): Promise<string> {
  const url = new URL('/api/translate', window.location.origin).toString()

  let res: Response
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, target, style }),
    })
  } catch {
    throw new Error('No se pudo contactar con el servidor de traducción. Reintenta.')
  }

  let data: { text?: string; error?: string } = {}
  try {
    data = await res.json()
  } catch {
    // cuerpo no JSON
  }

  if (!res.ok || data.error) {
    if (res.status === 404) {
      throw new Error(
        'El servidor de traducción no está disponible en este alojamiento (falta la función /api/translate).'
      )
    }
    throw new Error(data.error || `El servidor respondió con error ${res.status}.`)
  }
  if (!data.text || !data.text.trim()) {
    throw new Error('La IA respondió sin contenido. Reintenta.')
  }
  return data.text.trim()
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** Traduce un texto completo, troceándolo por párrafos si es largo.
 *  onProgress recibe mensajes de estado para mostrar en la UI. */
export async function translateWithAI(
  text: string,
  target: TranslateTarget,
  style: TranslateStyle,
  onProgress?: (msg: string) => void
): Promise<string> {
  const chunks = splitIntoChunks(text)
  if (chunks.length === 0) {
    throw new Error('No se recibió texto que traducir.')
  }

  const nombre = target === 'en' ? 'inglés' : 'español'
  const out: string[] = []
  for (let i = 0; i < chunks.length; i++) {
    onProgress?.(
      chunks.length === 1
        ? `Traduciendo al ${nombre}…`
        : `Traduciendo al ${nombre} (parte ${i + 1} de ${chunks.length})…`
    )
    // un reintento por trozo (los 504/502 ocasionales suelen resolverse solos)
    let result: string | null = null
    let lastError: Error | null = null
    for (let attempt = 0; attempt < 2 && !result; attempt++) {
      try {
        result = await translateChunk(chunks[i], target, style)
      } catch (e) {
        lastError = e as Error
        if (attempt === 0) await sleep(1200)
      }
    }
    if (result === null) throw (lastError ?? new Error('Falló la traducción con IA.'))

    out.push(result)
    if (i < chunks.length - 1) await sleep(400)
  }
  return out.join('\n\n')
}
