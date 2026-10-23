// Proxy interno de humanización (SOLO SERVIDOR — nunca se importa desde el
// cliente). Recibe { text } desde la app, añade el prompt maestro de
// humanización y la clave del gateway Kimi, y llama al modelo.
//
// La clave se resuelve así: variable de entorno KIMI_AGENT_GW_KEY (la forma
// recomendada al alojar la app, p. ej. en Vercel) → clave integrada de
// respaldo (para que funcione sin configuración en local).
//
// El navegador nunca ve la clave: solo puede llamar a /api/humanize.

const env = (globalThis as { process?: { env?: Record<string, string | undefined> } })
  .process?.env ?? {}

export const KIMI_GW_URL = 'https://agent-gw.kimi.com/coding/v1/chat/completions'
export const KIMI_GW_MODEL = 'kimi-k2-0905-preview'

const FALLBACK_KEY = 'sk-kimi-RYzQwG45rmvB6uRhVFMJ4gg7eJQXHwHBade5Udh1seaDBQBoVUBSbeMDGLybvh9C'

export function resolveGwKey(): string {
  return (env.KIMI_AGENT_GW_KEY || FALLBACK_KEY).trim()
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

async function gwError(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as Record<string, unknown>
    const err = data?.error as Record<string, unknown> | undefined
    const msg = (err?.message ?? data?.error_description ?? data?.message ?? '') as string
    if (res.status === 401 || res.status === 403)
      return 'El gateway de Kimi rechazó la clave (401/403). Habría que renovarla.'
    if (res.status === 429) return 'Límite de solicitudes del gateway superado (429). Espera un minuto y reintenta.'
    return msg ? `El gateway respondió con error ${res.status}: ${msg}` : `El gateway respondió con error ${res.status}.`
  } catch {
    return `El gateway respondió con error ${res.status}.`
  }
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

  const res = await fetch(KIMI_GW_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${resolveGwKey()}`,
    },
    body: JSON.stringify({
      model: KIMI_GW_MODEL,
      temperature: 1,
      max_tokens: 16384,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `TEXTO:\n\n${text}\n\nRecuerda el formato exacto: texto reescrito completo, una línea con solo ---, y la lista breve de cambios principales. Sin etiquetas (1)/(2).`,
        },
      ],
    }),
  })

  if (!res.ok) {
    return { status: res.status, json: { error: await gwError(res) } }
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: unknown }; finish_reason?: string }>
  }
  const choice = data?.choices?.[0]
  const content = choice?.message?.content
  const truncated = choice?.finish_reason === 'length'
  if (!content || !String(content).trim()) {
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
