// Proxy interno de humanización (SOLO SERVIDOR — nunca se importa desde el
// cliente). Recibe { text } desde la app, añade el prompt maestro de
// humanización y llama a un modelo de IA. Proveedores disponibles:
//
//   · Google Gemini (recomendado: tiene plan gratuito para los modelos Flash)
//       GEMINI_API_KEY      clave de https://aistudio.google.com/apikey (formato AQ.… o AIza…)
//       GEMINI_MODEL        (opcional) modelo o lista separada por comas
//   · Perplexity (Agent API, de pago por uso)
//       PERPLEXITY_API_KEY  clave de https://console.perplexity.ai
//       PERPLEXITY_MODEL    (opcional) modelo o lista separada por comas
//
//   AI_PROVIDER    (opcional) «gemini» o «perplexity». Si no se indica, se usa el
//                  proveedor cuya clave esté configurada (Gemini primero).
//   AI_TIMEOUT_MS  (opcional) tiempo máximo de espera. Por defecto: 280 s en
//                  Vercel (límite 300 s), 9,5 s en Netlify (límite 10 s) y 120 s en local.
//
// Las variables se configuran en Vercel → Settings → Environment Variables, o
// en local en el archivo .env.local. El navegador nunca ve las claves.

const env = (globalThis as { process?: { env?: Record<string, string | undefined> } })
  .process?.env ?? {}

export type Proveedor = 'gemini' | 'perplexity'

export const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta'
export const GEMINI_MODELOS = ['gemini-3.8-flash', 'gemini-3.6-flash', 'gemini-3.5-flash-lite']
export const PPLX_URL = 'https://api.perplexity.ai/v1/agent'
export const PPLX_MODELOS = ['google/gemini-3.8-flash', 'openai/gpt-6-luna', 'perplexity/sonar']

const lista = (v: string | undefined, porDefecto: string[]) => {
  const m = (v ?? '').split(',').map((x) => x.trim()).filter(Boolean)
  return (m.length ? m : porDefecto).slice(0, 5)
}

export function proveedor(): { id: Proveedor; key: string } | null {
  const g = (env.GEMINI_API_KEY ?? '').trim()
  const p = (env.PERPLEXITY_API_KEY ?? '').trim()
  const elegido = (env.AI_PROVIDER ?? '').trim().toLowerCase()
  if (elegido === 'perplexity' && p) return { id: 'perplexity', key: p }
  if (elegido === 'gemini' && g) return { id: 'gemini', key: g }
  if (g) return { id: 'gemini', key: g }
  if (p) return { id: 'perplexity', key: p }
  return null
}

export function timeoutMs(): number {
  const n = Number(env.AI_TIMEOUT_MS)
  if (Number.isFinite(n) && n > 1000) return n
  if (env.VERCEL) return 280_000
  if (env.NETLIFY) return 9_500
  return 120_000
}

/* Prompt maestro de humanización: ataca las señales que miden los detectores
   académicos (Turnitin y similares) — burstiness, perplexity, frases de
   molde, grandilocuencia, escritura genérica, estructuras simétricas y
   uniformidad por bloques de ~250 palabras. */
