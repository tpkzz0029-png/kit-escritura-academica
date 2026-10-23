import type { PdfPage } from './pdf'

const GT_URL = 'https://translate.googleapis.com/translate_a/single'
const MM_URL = 'https://api.mymemory.translated.net/get'
const CHUNK_SIZE = 1000
const CONCURRENCY = 3

function chunkText(text: string): string[] {
  const paragraphs = text.split('\n')
  const chunks: string[] = []
  let current = ''

  for (const para of paragraphs) {
    if ((current + '\n' + para).length > CHUNK_SIZE && current) {
      chunks.push(current)
      current = para
    } else {
      current = current ? current + '\n' + para : para
    }
  }
  if (current) chunks.push(current)

  // dividir trozos demasiado largos (párrafos gigantes)
  const result: string[] = []
  for (const c of chunks) {
    if (c.length <= CHUNK_SIZE) {
      result.push(c)
    } else {
      for (let i = 0; i < c.length; i += CHUNK_SIZE) {
        result.push(c.slice(i, i + CHUNK_SIZE))
      }
    }
  }
  return result
}

export async function googleTranslate(
  text: string,
  sl: string,
  tl: string
): Promise<{ text: string; detected?: string }> {
  const params = new URLSearchParams({
    client: 'gtx',
    sl,
    tl,
    dt: 't',
    q: text,
  })
  const res = await fetch(`${GT_URL}?${params.toString()}`)
  if (!res.ok) throw new Error(`Google Translate respondió ${res.status}`)
  const data = await res.json()
  if (!Array.isArray(data) || !Array.isArray(data[0])) throw new Error('Respuesta inesperada')
  const translated = (data[0] as Array<Array<string>>)
    .map((segment) => segment?.[0] ?? '')
    .join('')
  const detected = typeof data[2] === 'string' ? data[2] : undefined
  return { text: translated, detected }
}

async function myMemoryTranslate(text: string, sl: string, tl: string): Promise<string> {
  if (sl === 'auto') throw new Error('MyMemory requiere idioma origen conocido')
  const params = new URLSearchParams({ q: text, langpair: `${sl}|${tl}` })
  const res = await fetch(`${MM_URL}?${params.toString()}`)
  if (!res.ok) throw new Error(`MyMemory respondió ${res.status}`)
  const data = await res.json()
  const out = data?.responseData?.translatedText
  if (!out || data?.responseStatus !== 200) throw new Error('MyMemory no pudo traducir')
  return out
}

async function translateChunk(text: string, sl: string, tl: string): Promise<{ text: string; detected?: string }> {
  try {
    return await googleTranslate(text, sl, tl)
  } catch {
    return { text: await myMemoryTranslate(text, sl, tl) }
  }
}

export interface TranslateResult {
  pages: PdfPage[]
  detectedSource?: string
}

export async function translatePages(
  pages: PdfPage[],
  source: string,
  target: string,
  onProgress?: (done: number, total: number) => void,
  signal?: AbortSignal
): Promise<TranslateResult> {
  interface Job {
    pageIdx: number
    chunkIdx: number
    totalChunks: number
    text: string
  }

  const jobs: Job[] = []
  pages.forEach((p, pageIdx) => {
    const chunks = chunkText(p.text)
    chunks.forEach((text, chunkIdx) => jobs.push({ pageIdx, chunkIdx, totalChunks: chunks.length, text }))
  })

  const pageParts = new Map<number, Map<number, string>>()
  let detected: string | undefined
  let done = 0

  async function worker(queue: Job[]): Promise<void> {
    for (const job of queue) {
      if (signal?.aborted) throw new DOMException('Traducción cancelada', 'AbortError')
      const res = await translateChunk(job.text, source, target)
      if (res.detected && !detected) detected = res.detected
      if (!pageParts.has(job.pageIdx)) pageParts.set(job.pageIdx, new Map())
      pageParts.get(job.pageIdx)!.set(job.chunkIdx, res.text)
      done++
      onProgress?.(done, jobs.length)
    }
  }

  const queues: Job[][] = Array.from({ length: CONCURRENCY }, () => [])
  jobs.forEach((job, i) => queues[i % CONCURRENCY].push(job))
  await Promise.all(queues.map(worker))

  const translated: PdfPage[] = pages.map((p, i) => {
    const parts = pageParts.get(i)
    if (!parts) return { page: p.page, text: '' }
    const text = Array.from({ length: parts.size }, (_, idx) => parts.get(idx) ?? '').join('\n')
    return { page: p.page, text: text.trim() }
  })

  return { pages: translated, detectedSource: detected }
}
