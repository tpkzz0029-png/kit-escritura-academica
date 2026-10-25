// Humanización automática vía el proxy interno de la app (/api/humanize).
// El cliente NO lleva clave ni configuración: envía el texto al mismo
// origen y el servidor (middleware de Vite en local, función serverless al
// desplegar) se encarga de la clave y del prompt maestro.
//
// Importante: las funciones serverless (Netlify/Vercel) tienen un límite de
// ejecución corto (~10 s en Netlify gratis). Una sola llamada con un texto
// largo supera ese límite y el host responde 504. Por eso el texto se divide
// en TROZOS por párrafos y se envían en secuencia: cada llamada es rápida y
// el resultado se va uniendo.

export interface HumanizeResult {
  text: string
  changes: string
  truncated: boolean
}

// En Vercel la función puede durar hasta 300 s, así que los trozos pueden ser
// generosos (si vuelves a Netlify, bájalos a ~1200/1600 por su límite de 10 s).
const CHUNK_TARGET = 2500 // caracteres por trozo (objetivo)
const CHUNK_MAX = 3200 // máximo duro antes de cortar por oraciones

/** Divide el texto en párrafos y agrupa párrafos en trozos de ~CHUNK_TARGET
 *  caracteres, sin cortar párrafos por la mitad salvo que un párrafo aislado
 *  supere CHUNK_MAX (entonces se corta por oraciones). */
export function splitIntoChunks(text: string): string[] {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)

  const chunks: string[] = []
  let current = ''

  const flush = () => {
    if (current.trim()) chunks.push(current.trim())
    current = ''
  }

  for (const para of paragraphs) {
    if (para.length > CHUNK_MAX) {
      // párrafo gigante: cortar por oraciones
      const sentences = para.match(/[^.!?¿¡…]+[.!?¿¡…]*["'»)\]]*\s*/g) ?? [para]
      for (const s of sentences) {
        if ((current + '\n\n' + s).length > CHUNK_TARGET && current) flush()
        current = current ? current + '\n\n' + s.trim() : s.trim()
        if (current.length > CHUNK_MAX) flush()
      }
      continue
    }
    if ((current + '\n\n' + para).length > CHUNK_TARGET && current) flush()
    current = current ? current + '\n\n' + para : para
  }
  flush()
  return chunks
}

async function humanizeChunk(text: string): Promise<HumanizeResult> {
  // relativo a la URL actual: funciona en local y en el despliegue
  const url = new URL('/api/humanize', window.location.origin).toString()

  let res: Response
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })
  } catch {
    throw new Error('No se pudo contactar con el servidor de humanización. Reintenta.')
  }

  let data: { text?: string; changes?: string; truncated?: boolean; error?: string } = {}
  try {
    data = await res.json()
  } catch {
    // cuerpo no JSON
  }

  if (!res.ok || data.error) {
    if (res.status === 404) {
      throw new Error(
        'El servidor de IA no está disponible en este alojamiento (falta la función /api/humanize). ' +
          'Se aplicará el parafraseo local como alternativa.'
      )
    }
    throw new Error(data.error || `El servidor respondió con error ${res.status}.`)
  }
  if (!data.text || !data.text.trim()) {
    throw new Error('La IA respondió sin contenido. Reintenta.')
  }
  return {
    text: data.text.trim(),
    changes: (data.changes ?? '').trim(),
    truncated: data.truncated === true,
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export async function humanizeWithAI(
  text: string,
  onProgress?: (msg: string) => void
): Promise<HumanizeResult> {
  const chunks = splitIntoChunks(text)
  if (chunks.length === 0) {
    throw new Error('No se recibió texto que humanizar.')
  }

  const texts: string[] = []
  const changesList: string[] = []
  let truncated = false

  for (let i = 0; i < chunks.length; i++) {
    onProgress?.(
      chunks.length === 1
        ? 'Enviando el texto a la IA para humanizarlo…'
        : `Humanizando parte ${i + 1} de ${chunks.length}…`
    )
    // un reintento por trozo (los 504/502 ocasionales suelen resolverse solos)
    let result: HumanizeResult | null = null
    let lastError: Error | null = null
    for (let attempt = 0; attempt < 2 && !result; attempt++) {
      try {
        result = await humanizeChunk(chunks[i])
      } catch (e) {
        lastError = e as Error
        if (attempt === 0) await sleep(1200)
      }
    }
    if (!result) throw (lastError ?? new Error('Falló la humanización con IA.'))

    texts.push(result.text)
    if (result.changes) changesList.push(result.changes)
    truncated = truncated || result.truncated
    // pausa breve entre trozos para no saturar el gateway
    if (i < chunks.length - 1) await sleep(400)
  }

  onProgress?.('Texto humanizado recibido.')
  return {
    text: texts.join('\n\n'),
    changes: changesList.join('\n'),
    truncated,
  }
}