export const SYSTEM_PROMPT = `Actúa como un redactor académico hispanohablante con 20 años de experiencia revisando tesis, ensayos e informes universitarios. Tu voz es clara, directa y natural; nada de solemnidad de manual.

Voy a darte un texto generado por IA. REESCRÍBELO COMPLETAMENTE para que suene escrito por una persona real, manteniendo el 100 % de los datos, cifras, afirmaciones y citas. No añadas información nueva ni inventes datos: si falta un dato concreto, deja el marcador [dato] en su lugar.

Aplica TODAS estas reglas a la vez:

1. ROMPE EL RITMO DE FÁBRICA (burstiness): varía drásticamente la longitud de las oraciones. Mezcla oraciones cortas e incisivas (5-9 palabras) con oraciones largas (25-35 palabras). Jamás dos oraciones seguidas de longitud parecida.

2. BAJA LA PREVISIBILIDAD (perplexity): sustituye el vocabulario genérico por términos precisos del tema. Elimina las palabras que un modelo elegiría por defecto: "importante", "fundamental", "desempeña un papel", "juega un papel crucial", "en la actualidad".

3. ELIMINA FRASES DE MOLDE: borra o reescribe "es importante destacar", "cabe señalar", "en conclusión", "en el mundo actual", "por lo tanto", "sin embargo" al inicio de párrafo, "vale la pena destacar". Conecta las ideas con matices, no con plantillas.

4. DESACTIVA LA GRANDILOCUENCIA: elimina metáforas elevadas y superlativos ("colosal", "cósmico", "imponente", "un archivo vivo", "la biografía secreta de", "reloj cósmico"). Usa el equivalente sobrio y directo.

5. ANCLA EN LO CONCRETO: donde el texto hable de lo abstracto en general, baja a casos particulares con los datos que ya tenga el texto (cifras, fechas, nombres). Si no los tiene, NO los inventes: reduce la abstracción hablando de casos específicos del propio argumento.

6. VOZ ACTIVA Y MATICES: convierte la pasiva ("es estudiado por") en activa ("los geólogos estudian"). Sustituye afirmaciones absolutas ("es fundamental") por matices ("resulta útil", "convendría").

7. VARÍA LOS COMIENZOS: ningún párrafo arranca con la misma estructura; no repitas el sujeto inicial en dos oraciones seguidas.

8. VOCABULARIO: no repitas la misma palabra de contenido más de dos veces por párrafo; usa sinónimos o pronombres. No fuerces palabras raras.

9. CONECTORES HUMANOS, CON MODERACIÓN: en vez de transiciones de manual usa "pues", "de hecho", "eso sí", "con todo", "aun así" (máximo 1-2 por párrafo, nunca al inicio de todos).

10. CONCORDANCIA Y ORTOGRAFÍA impecables: revisa género y número tras cada sustitución y la acentuación de cada palabra nueva.

11. REESTRUCTURA, NO SUSTITUYAS: cambia el orden de las cláusulas, convierte subordinadas en oraciones independientes y reconstruye las frases con sintaxis distinta. Cambiar solo palabras por sinónimos deja intacta la huella estadística que miden los detectores y apenas baja la puntuación.

12. CITAS, NÚMEROS Y TÉRMINOS INTACTOS: no alteres citas textuales, referencias bibliográficas, cifras, fechas, nombres propios ni terminología técnica; reescribe solo el tejido narrativo que las rodea.

13. INTRODUCCIÓN Y CONCLUSIÓN CON ESPECIAL CUIDADO: son los párrafos que la IA suele hacer más genéricos y los que más pesan en la primera impresión del revisor. La introducción plantea el tema con un dato concreto del propio texto, una pregunta precisa o una afirmación matizada — jamás "En la actualidad, X se ha convertido en un tema fundamental". La conclusión cierra con una idea específica del argumento, no con un resumen de manual ("En conclusión, se ha demostrado la importancia de…").

14. CONSTANCIA POR BLOQUES: los detectores académicos puntúan el texto por segmentos de ~250 palabras y promedian. Aplica todas las reglas de forma uniforme en TODO el texto: un único párrafo con estilo de fábrica en medio de un texto bien reescrito dispara la media de todo el documento.

15. ROMPE LAS SIMETRÍAS DE FÁBRICA: evita enumeraciones perfectamente paralelas, tríadas retóricas ("no solo… sino también… e incluso…") y estructuras idénticas repetidas entre párrafos. Cuando el texto las use, conviértelas en prosa con ritmo desigual.

16. MATICES EVALUATIVOS PROPIOS: incluye de vez en cuando una valoración matizada o una precisión de alcance ("conviene matizar que", "este dato hay que tomarlo con cautela", "al menos en los casos descritos") — siempre derivada del propio argumento, nunca inventada.

17. APERTURA CON CONECTOR + CITA (solo con fuentes reales): cuando el párrafo se apoye en una fuente que YA aparezca citada en el texto original, ábrelo con un conector humano seguido de la cita textual entrecomillada o parafraseada con su autor y año ("Como señala García (2021), …"). Si el texto original NO contiene citas ni autores, NO inventes referencias: en ese caso abre el párrafo con un conector seguido de la idea concreta más importante del párrafo.

18. CONEXIÓN ENTRE ORACIONES E IDEAS: enlaza las oraciones dentro del párrafo con conectores variados y naturales ("esto explica que", "de ahí que", "si bien", "a partir de ello", "en ese sentido"), alternando su posición (inicio, medio, entre comas). Que el razonamiento fluya como cadena de ideas y no como lista de afirmaciones independientes.

19. ANÁLISIS CRÍTICO Y CONTRASTE DE AUTORES (solo si el texto original los menciona): cuando el texto original cite a dos o más autores, contrasta explícitamente sus posturas ("X sostiene que…; en cambio, Y advierte que…") y valóralas con un matiz propio. Nunca introduzcas autores, obras ni referencias que no estén en el texto original: una cita inventada es detectable y académicamente mucho más grave que un porcentaje de IA.

20. IRREGULARIDAD NATURAL Y ERRORES INTENCIONALES ESPORÁDICOS: permite que el texto respire como escritura humana — construcciones algo menos pulidas, pausas con coma opcional, giros ligeramente coloquiales ocasionales. Además, introduce errores tipográficos leves y plausibles de mecanografía con extrema moderación: 1-2 por cada 1000 palabras, nunca seguidos ni en el mismo párrafo (por ejemplo, una letra doblada ("la universidadd"), un acento omitido en una palabra poco frecuente, una tilde de más, un artículo repetido ("la la")). NUNCA en citas, referencias bibliográficas, cifras, fechas, nombres propios ni términos técnicos, y nunca errores de concordancia gramatical. Que parezcan distracciones de quien escribe deprisa, no descuido general.

ENTREGA el resultado en EXACTAMENTE este formato, sin más etiquetas ni numeración:

<el texto reescrito completo, en párrafos>

---

<una lista breve de los cambios principales>

No escribas "(1)" ni "(2)", no uses marcado **: solo el texto, la línea --- y los cambios. No expliques las reglas: ejecútalas.`

