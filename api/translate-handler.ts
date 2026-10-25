// Proxy interno de traducción (SOLO SERVIDOR — nunca se importa desde el
// cliente). Recibe { text, target, style } desde la app y traduce con el
// mismo proveedor de IA que el humanizador (Gemini o Perplexity, con la
// clave en variables de entorno; el navegador nunca la ve).
//
//   target: 'en' | 'es'   (destino de la traducción; el origen se infiere:
//                          'en' ⇒ desde español, 'es' ⇒ desde inglés)
//   style:  'normal'      traducción académica pulida
//           'literal'     traducción fiel palabra por palabra SIN corregir
//                         ni pulir (vuelta de la traducción de ida y vuelta:
//                         las imperfecciones que introduce son justamente
//                         la señal humana que buscamos)
//
// Se usa para el PASO 2 del humanizador: español → inglés → español sin
// corregir, técnica que rompe la huella estadística del texto generado por IA.

import {
  GEMINI_BASE,
  GEMINI_MODELOS,
  PPLX_URL,
  PPLX_MODELOS,
  proveedor,
  timeoutMs,
  textoGemini,
  textoDeRespuesta,
  apiError,
} from './humanize-handler.js'

export type TranslateTarget = 'en' | 'es'
export type TranslateStyle = 'normal' | 'literal'

const MAX_CHARS = 30000

function instrucciones(target: TranslateTarget, style: TranslateStyle): string {
  if (target === 'en') {
    return (
      'Traduce el siguiente texto al inglés académico. Devuelve ÚNICAMENTE la traducción ' +
      'completa del texto: sin explicaciones, sin notas, sin introducciones, sin marcado, ' +
      'sin comentarios sobre la traducción.'
    )
  }
  if (style === 'literal') {
    return (
      'Traduce el siguiente texto (en inglés) al español de forma FIEL Y LITERAL, lo más ' +
      'cercana palabra por palabra que permita el español. NO corrijas, NO mejores y NO ' +
      'pulas el estilo: conserva exactamente las imperfecciones, repeticiones, giros y ' +
      'estructuras del original, aunque en español suenen menos naturales o algo ' +
      'torpes: eso es precisamente lo que se pide. Tampoco añadas ni quites ' +
      'contenido. Devuelve ÚNICAMENTE la traducción, sin explicaciones ni notas.'
    )
  }
  return (
    'Traduce el siguiente texto (en inglés) al español académico. Devuelve ÚNICAMENTE la ' +
    'traducción completa del texto: sin explicaciones, sin notas, sin introducciones, sin marcado.'
  )
}

export async function handleTranslate(body: unknown): Promise<{
  status: number
  json: Record<string, unknown>
}> {
  const b = body as { text?: unknown; target?: unknown; style?: unknown }
  const text = typeof b?.text === 'string' ? b.text : ''
  const target: TranslateTarget = b?.target === 'en' ? 'en' : 'es'
  const style: TranslateStyle = b?.style === 'literal' ? 'literal' : 'normal'

  if (!text.trim()) {
    return { status: 400, json: { error: 'No se recibió texto que traducir.' } }
  }
  if (text.length > MAX_CHARS) {
    return {
      status: 413,
      json: { error: `El texto supera ${MAX_CHARS.toLocaleString('es')} caracteres. Divídelo y traduce por partes.` },
    }
  }

  const prov = proveedor()
  if (!prov) {
    return {
      status: 500,
      json: { error: 'Falta configurar la clave de la IA (GEMINI_API_KEY) en Vercel → Settings → Environment Variables.' },
    }
  }

  const system = instrucciones(target, style)
  const pedido = `TEXTO:\n\n${text}\n\nRecuerda: responde ÚNICAMENTE con la traducción, sin notas ni explicaciones.`

  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs())

  let content = ''
  try {
    if (prov.id === 'gemini') {
      let ultimo: Response | null = null
      modelos: for (const model of GEMINI_MODELOS) {
        for (const via of ['interactions', 'generateContent'] as const) {
          const res =
            via === 'interactions'
              ? await fetch(`${GEMINI_BASE}/interactions`, {
                  method: 'POST',
                  signal: ctrl.signal,
                  headers: { 'Content-Type': 'application/json', 'x-goog-api-key': prov.key },
                  body: JSON.stringify({ model, system_instruction: system, input: pedido }),
                })
              : await fetch(`${GEMINI_BASE}/models/${encodeURIComponent(model)}:generateContent`, {
                  method: 'POST',
                  signal: ctrl.signal,
                  headers: { 'Content-Type': 'application/json', 'x-goog-api-key': prov.key },
                  body: JSON.stringify({
                    systemInstruction: { parts: [{ text: system }] },
                    contents: [{ role: 'user', parts: [{ text: pedido }] }],
                  }),
                })
          if (res.ok) {
            content = textoGemini(await res.json()).text
            ultimo = null
            break modelos
          }
          ultimo = res
          if (via === 'interactions' && res.status === 404) continue
          break
        }
        if (ultimo && ![404, 429, 500, 503].includes(ultimo.status)) break
      }
      if (ultimo) {
        clearTimeout(timer)
        return { status: ultimo.status, json: { error: await apiError(ultimo, 'gemini') } }
      }
    } else {
      const res = await fetch(PPLX_URL, {
        method: 'POST',
        signal: ctrl.signal,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${prov.key}` },
        body: JSON.stringify({
          models: PPLX_MODELOS,
          instructions: system,
          input: pedido,
          temperature: 0.2,
          stream: false,
        }),
      })
      if (!res.ok) {
        clearTimeout(timer)
        return { status: res.status, json: { error: await apiError(res, 'perplexity') } }
      }
      content = textoDeRespuesta(await res.json())
    }
  } catch (e) {
    clearTimeout(timer)
    if ((e as Error)?.name === 'AbortError') {
      return {
        status: 504,
        json: { error: 'La IA tardó demasiado en responder. Reintenta o traduce un texto más corto.' },
      }
    }
    const msg = e instanceof Error ? e.message : String(e)
    return { status: 502, json: { error: `No se pudo contactar con la IA (${msg}). Reintenta.` } }
  }
  clearTimeout(timer)

  if (!content.trim()) {
    return {
      status: 502,
      json: { error: 'El modelo respondió sin contenido. Reintenta con un texto más corto.' },
    }
  }
  return { status: 200, json: { text: content.trim() } }
}
