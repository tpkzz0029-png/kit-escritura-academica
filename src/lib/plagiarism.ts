// Detector de originalidad (plagio) — análisis lo más meticuloso posible
// 100% en el navegador:
//   1. Repetición interna: pasajes de 8+ palabras repetidos dentro del documento
//      (autoplagio, plantillas recicladas, párrafos duplicados).
//   2. Citas textuales: detecta comillas «» y "" para que se verifiquen sus referencias.
//   3. Comprobación web orientativa: envía las oraciones más distintivas a
//      DuckDuckGo; solo identifica frases muy divulgadas (no es un índice
//      académico como el de Turnitin).

const NGRAM = 8

export interface DuplicatePassage {
  text: string
  occurrences: number
  /** posición aproximada en el documento (bloques de ~120 palabras) */
  locations: number[]
  words: number
}

export interface QuoteFound {
  text: string
}

export interface WebMatch {
  sentence: string
  found: boolean
  title?: string
  snippet?: string
  url?: string
  /** similitud difusa (Jaccard de palabras de contenido) entre la oración y el fragmento web */
  similarity?: number
}

export interface ParaphrasePair {
  first: string
  second: string
  /** similitud de vocabulario de contenido (0–1) */
  similarity: number
}

export interface PlagiarismReport {
  wordCount: number
  originalityScore: number
  duplicateRatio: number
  duplicatedWords: number
  passages: DuplicatePassage[]
  quotes: QuoteFound[]
  webChecks: WebMatch[]
  webError?: string
  /** pares de oraciones con vocabulario casi idéntico (paráfrasis interna sospechosa) */
  paraphrases: ParaphrasePair[]
  /** la sección de referencias/bibliografía se excluyó del análisis */
  excludedReferences: boolean
  /** las citas textuales entrecomilladas se excluyeron del análisis */
  excludedQuotes: boolean
  /** la comprobación de pasajes repetidos estaba desactivada */
  duplicatesDisabled: boolean
}

export interface PlagiarismOptions {
  /** comprobar pasajes repetidos / plantillas recicladas (por defecto true) */
  checkDuplicates?: boolean
  /** excluir la sección de referencias/bibliografía (por defecto true) */
  ignoreReferences?: boolean
  /** no analizar citas textuales entrecomilladas (por defecto true) */
  ignoreQuotes?: boolean
}

const norm = (t: string) =>
  t
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

const tokenize = (text: string): string[] => norm(text).match(/[a-zñü0-9]+/g) ?? []

const clamp = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v))

/* ───────────────────── 1. repetición interna ───────────────────── */

export function findInternalDuplicates(text: string): {
  passages: DuplicatePassage[]
  duplicatedWords: number
  ratio: number
  wordCount: number
} {
  const words = tokenize(text)
  const wordCount = words.length
  const blockSize = 120

  // mapa n-grama → posiciones de inicio (en palabras)
  const positions = new Map<string, number[]>()
  for (let i = 0; i + NGRAM <= words.length; i++) {
    const g = words.slice(i, i + NGRAM).join(' ')
    const arr = positions.get(g)
    if (arr) arr.push(i)
    else positions.set(g, [i])
  }
  const byStart = new Map<number, string>()
  positions.forEach((pos, g) => pos.forEach((p) => byStart.set(p, g)))

  const repeatedStarts = Array.from(byStart.keys())
    .filter((p) => (positions.get(byStart.get(p)!)?.length ?? 0) >= 2)
    .sort((a, b) => a - b)

  const passages: DuplicatePassage[] = []
  let skipUntil = -1
  for (const start of repeatedStarts) {
    if (start < skipUntil) continue
    const gram = byStart.get(start)!
    const pos = positions.get(gram)!
    if (pos[0] !== start) continue
    const p1 = pos[0]
    const p2 = pos[1]
    // extender la cadena mientras ambas copias continúen iguales
    // (los n-gramas solapados avanzan una palabra cada vez)
    let len = NGRAM
    for (;;) {
      const next = p1 + len - NGRAM + 1
      if (!byStart.has(next)) break
      if (!(positions.get(byStart.get(next)!) ?? []).includes(p2 + len - NGRAM + 1)) break
      len++
    }
    passages.push({
      text: words.slice(p1, p1 + len).join(' '),
      occurrences: Math.min(pos.length, 9),
      locations: [Math.floor(p1 / blockSize) + 1, Math.floor(p2 / blockSize) + 1],
      words: len,
    })
    skipUntil = p1 + len
  }

  // eliminar pasajes contenidos en otros más largos
  const filtered = passages.filter(
    (p) => !passages.some((q) => q !== p && q.text.includes(p.text) && q.words > p.words)
  )
  filtered.sort((a, b) => b.words - a.words)

  const duplicatedWords = filtered.reduce((acc, p) => acc + p.words * (p.occurrences - 1), 0)
  const ratio = wordCount > 0 ? duplicatedWords / wordCount : 0
  return { passages: filtered.slice(0, 20), duplicatedWords, ratio, wordCount }
}