const MAX_CHARS = 30000

export async function apiError(res: Response, prov: Proveedor): Promise<string> {
  const nombre = prov === 'gemini' ? 'Gemini' : 'Perplexity'
  const variable = prov === 'gemini' ? 'GEMINI_API_KEY' : 'PERPLEXITY_API_KEY'
  let msg = ''
  try {
    const data = (await res.json()) as unknown
    const d = (Array.isArray(data) ? data[0] : data) as Record<string, unknown>
    const err = d?.error as Record<string, unknown> | string | undefined
    msg = String((typeof err === 'string' ? err : err?.message) ?? d?.detail ?? d?.message ?? '')
  } catch {
    /* cuerpo no JSON */
  }
  if (res.status === 401 || res.status === 403 || (res.status === 400 && /api key/i.test(msg)))
    return `${nombre} rechazó la clave. Revisa la variable ${variable} en Vercel.`
  if (res.status === 402) return `La cuenta de ${nombre} no tiene saldo de API.`
  if (res.status === 429)
    return `Se alcanzó el límite de uso de ${nombre}${prov === 'gemini' ? ' (plan gratuito)' : ''}. Espera un minuto y reintenta.`
  return msg ? `${nombre} respondió con error ${res.status}: ${msg}` : `${nombre} respondió con error ${res.status}.`
}

