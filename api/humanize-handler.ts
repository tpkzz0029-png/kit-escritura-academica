// Proxy interno de humanización (SOLO SERVIDOR — nunca se importa desde el
// cliente). Recibe { text } desde la app, añade el prompt maestro de
// humanización y llama a la Agent API de Perplexity.
//
// Configuración (variables de entorno del servidor; en Vercel: Settings →
// Environment Variables; en local: archivo .env.local):
//   PERPLEXITY_API_KEY  (obligatoria) clave de https://console.perplexity.ai
//   PERPLEXITY_MODEL    (opcional) modelo o lista separada por comas
//   AI_TIMEOUT_MS       (opcional) tiempo máximo de espera. Por defecto: 280 s en
//                       Vercel (límite 300 s), 9,5 s en Netlify (límite 10 s) y
//                       120 s en local.
//
// El navegador nunca ve la clave: solo puede llamar a /api/humanize.

const env = (globalThis as { process?: { env?: Record<string, string | undefined> } })
  .process?.env ?? {}

export const PPLX_URL = 'https://api.perplexity.ai/v1/agent'
/** Modelos rápidos con respaldo: si el primero falla, Perplexity prueba el siguiente. */
const MODELOS_POR_DEFECTO = ['google/gemini-3.8-flash', 'openai/gpt-6-luna', 'perplexity/sonar']

function modelos(): string[] {
  const m = (env.PERPLEXITY_MODEL ?? '').split(',').map((x) => x.trim()).filter(Boolean)
  return (m.length ? m : MODELOS_POR_DEFECTO).slice(0, 5)
}

function apiKey(): string {
  return (env.PERPLEXITY_API_KEY ?? '').trim()
}

function timeoutMs(): number {
  const n = Number(env.AI_TIMEOUT_MS)
  if (Number.isFinite(n) && n > 1000) return n
  if (env.VERCEL) return 280_000
  if (env.NETLIFY) return 9_500
  return 120_000
}

/* Prompt maestro de humanización (mismo que prompt-humanizador.txt): ataca
   las señales que miden los detectores — burstiness, predecibilidad, frases
   de molde, grandilocuencia, escritura genérica y repetición. */
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

ENTREGA el resultado en EXACTAMENTE este formato, sin más etiquetas ni numeración:

<el texto reescrito completo, en párrafos>

---

<una lista breve de los cambios principales>

No escribas "(1)" ni "(2)", no uses marcado **: solo el texto, la línea --- y los cambios. No expliques las reglas: ejecútalas.`

const MAX_CHARS = 30000

async function apiError(res: Response): Promise<string> {
  let msg = ''
  try {
    const data = (await res.json()) as Record<string, unknown>
    const err = data?.error as Record<string, unknown> | string | undefined
    msg = String((typeof err === 'string' ? err : err?.message) ?? data?.detail ?? data?.message ?? '')
  } catch {
    /* cuerpo no JSON */
  }
  if (res.status === 401 || res.status === 403)
    return 'Perplexity rechazó la clave (401/403). Revisa la variable PERPLEXITY_API_KEY en Vercel.'
  if (res.status === 402) return 'La cuenta de Perplexity no tiene saldo de API. Revisa la facturación en console.perplexity.ai.'
  if (res.status === 429) return 'Límite de solicitudes de Perplexity superado (429). Espera un minuto y reintenta.'
  return msg ? `Perplexity respondió con error ${res.status}: ${msg}` : `Perplexity respondió con error ${res.status}.`
}

/** Extrae el texto final de la respuesta de la Agent API (output[].content[].text) */
function textoDeRespuesta(data: unknown): string {
  const out = (data as { output?: Array<{ type?: string; content?: Array<{ type?: string; text?: string }> }> })?.output ?? []
  return out
    .filter((o) => o.type === 'message')
    .flatMap((o) => o.content ?? [])
    .filter((c) => c.type === 'output_text' && typeof c.text === 'string')
    .map((c) => c.text as string)
    .join('')
    .trim()
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

  const key = apiKey()
  if (!key) {
    return {
      status: 500,
      json: { error: 'Falta configurar PERPLEXITY_API_KEY en el servidor (Vercel → Settings → Environment Variables).' },
    }
  }

  // Cortamos nosotros antes del límite del hosting para devolver un error claro
  // en vez del 504 genérico.
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs())

  let res: Response
  try {
    res = await fetch(PPLX_URL, {
      method: 'POST',
      signal: ctrl.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        models: modelos(),
        instructions: SYSTEM_PROMPT,
        input: `TEXTO:\n\n${text}\n\nRecuerda el formato exacto: texto reescrito completo, una línea con solo ---, y la lista breve de cambios principales. No añadas ideas, datos ni ejemplos que no estén en el texto original.`,
        // Sin herramientas: no buscamos en la web, solo reescribimos.
        temperature: 0.5,
        max_output_tokens: 2500,
        stream: false,
      }),
    })
  } catch (e) {
    clearTimeout(timer)
    if ((e as Error)?.name === 'AbortError') {
      return {
        status: 504,
        json: { error: 'La IA tardó demasiado en responder. Reintenta o humaniza un texto más corto.' },
      }
    }
    const msg = e instanceof Error ? e.message : String(e)
    return { status: 502, json: { error: `No se pudo contactar con Perplexity (${msg}). Reintenta.` } }
  }
  clearTimeout(timer)

  if (!res.ok) {
    return { status: res.status, json: { error: await apiError(res) } }
  }

  const data = (await res.json()) as { status?: string; error?: { message?: string } | null; usage?: unknown }
  const content = textoDeRespuesta(data)
  const truncated = data?.status === 'incomplete'
  if (!content) {
    return {
      status: 502,
      json: { error: data?.error?.message || 'El modelo respondió sin contenido. Reintenta con un texto más corto.' },
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