/* ───────────────────── 2. citas textuales ───────────────────── */

export function findQuotes(text: string): QuoteFound[] {
  const quotes: QuoteFound[] = []
  const re = /[«"“]([^«»"”]{12,400})[»"”]/g
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    quotes.push({ text: m[1].trim() })
    if (quotes.length >= 30) break
  }
  return quotes
}

/* ─────────────────── 2b. matching difuso (paráfrasis) ───────────────────
   Estilo Copyleaks: comparación semántica por similitud de vocabulario de
   contenido (Jaccard), capaz de detectar parafraseo aunque cambien las
   palabras pero se conserve la estructura. */

const STOPWORDS = new Set(
  'para pero como porque cuando donde sobre entre desde hasta tambien ademas entonces asi este esta estos estas ese esa esos esas aquel aquella que los las un una unos unas del al el la y o u a e en de con por se su sus le lo les mi mis tu tus the and that those this these with from were are was for his her their its our your'.split(
    ' '
  )
)

function contentTokens(text: string): string[] {
  return tokenize(text).filter((t) => t.length > 3 && !STOPWORDS.has(t))
}

/* familias de sinónimos: dos palabras de la misma familia cuentan como
   iguales en la comparación (paráfrasis con sinónimos reales) */
const SYNONYM_FAMILIES: string[][] = [
  ['transforma', 'transformar', 'cambia', 'cambian', 'altera', 'modifica', 'reconfigura'],
  ['industria', 'industrial', 'sector', 'empresa', 'empresas', 'compania', 'companias', 'negocio', 'organizacion', 'organizaciones'],
  ['moderna', 'moderno', 'actual', 'contemporanea', 'contemporaneo', 'reciente'],
  ['profunda', 'profundo', 'significativa', 'significativo', 'notable', 'considerable', 'sustancial'],
  ['inteligencia', 'automatizacion', 'automatica', 'automatico', 'robotica', 'computacional', 'digital'],
  ['artificial', 'automatizada', 'automatizado', 'sintetica', 'sintetico'],
  ['forma', 'manera', 'modo'],
  ['herramientas', 'herramienta', 'soluciones', 'solucion', 'sistemas', 'sistema', 'tecnologias', 'tecnologia'],
  ['adoptan', 'adopta', 'incorporan', 'incorpora', 'usan', 'usa', 'utilizan', 'utiliza', 'emplean', 'emplea', 'implementan', 'implementa'],
  ['mejorar', 'optimizar', 'optimiza', 'perfeccionar', 'incrementar', 'incrementa', 'potenciar', 'potencia'],
  ['procesos', 'proceso', 'tareas', 'tarea', 'produccion', 'productivos', 'productivo', 'operaciones', 'operacion', 'actividades', 'actividad'],
  ['diarias', 'diario', 'cotidianas', 'cotidiano', 'habituales', 'habitual', 'frecuentes', 'frecuente'],
  ['impacto', 'efecto', 'efectos', 'influencia', 'repercusion', 'consecuencia', 'consecuencias'],
  ['desarrollo', 'desarrolla', 'avance', 'avances', 'progreso', 'evolucion', 'evoluciona', 'crecimiento'],
  ['problema', 'problemas', 'desafio', 'desafios', 'dificultad', 'dificultades', 'reto', 'retos', 'obstaculo', 'obstaculos'],
  ['beneficio', 'beneficios', 'ventaja', 'ventajas', 'aporte', 'aportes', 'ganancia', 'ganancias'],
  ['sociedad', 'sociedades', 'comunidad', 'comunidades', 'poblacion', 'mundo', 'entorno'],
  ['estudio', 'estudios', 'investigacion', 'investigaciones', 'analisis', 'trabajo', 'trabajos', 'articulo', 'articulos'],
  ['resultado', 'resultados', 'hallazgo', 'hallazgos', 'conclusion', 'conclusiones', 'evidencia', 'evidencias'],
  ['metodo', 'metodos', 'tecnica', 'tecnicas', 'procedimiento', 'procedimientos', 'enfoque', 'enfoques', 'estrategia', 'estrategias'],
  ['aumenta', 'aumentan', 'incrementa', 'incrementan', 'eleva', 'elevan', 'incremento', 'crecimiento'],
  ['reduce', 'reducen', 'disminuye', 'disminuyen', 'disminucion', 'reduccion', 'menor', 'menores'],
  ['importante', 'relevante', 'trascendental', 'clave', 'central', 'esencial', 'crucial', 'decisivo', 'decisiva', 'primordial'],
  ['permite', 'permiten', 'posibilita', 'posibilitan', 'habilita', 'habilitan', 'facilita', 'facilitan'],
  ['necesario', 'necesaria', 'imprescindible', 'requerido', 'requerida', 'obligatorio', 'obligatoria'],
  ['gran', 'considerable', 'enorme', 'amplia', 'amplio', 'extensa', 'extenso'],
  ['rapido', 'rapida', 'veloz', 'acelerado', 'acelerada', 'inmediato', 'inmediata', 'agil'],
  ['eficiente', 'eficaz', 'productivo', 'productiva', 'rentable', 'optimo', 'optima'],
  ['facil', 'sencillo', 'sencilla', 'simple', 'accesible', 'asequible'],
  ['dificil', 'complejo', 'compleja', 'complicado', 'complicada', 'arduo', 'ardua', 'costoso', 'costosa'],
]