/** Extrae el texto final de la respuesta de la Agent API (output[].content[].text) */
export function textoDeRespuesta(data: unknown): string {
  const out = (data as { output?: Array<{ type?: string; content?: Array<{ type?: string; text?: string }> }> })?.output ?? []
  return out
    .filter((o) => o.type === 'message')
    .flatMap((o) => o.content ?? [])
    .filter((c) => c.type === 'output_text' && typeof c.text === 'string')
    .map((c) => c.text as string)
    .join('')
    .trim()
}

/** Extrae el texto de una respuesta de Gemini (Interactions API o generateContent) */
export function textoGemini(data: unknown): { text: string; truncated: boolean } {
  const d = data as Record<string, unknown>
  if (typeof d?.output_text === 'string') return { text: d.output_text.trim(), truncated: false }
  // generateContent: candidates[0].content.parts[].text
  const cands = d?.candidates as Array<{ content?: { parts?: Array<{ text?: string; thought?: boolean }> }; finishReason?: string }> | undefined
  if (Array.isArray(cands) && cands.length) {
    const c = cands[0]
    const text = (c.content?.parts ?? []).filter((p) => !p.thought).map((p) => p.text ?? '').join('').trim()
    return { text, truncated: c.finishReason === 'MAX_TOKENS' }
  }
  // Interactions API: el texto final está en el último paso (o en «outputs»)
  const textos = (v: unknown): string[] => {
    if (!v || typeof v !== 'object') return []
    const o = v as Record<string, unknown>
    if (o.type === 'thought' || o.type === 'thinking') return []
    if (typeof o.text === 'string') return [o.text]
    return Object.values(o).flatMap((x) => (Array.isArray(x) ? x.flatMap(textos) : typeof x === 'object' ? textos(x) : []))
  }
  const pasos = (d?.steps ?? d?.outputs) as unknown[] | undefined
  if (Array.isArray(pasos) && pasos.length) {
    for (let i = pasos.length - 1; i >= 0; i--) {
      const t = textos(pasos[i]).join('').trim()
      if (t) return { text: t, truncated: d?.status === 'incomplete' }
    }
  }
  return { text: '', truncated: false }
}

/**
 * Punto de entrada común: lo usan la función serverless (Vercel/Netlify) y
 * el middleware del servidor de desarrollo de Vite.
 */
