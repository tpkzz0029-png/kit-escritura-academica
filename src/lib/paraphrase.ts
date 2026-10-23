// Parafraseo por traducción de ida y vuelta: el texto viaja a un idioma puente
// y regresa, lo que reescribe la redacción conservando (aproximadamente) el
// significado y rompe los patrones que detectan la IA.

import { googleTranslate } from './translate'

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** traduce con reintentos ante limitación de tasa (429) */
async function translateWithRetry(
  text: string,
  sl: string,
  tl: string,
  attempts = 3
): Promise<{ text: string; detected?: string }> {
  let lastError: unknown
  for (let i = 0; i < attempts; i++) {
    try {
      return await googleTranslate(text, sl, tl)
    } catch (e) {
      lastError = e
      if (i < attempts - 1) await sleep(2000 * (i + 1))
    }
  }
  throw lastError
}

const CHUNK = 700

function splitChunks(text: string): string[] {
  // respetar párrafos y oraciones para no cortar de forma brusca
  const sentences = text.replace(/\s+/g, ' ').split(/(?<=[.!?…])\s+/)
  const chunks: string[] = []
  let current = ''
  for (const s of sentences) {
    if ((current + ' ' + s).length > CHUNK && current) {
      chunks.push(current.trim())
      current = s
    } else {
      current = current ? current + ' ' + s : s
    }
  }
  if (current.trim()) chunks.push(current.trim())
  return chunks
}

function pivotFor(lang: string): string {
  if (lang.startsWith('en')) return 'es'
  return 'en'
}

/**
 * Parafrasea el texto completo. Devuelve el texto reescrito y el idioma detectado.
 */
export async function paraphraseText(
  text: string,
  onProgress?: (done: number, total: number) => void
): Promise<{ text: string; language: string }> {
  const chunks = splitChunks(text)
  if (chunks.length === 0) throw new Error('No hay texto que parafrasear.')

  // detectar idioma con el primer trozo
  const first = await translateWithRetry(chunks[0].slice(0, 200), 'auto', 'en')
  const lang = first.detected ?? 'es'
  const pivot = pivotFor(lang)

  const out: string[] = []
  for (let i = 0; i < chunks.length; i++) {
    const via = await translateWithRetry(chunks[i], 'auto', pivot)
    await sleep(400)
    const back = await translateWithRetry(via.text, pivot, lang)
    out.push(back.text.trim())
    onProgress?.(i + 1, chunks.length)
    if (i < chunks.length - 1) await sleep(800)
  }

  return { text: out.join('\n\n'), language: lang }
}