const FAMILY_OF: Record<string, string> = {}
SYNONYM_FAMILIES.forEach((fam, i) => {
  for (const w of fam) if (!(w in FAMILY_OF)) FAMILY_OF[w] = `fam${i}`
})

/** tokens de contenido mapeados a familias de sinónimos */
function contentFamilies(text: string): string[] {
  return contentTokens(text).map((t) => FAMILY_OF[t] ?? t)
}

/** Jaccard de conjuntos de familias de sinónimos (0–1) */
function familyJaccard(a: string, b: string): number {
  const A = new Set(contentFamilies(a))
  const B = new Set(contentFamilies(b))
  if (A.size === 0 || B.size === 0) return 0
  let inter = 0
  A.forEach((w) => {
    if (B.has(w)) inter++
  })
  const union = A.size + B.size - inter
  const jaccard = inter / union
  // contención: qué parte del vocabulario más corto está cubierto por el otro
  const containment = inter / Math.min(A.size, B.size)
  return Math.max(jaccard, containment * 0.85)
}

/** Jaccard de conjuntos de palabras de contenido (0–1) */
function wordJaccard(a: string, b: string): number {
  const A = new Set(contentTokens(a))
  const B = new Set(contentTokens(b))
  if (A.size === 0 || B.size === 0) return 0
  let inter = 0
  A.forEach((w) => {
    if (B.has(w)) inter++
  })
  return inter / (A.size + B.size - inter)
}

/**
 * Pares de oraciones distintas con vocabulario de contenido casi idéntico:
 * señal de paráfrasis interna (el mismo contenido reescrito dos veces, típico
 * de plantillas recicladas o de expandir párrafos con IA).
 */
export function findParaphrases(text: string, threshold = 0.55, maxPairs = 12): ParaphrasePair[] {
  const sentences = text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.split(/\s+/).length >= 8)
  const pairs: ParaphrasePair[] = []
  for (let i = 0; i < sentences.length; i++) {
    for (let j = i + 1; j < sentences.length; j++) {
      const sim = familyJaccard(sentences[i], sentences[j])
      if (sim >= threshold) {
        pairs.push({ first: sentences[i], second: sentences[j], similarity: Math.round(sim * 100) / 100 })
      }
    }
  }
  pairs.sort((a, b) => b.similarity - a.similarity)
  return pairs.slice(0, maxPairs)
}

/* ───────────────────── 3. comprobación web ───────────────────── */

function distinctiveSentences(text: string, max = 8): string[] {
  const sentences = text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => {
      const wc = s.split(/\s+/).length
      return wc >= 10 && wc <= 45
    })
  // priorizar las más largas y con más palabras de contenido
  const scored = sentences.map((s) => {
    const toks = tokenize(s)
    const distinct = new Set(toks).size
    return { s, score: toks.length * (1 - distinct / Math.max(1, toks.length)) + toks.length * 0.4 }
  })
  scored.sort((a, b) => b.score - a.score)
  const seen = new Set<string>()
  const picked: string[] = []
  for (const { s } of scored) {
    const key = norm(s).slice(0, 60)
    if (seen.has(key)) continue
    seen.add(key)
    picked.push(s)
    if (picked.length >= max) break
  }
  return picked
}