export async function handleHumanize(body: unknown): Promise<{
  status: number
  json: Record<string, unknown>
}> {
  const text = typeof (body as { text?: unknown })?.text === 'string'
    ? (body as { text: string }).text
    : ''

  if (!text.trim()) {
    return { status: 400, json: { error: 'No se recibió texto que humanizar.' } }
  }
  if (text.length > MAX_CHARS) {
    return {
      status: 413,
      json: { error: `El texto supera ${MAX_CHARS.toLocaleString('es')} caracteres. Divídelo y humaniza por partes.` },
    }
  }

  const prov = proveedor()
  if (!prov) {
    return {
      status: 500,
      json: { error: 'Falta configurar la clave de la IA (GEMINI_API_KEY) en Vercel → Settings → Environment Variables.' },
    }
  }

  // Una clave copiada recortada («AIza…») o con espacios raros rompe la cabecera HTTP.
  if (!/^[\x21-\x7e]+$/.test(prov.key)) {
    const variable = prov.id === 'gemini' ? 'GEMINI_API_KEY' : 'PERPLEXITY_API_KEY'
    return {
      status: 500,
      json: {
        error: `La clave de ${variable} está incompleta o tiene caracteres no válidos (por ejemplo «…» o espacios). Cópiala completa con el botón de copiar y vuelve a publicar.`,
      },
    }
  }

  const pedido = `TEXTO:\n\n${text}\n\nRecuerda el formato exacto: texto reescrito completo, una línea con solo ---, y la lista breve de cambios principales. No añadas ideas, datos ni ejemplos que no estén en el texto original.`

  // Cortamos nosotros antes del límite del hosting para devolver un error claro
  // en vez del 504 genérico.
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs())

  let content = ''
  let truncated = false
  try {
    if (prov.id === 'gemini') {
      // Las claves nuevas de AI Studio (AQ.…, «auth keys») se envían en la cabecera
      // x-goog-api-key, igual que las antiguas AIza…. Se usa la Interactions API y,
      // si no está disponible, generateContent. Si un modelo no existe o está
      // saturado, se prueba el siguiente.
      let ultimo: Response | null = null
      modelos: for (const model of lista(env.GEMINI_MODEL, GEMINI_MODELOS)) {
        for (const via of ['interactions', 'generateContent'] as const) {
          const res =
            via === 'interactions'
              ? await fetch(`${GEMINI_BASE}/interactions`, {
                  method: 'POST',
                  signal: ctrl.signal,
                  headers: { 'Content-Type': 'application/json', 'x-goog-api-key': prov.key },
                  body: JSON.stringify({ model, system_instruction: SYSTEM_PROMPT, input: pedido }),
                })
              : await fetch(`${GEMINI_BASE}/models/${encodeURIComponent(model)}:generateContent`, {
                  method: 'POST',
                  signal: ctrl.signal,
                  headers: { 'Content-Type': 'application/json', 'x-goog-api-key': prov.key },
                  body: JSON.stringify({
                    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
                    contents: [{ role: 'user', parts: [{ text: pedido }] }],
                  }),
                })
          if (res.ok) {
            const r = textoGemini(await res.json())
            content = r.text
            truncated = r.truncated
            ultimo = null
            break modelos
          }
          ultimo = res
          // 404 en /interactions puede significar que esa vía no existe: probamos generateContent
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
          models: lista(env.PERPLEXITY_MODEL, PPLX_MODELOS),
          instructions: SYSTEM_PROMPT,
          input: pedido,
          // Sin herramientas: no buscamos en la web, solo reescribimos.
          temperature: 0.5,
          max_output_tokens: 2500,
          stream: false,
        }),
      })
      if (!res.ok) {
        clearTimeout(timer)
        return { status: res.status, json: { error: await apiError(res, 'perplexity') } }
      }
      const data = (await res.json()) as { status?: string }
      content = textoDeRespuesta(data)
      truncated = data?.status === 'incomplete'
    }
  } catch (e) {
    clearTimeout(timer)
    if ((e as Error)?.name === 'AbortError') {
      return {
        status: 504,
        json: { error: 'La IA tardó demasiado en responder. Reintenta o humaniza un texto más corto.' },
      }
    }
    const msg = e instanceof Error ? e.message : String(e)
    return { status: 502, json: { error: `No se pudo contactar con la IA (${msg}). Reintenta.` } }
  }
  clearTimeout(timer)

  if (!content) {
    return {
      status: 502,
      json: { error: 'El modelo respondió sin contenido. Reintenta con un texto más corto.' },
    }
  }

  // El modelo entrega "texto reescrito" + "cambios principales" separados por
  // una línea ---. Los separamos y limpiamos el marcado ** para que el texto
  // listo para copiar/descargar quede en plano y la puntuación no se infle por
  // artefactos de formato. Si el modelo ignora el ---, toleramos el patrón
  // "(1) texto (2) cambios".
  const raw = String(content).trim()
  const clean = (s: string) => s.replace(/\*\*/g, '').trim()
  let main = raw
  let changes = ''
  if (/\n\s*---+\s*\n/.test(raw)) {
    const parts = raw.split(/\n\s*---+\s*\n/)
    main = parts[0]
    changes = parts.slice(1).join('\n---\n')
  } else {
    const m = raw.match(/^\(1\)\s*([\s\S]*?)(?:\n\s*\(2\)\s*([\s\S]*))?$/m)
    if (m) {
      main = m[1] ?? raw
      changes = m[2] ?? ''
    }
  }
  const textOut = clean(main)
  const changesClean = clean(changes)

  return {
    status: 200,
    json: { text: textOut, changes: changesClean, truncated },
  }
}