async function checkSentenceWeb(sentence: string): Promise<WebMatch> {
  const q = `"${sentence.slice(0, 140)}"`
  const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(q)}&format=json&no_html=1&skip_disambig=1`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`DuckDuckGo respondió ${res.status}`)
  const data = await res.json()
  const hasAbstract = typeof data.AbstractText === 'string' && data.AbstractText.trim().length > 20
  const hasTopics = Array.isArray(data.RelatedTopics) && data.RelatedTopics.length > 0
  const found = hasAbstract || hasTopics
  const snippet = hasAbstract ? data.AbstractText.slice(0, 220) : undefined
  // matching difuso: aunque la frase exacta no coincida, medir la similitud
  // con el fragmento encontrado (paráfrasis de fuentes divulgadas)
  const similarity = snippet ? Math.round(wordJaccard(sentence, snippet) * 100) / 100 : undefined
  return {
    sentence,
    found,
    title: data.Heading || undefined,
    snippet,
    similarity,
    url: data.AbstractURL || (hasTopics ? data.RelatedTopics[0]?.FirstURL : undefined),
  }
}

/* ───────────────────── utilidades de exclusión ───────────────────── */

/** separa la sección de referencias/bibliografía (va del encabezado al final) */
export function stripReferencesSection(text: string): { main: string; excluded: boolean } {
  const re = /^\s*(referencias|referencias bibliográficas|referencias bibliograficas|bibliografía|bibliografia|fuentes consultadas|fuentes|references|bibliography|works cited)\s*[.:]?\s*$/im
  const m = re.exec(text)
  if (!m || m.index === undefined) return { main: text, excluded: false }
  return { main: text.slice(0, m.index).trim(), excluded: true }
}

/** textos entrecomillados (normalizados), para excluirlos del análisis */
export function quotedTexts(text: string): string[] {
  return findQuotes(text).map((q) => norm(q.text).replace(/\s+/g, ' ').trim())
}

/* ───────────────────── API principal ───────────────────── */

export async function analyzeOriginality(
  text: string,
  options: PlagiarismOptions = {},
  onProgress?: (done: number, total: number) => void
): Promise<PlagiarismReport> {
  const checkDuplicates = options.checkDuplicates !== false
  const ignoreReferences = options.ignoreReferences !== false
  const ignoreQuotes = options.ignoreQuotes !== false

  let workingText = text
  let excludedReferences = false
  if (ignoreReferences) {
    const stripped = stripReferencesSection(workingText)
    workingText = stripped.main
    excludedReferences = stripped.excluded
  }

  const quotes = findQuotes(workingText)
  const quotedNorm = ignoreQuotes ? quotedTexts(workingText) : []

  let passages: DuplicatePassage[] = []
  let duplicatedWords = 0
  let ratio = 0
  let wordCount = tokenize(workingText).length
  if (checkDuplicates) {
    const dup = findInternalDuplicates(workingText)
    if (ignoreQuotes) {
      // quitar pasajes que son citas textuales entrecomilladas
      dup.passages = dup.passages.filter(
        (p) => !quotedNorm.some((q) => q.includes(norm(p.text)))
      )
      dup.duplicatedWords = dup.passages.reduce((acc, p) => acc + p.words * (p.occurrences - 1), 0)
      dup.ratio = dup.wordCount > 0 ? dup.duplicatedWords / dup.wordCount : 0
    }
    passages = dup.passages
    duplicatedWords = dup.duplicatedWords
    ratio = dup.ratio
    wordCount = dup.wordCount
  }

  let candidates = distinctiveSentences(workingText)
  if (ignoreQuotes) {
    candidates = candidates.filter(
      (s) => !quotedNorm.some((q) => q.includes(norm(s)))
    )
  }

  const webChecks: WebMatch[] = []
  let webError: string | undefined
  for (let i = 0; i < candidates.length; i++) {
    try {
      const r = await checkSentenceWeb(candidates[i])
      webChecks.push(r)
    } catch (e) {
      webError =
        e instanceof Error
          ? 'La comprobación web no estuvo disponible (límite de solicitudes o sin conexión). El análisis interno sí es completo.'
          : 'Error en la comprobación web.'
      break
    }
    onProgress?.(i + 1, candidates.length)
    if (i < candidates.length - 1) await new Promise((r) => setTimeout(r, 400))
  }

  const webFound = webChecks.filter((c) => c.found).length
  const paraphrases = findParaphrases(workingText)
  const originalityScore = clamp(
    Math.round(
      100 -
        Math.min(60, ratio * 300) -
        Math.min(24, webFound * 8) -
        Math.min(12, paraphrases.length * 4)
    )
  )

  return {
    wordCount,
    originalityScore,
    duplicateRatio: ratio,
    duplicatedWords,
    passages,
    quotes,
    webChecks,
    webError,
    paraphrases,
    excludedReferences,
    excludedQuotes: ignoreQuotes,
    duplicatesDisabled: !checkDuplicates,
  }
}
