// Motor de detección de texto generado por IA — análisis heurístico inspirado en
// el pipeline público de Turnitin: segmentación en ventanas solapadas, puntuación
// 0–100 por segmento y agregación al nivel de documento.

export type RiskLabel = 'humano' | 'incierto' | 'ia'
export type Confidence = 'baja' | 'media' | 'alta'

export interface MetricResult {
  key: string
  name: string
  aiScore: number // 0–100: mayor = más parecido a texto de IA
  detail: string
}

export interface SegmentResult {
  index: number
  preview: string
  words: number
  score: number
  label: RiskLabel
  reasons: string[]
}

export interface AIDetectionReport {
  wordCount: number
  overallScore: number
  label: RiskLabel
  confidence: Confidence
  metrics: MetricResult[]
  segments: SegmentResult[]
  warnings: string[]
}

export interface SentenceResult {
  index: number
  text: string
  words: number
  score: number
  label: RiskLabel
  flags: string[]
}

/* ───────────────────────── utilidades lingüísticas ───────────────────────── */

const norm = (t: string) =>
  t
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

const tokenize = (text: string): string[] => norm(text).match(/[a-zñü]+/g) ?? []

const splitSentences = (text: string): string[] =>
  text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?…])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 1)

/* ────────────────── listas de vocabulario frecuente (proxy ─────────────────
   de probabilidad de palabra: texto de IA elige palabras más predecibles) ── */

const COMMON_EN =
  'the of and to in is you that it he was for on are as with his they i at be this have from or one had by word but not what all were we when your can said there use an each which she do how their if will up other about out many then them these so some her would make like him into time has look two more write go see number no way could people my than first water been call who oil its now find long down day did get come made may part over new sound take only little work know place year live me back give most very after thing our just name good sentence man think say great where help through much before line right too mean old any same tell boy follow came want show also around form three small set put end does another well large must big even such because turn here why ask went men read need land different home us move try kind hand picture again change off play spell air away animal house point page letter mother answer found study still learn should world high every near add food between own below country plant last school father keep tree never start city earth eye light thought head under story saw left few while along might close something seem next hard open example begin life always those both paper together got group often run'.split(
    ' '
  )

const COMMON_ES =
  'de la que el en y a los del se las por un para con no una su al lo es como mas pero sus le ya o este si porque esta entre cuando muy sin sobre tambien me hasta hay donde quien desde todo nos durante todos uno les ni contra otros ese eso ante ellos esto mi antes algunos unos yo otro otras otra tanto esa estos mucho quienes nunca ser estar tener hacer decir ir ver dar saber querer poder llegar deber poner parecer quedar llevar dejar seguir encontrar venir pensar salir volver tomar conocer vivir creer hablar gustar pasar recibir presentar realizar existir pedir llamar resultar intentar trabajar estudiar escribir leer comprender significar permitir esperar necesitar buscar pagar entender jugar sentar servir conseguir convertir producir ofrecer suponer lograr mostrar desarrollar mantener exigir abrir recordar comenzar terminar ganar perder morir nacer crecer forma caso casa mundo vida vez lugar tiempo ano dia hora semana mes punto lado tipo sistema programa trabajo gobierno pais sociedad historia problema cuestion grupo numero hombre mujer nino nina familia amigo persona ciudad pueblo calle tierra agua mano ojo palabra nombre puerta ventana mesa noche luz manana tarde momento siglo fin principio razon ejemplo condicion cambio precio valor medio mercado empresa servicio producto proceso resultado nivel calidad cantidad desarrollo crecimiento aumento disminucion necesidad posibilidad capacidad funcion efecto causa hecho verdad mentira idea pensamiento sentimiento amor odio miedo alegria tristeza bueno malo mejor peor grande pequeno largo corto alto bajo facil dificil importante posible imposible necesario cierto verdadero falso real mismo otro cualquier primer segundo tercero nuevo viejo joven fuerte debil rapido lento proximo anterior mayor menor superior inferior muchos muchas pocos pocas varios varias demasiado algo nada alguien nadie cualquiera cada algun ningun ambos tales cual cuyo cuanto cuanta ahora bien aun todavia siempre jamas quizas apenas bastante casi solo asi pues aunque mientras tanto luego despues antes hoy ayer manana aqui ahi alla dentro fuera encima debajo delante detras nunca tampoco ademas asimismo sin embargo no obstante por eso por lo tanto en cambio al contrario finalmente inicialmente posteriormente anteriormente recientemente actualmente generalmente normalmente especialmente particularmente simplemente claramente facilmente rapidamente lentamente probablemente posiblemente seguramente ciertamente verdaderamente realmente usualmente frecuentemente raramente'.split(
    ' '
  )

const COMMON = {
  en: new Set(COMMON_EN),
  es: new Set(COMMON_ES),
}

/* ────────── frases típicas / transiciones de molde del texto de IA ───────── */

const AI_PHRASES = [
  // inglés
  'it is important to note',
  'it is worth noting',
  'it is essential',
  'it is crucial',
  'in conclusion',
  'in summary',
  'to summarize',
  'to sum up',
  'overall',
  'furthermore',
  'moreover',
  'additionally',
  'consequently',
  'as a result',
  'plays a crucial role',
  'plays a vital role',
  'plays an important role',
  'plays a significant role',
  'in the realm of',
  'in the world of',
  'in today',
  'delve into',
  'delving into',
  'a testament to',
  'underscores the importance',
  'highlighting the importance',
  'navigate the complexities',
  'ever-evolving',
  'ever-changing',
  'crucial to understand',
  'essential to understand',
  'serves as a',
  'a wide range of',
  'a variety of',
  'the importance of',
  'when it comes to',
  'stands out as',
  'in today fast-paced',
  'in the digital age',
  'revolutionize',
  'revolutionary',
  'game-changer',
  'cutting-edge',
  'seamless',
  'unlock the potential',
  'it goes without saying',
  'needless to say',
  'last but not least',
  'first and foremost',
  'on the other hand',
  'in addition to',
  'not only',
  'but also',
  // español
  'es importante destacar',
  'es importante senalar',
  'cabe destacar',
  'cabe senalar',
  'vale la pena destacar',
  'en conclusion',
  'en resumen',
  'para resumir',
  'en definitiva',
  'en el ambito de',
  'en el mundo de',
  'en la actualidad',
  'en el mundo actual',
  'en la era digital',
  'juega un papel fundamental',
  'juega un papel crucial',
  'desempena un papel',
  'es fundamental comprender',
  'es esencial comprender',
  'es crucial comprender',
  'ademas',
  'asimismo',
  'por otro lado',
  'por lo tanto',
  'en consecuencia',
  'como resultado',
  'no solo',
  'sino tambien',
  'a lo largo de la historia',
  'en constante evolucion',
  'amplia gama de',
  'una variedad de',
  'la importancia de',
  'destaca por',
  'se destaca',
  'revolucionar',
  'solucion robusta',
  'punto crucial',
  'aspecto clave',
  'ultimamente',
]

/* ───── lenguaje grandilocuente y metáforas típicas del texto de IA ─────
   Los modelos de lenguaje tienden a apilar metáforas elevadas, superlativos
   de manual y construcciones paralelas ("cada X, cada Y y cada Z") para dar
   solemnidad. Un humano rara vez los concentra con esta densidad. */

const GRANDILOQUENT = [
  // español — términos de corte épico/solemne
  'cosmico',
  'colosal',
  'imponente',
  'grandioso',
  'trascendental',
  'legendario',
  'mitico',
  'inmenso',
  'titanico',
  'majestuoso',
  'sublime',
  'prodigioso',
  'deslumbrante',
  'portentoso',
  'etereo',
  'imparable',
  'incansable',
  'implacable',
  'inquebrantable',
  'imperecedero',
  'latir',
  'latido',
  'respirar',
  'pulsar',
  'danzar',
  'sinfonia',
  'mosaico',
  'tapiz',
  // español — locuciones (se casan con espacios para no dar falsos positivos)
  'archivo vivo',
  'biografia secreta',
  'profundidad del tiempo',
  'reloj cosmico',
  'memoria de eventos',
  'corazon de',
  'en el corazon de',
  'oceano de',
  'universo de',
  'miles de millones de anos',
  'danza de',
  // inglés
  'cosmic',
  'colossal',
  'majestic',
  'sublime',
  'tapestry',
  'breathtaking',
  'awe-inspiring',
  'timeless',
  'dance of',
  'symphony of',
  'heartbeat of',
  'tapestry of',
  'a testament to',
]

/* superlativos "de manual": el modelo elige siempre el extremo del adjetivo */
const SUPERLATIVE_RE =
  /mas (imponente|imponentes|profundo|profunda|profundos|profundas|grande|grandes|importante|importantes|relevante|relevantes|extremo|extrema|extremos|extremas|alta|alto|altas|altos|baja|bajo|bajas|bajos|vasta|vasto|vastas|vastos|compleja|complejo|complejas|complejos|sofisticad[ao]s?|avanzad[ao]s?|destacad[ao]s?|antigu[ao]s?|recóndit[ao]s?|remot[ao]s?)/g

/* marcadores de voz personal (normalizados, se casan con espacios) */
const PERSONAL_MARKERS = [
  'yo',
  'mi',
  'mis',
  'me',
  'nosotros',
  'nosotras',
  'nuestro',
  'nuestra',
  'nuestros',
  'nuestras',
  'en mi opinion',
  'en mi experiencia',
  'en nuestra experiencia',
  'creo que',
  'considero que',
  'pienso que',
  'i',
  'my',
  'we',
  'our',
  'us',
  'in my experience',
  'i believe',
  'i think',
]

/* sustantivos abstractos de relleno típicos del texto de IA genérico */
const VAGUE_NOUNNS = new Set(
  'aspecto elemento factor ambito area sistema proceso estructura desarrollo importancia papel desafio oportunidad transformacion evolucion impacto debate sociedad panorama escenario horizonte dimension dinamica complejidad diversidad variedad riqueza calidad cantidad conjunto serie gama abanico entorno contexto marco campo disciplina area conocimiento fenomeno realidad cuestion tema challenge aspect element factor area system process structure development importance role opportunity transformation evolution impact debate society landscape scenario horizon dimension dynamic complexity diversity variety quality quantity range framework field knowledge phenomenon reality issue'
    .split(' ')
)

/* ────────────────────────── señales estadísticas ─────────────────────────── */

const clamp = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v))
const scale = (v: number, lo: number, hi: number) => clamp(((v - lo) / (hi - lo)) * 100)

function mean(xs: number[]): number {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0
}
function std(xs: number[]): number {
  if (xs.length < 2) return 0
  const m = mean(xs)
  return Math.sqrt(mean(xs.map((x) => (x - m) ** 2)))
}
const cv = (xs: number[]) => {
  const m = mean(xs)
  return m > 0 ? std(xs) / m : 0
}

interface Signals {
  burstiness: number // 0–100 (alto = monótono, típico de IA)
  predictability: number
  diversity: number
  repetition: number
  phrases: number
  metaphors: number // lenguaje grandilocuente / metáforas de manual
  generic: number // escritura genérica o desapegada (Turnitin)
  startUniformity: number
}

function detectLang(tokens: string[]): 'en' | 'es' {
  let en = 0
  let es = 0
  for (const t of tokens) {
    if (COMMON.en.has(t)) en++
    if (COMMON.es.has(t)) es++
  }
  return es > en ? 'es' : 'en'
}

function computeSignals(text: string): Signals {
  const sentences = splitSentences(text)
  const sentenceLens = sentences.map((s) => tokenize(s).length).filter((n) => n > 0)
  const tokens = tokenize(text)
  const total = tokens.length || 1

  // 1. Burstiness: variación de longitud de oración (IA = ritmo plano)
  const burstCv = cv(sentenceLens)
  const burstiness = scale(1 - burstCv, 0.35, 0.9)

  // 2. Predecibilidad: cobertura de vocabulario frecuente (proxy de perplejidad)
  const lang = detectLang(tokens)
  const freq = COMMON[lang]
  let covered = 0
  for (const t of tokens) if (freq.has(t)) covered++
  const coverage = covered / total
  const predictability = scale(coverage, 0.08, 0.38)

  // 3. Diversidad léxica: repetición de PALABRAS DE CONTENIDO (las de función
  // se repiten igual en humanos; las de contenido repetidas en exceso delatan IA)
  let contentTotal = 0
  const contentSeen = new Set<string>()
  let contentRepeats = 0
  for (const t of tokens) {
    if (freq.has(t)) continue
    contentTotal++
    if (contentSeen.has(t)) contentRepeats++
    else contentSeen.add(t)
  }
  const repContent = contentTotal >= 10 ? contentRepeats / contentTotal : 0
  const diversity = scale(repContent, 0.05, 0.3)

  // 4. Repetición: n-gramas (3) repetidos y comienzos de oración idénticos
  const n = 3
  const grams = new Map<string, number>()
  for (let i = 0; i + n <= tokens.length; i++) {
    const g = tokens.slice(i, i + n).join(' ')
    grams.set(g, (grams.get(g) ?? 0) + 1)
  }
  let repeated = 0
  grams.forEach((c) => {
    if (c > 1) repeated += c
  })
  const repRatio = grams.size ? repeated / (tokens.length - n + 1) : 0

  const starts = sentences.map((s) => norm(s).split(' ')[0] ?? '')
  const startCounts = new Map<string, number>()
  starts.forEach((s) => startCounts.set(s, (startCounts.get(s) ?? 0) + 1))
  let maxStart = 0
  startCounts.forEach((c) => {
    maxStart = Math.max(maxStart, c)
  })
  const startRatio = starts.length > 2 ? (maxStart - 1) / starts.length : 0
  const repetition = clamp(scale(repRatio, 0.02, 0.14) * 0.6 + scale(startRatio, 0.12, 0.5) * 0.4)

  // 5. Frases de molde propias de IA (por cada 100 palabras)
  const flat = ' ' + norm(text).replace(/[^a-zñü0-9 ]/g, ' ').replace(/\s+/g, ' ') + ' '
  let hits = 0
  for (const p of AI_PHRASES) {
    const needle = ' ' + p + ' '
    let idx = flat.indexOf(needle)
    while (idx !== -1) {
      hits++
      idx = flat.indexOf(needle, idx + 1)
    }
  }
  const per100 = (hits / total) * 100
  const phrases = scale(per100, 0.4, 4)

  // 6. Lenguaje grandilocuente: metáforas elevadas, superlativos de manual y
  //    construcciones paralelas (por cada 100 palabras)
  let grandHits = 0
  for (const t of GRANDILOQUENT) {
    const needle = ' ' + t + ' '
    let idx = flat.indexOf(needle)
    while (idx !== -1) {
      grandHits++
      idx = flat.indexOf(needle, idx + 1)
    }
  }
  const supMatches = flat.match(SUPERLATIVE_RE)
  grandHits += (supMatches?.length ?? 0) * 0.5
  // construcciones paralelas: "cada X, cada Y y cada Z" y tríadas "a, b, y c"
  for (const s of sentences) {
    const cada = s.match(/\bcada\b/g)
    if ((cada?.length ?? 0) >= 3) grandHits += 0.5
    const tri = s.match(/[^.!?;,]{3,40},[^.!?;,]{3,40},\s*y\s+[^.!?;,]{3,40}/g)
    grandHits += (tri?.length ?? 0) * 0.25
  }
  const metaphors = scale((grandHits / total) * 100, 0.25, 4)

  // 7. Escritura genérica o desapegada (señal pública de Turnitin): el texto de
  //    IA carece de anclas concretas (cifras, fechas, nombres propios) y de voz
  //    personal, y se apoya en sustantivos abstractos de relleno.
  let digitTokens = 0
  for (const t of tokens) if (/\d/.test(t)) digitTokens++
  let proper = 0
  for (const s of sentences) {
    const ws = s.split(/\s+/)
    for (let i = 1; i < ws.length; i++) {
      if (/^[A-ZÁÉÍÓÚÑ][a-záéíóúñ]/.test(ws[i])) proper++
    }
  }
  let personal = 0
  for (const marker of PERSONAL_MARKERS) {
    const needle = ' ' + marker + ' '
    let idx = flat.indexOf(needle)
    while (idx !== -1) {
      personal++
      idx = flat.indexOf(needle, idx + 1)
    }
  }
  let vague = 0
  for (const t of tokens) if (VAGUE_NOUNNS.has(t)) vague++
  const anchorsPer100 = ((digitTokens + proper + personal * 2) / total) * 100
  const vaguePer100 = (vague / total) * 100
  const generic = clamp((scale(anchorsPer100, 2, 0.2) * scale(vaguePer100, 0.5, 4)) / 100)

  return { burstiness, predictability, diversity, repetition, phrases, metaphors, generic, startUniformity: repetition }
}

const WEIGHTS = {
  burstiness: 0.2,
  predictability: 0.05,
  diversity: 0.1,
  repetition: 0.16,
  phrases: 0.17,
  metaphors: 0.17,
  generic: 0.15,
}

function combine(s: Signals): number {
  return clamp(
    WEIGHTS.burstiness * s.burstiness +
      WEIGHTS.predictability * s.predictability +
      WEIGHTS.diversity * s.diversity +
      WEIGHTS.repetition * s.repetition +
      WEIGHTS.phrases * s.phrases +
      WEIGHTS.metaphors * s.metaphors +
      WEIGHTS.generic * s.generic
  )
}

export function labelFor(score: number): RiskLabel {
  if (score < 35) return 'humano'
  if (score <= 65) return 'incierto'
  return 'ia'
}

const REASON_LABELS: Record<keyof Omit<Signals, 'startUniformity'>, string> = {
  burstiness: 'ritmo de oraciones demasiado uniforme (baja burstiness)',
  predictability: 'vocabulario muy predecible (perplejidad baja)',
  diversity: 'vocabulario repetitivo y poco variado',
  repetition: 'repetición de estructuras y comienzos de oración',
  phrases: 'abundancia de frases de transición típicas de IA',
  metaphors: 'lenguaje grandilocuente y metáforas típicas de IA',
  generic: 'escritura genérica y desapegada, sin datos concretos ni voz personal',
}

function topReasons(s: Signals): string[] {
  const entries = (Object.entries(s) as Array<[keyof Signals, number]>)
    .filter(([k]) => k !== 'startUniformity')
    .sort((a, b) => b[1] - a[1])
  return entries
    .filter(([, v]) => v > 55)
    .slice(0, 3)
    .map(([k]) => REASON_LABELS[k as keyof typeof REASON_LABELS] ?? k)
}

/* ───────────────────────────── API principal ─────────────────────────────── */

const WINDOW = 250
const STEP = 200
const MIN_SEGMENT_WORDS = 40

export function analyzeText(raw: string): AIDetectionReport {
  const text = raw.replace(/\r/g, '').trim()
  const tokens = tokenize(text)
  const wordCount = tokens.length
  const warnings: string[] = []

  if (wordCount < 300) {
    warnings.push(
      'El texto tiene menos de 300 palabras. La detección de IA fiable necesita textos más largos (Turnitin exige ~300 como mínimo).'
    )
  }
  if (splitSentences(text).length < 5) {
    warnings.push('Pocas oraciones detectadas; el análisis de ritmo (burstiness) será poco fiable.')
  }

  // Métricas globales
  const g = computeSignals(text)
  const metrics: MetricResult[] = [
    {
      key: 'burstiness',
      name: 'Burstiness (variación del ritmo)',
      aiScore: Math.round(g.burstiness),
      detail:
        g.burstiness > 60
          ? 'Las oraciones tienen longitudes muy parecidas, ritmo monótono típico de IA.'
          : g.burstiness > 35
            ? 'Variación de ritmo moderada.'
            : 'Ritmo variado, característico de escritura humana.',
    },
    {
      key: 'predictability',
      name: 'Perplejidad (predecibilidad, estimación)',
      aiScore: Math.round(g.predictability),
      detail:
        g.predictability > 70
          ? 'Vocabulario extremadamente frecuente y seguro (estimación basada en frecuencias, sin modelo de lenguaje).'
          : g.predictability > 40
            ? 'Predecibilidad media.'
            : 'Elecciones de vocabulario variadas e impredecibles.',
    },
    {
      key: 'diversity',
      name: 'Repetición de vocabulario de contenido',
      aiScore: Math.round(g.diversity),
      detail:
        g.diversity > 60
          ? 'Las palabras de contenido (las que aportan significado) se reciclan constantemente.'
          : g.diversity > 35
            ? 'Algo de repetición de vocabulario temático.'
            : 'El vocabulario de contenido apenas se repite.',
    },
    {
      key: 'repetition',
      name: 'Repetición de estructuras',
      aiScore: Math.round(g.repetition),
      detail:
        g.repetition > 60
          ? 'N-gramas y comienzos de oración repetidos de forma sistemática.'
          : 'Poca repetición estructural.',
    },
    {
      key: 'phrases',
      name: 'Frases de molde de IA',
      aiScore: Math.round(g.phrases),
      detail:
        g.phrases > 60
          ? 'Concentración alta de transiciones y muletillas propias de modelos de lenguaje.'
          : g.phrases > 35
            ? 'Algunas frases de molde detectadas.'
            : 'Escaso uso de frases hechas de IA.',
    },
    {
      key: 'metaphors',
      name: 'Lenguaje grandilocuente y metáforas',
      aiScore: Math.round(g.metaphors),
      detail:
        g.metaphors > 60
          ? 'Abundancia de metáforas elevadas, superlativos extremos y construcciones paralelas ("cada X, cada Y y cada Z"): estilo típico de los modelos de lenguaje.'
          : g.metaphors > 35
            ? 'Algunas metáforas de corte épico o superlativos de manual.'
            : 'Lenguaje sobrio, sin ornamentación excesiva.',
    },
    {
      key: 'generic',
      name: 'Escritura genérica o desapegada',
      aiScore: Math.round(g.generic),
      detail:
        g.generic > 60
          ? 'Casi no hay cifras, datos concretos, nombres propios ni voz personal: el texto habla de conceptos abstractos en general, patrón típico de los modelos de lenguaje.'
          : g.generic > 35
            ? 'Pocas anclas concretas (datos, nombres, experiencia propia).'
            : 'El texto incluye datos concretos y voz propia, como la escritura humana.',
    },
  ]

  // Segmentación en ventanas solapadas (pipeline estilo Turnitin)
  const words = text.split(/\s+/).filter(Boolean)
  const segments: SegmentResult[] = []
  if (wordCount >= MIN_SEGMENT_WORDS) {
    for (let start = 0; start + MIN_SEGMENT_WORDS <= Math.min(words.length, start + WINDOW); start += STEP) {
      const slice = words.slice(start, start + WINDOW).join(' ')
      const wc = start + WINDOW >= words.length ? wordCount - start : WINDOW
      if (wc < MIN_SEGMENT_WORDS) break
      const sig = computeSignals(slice)
      const score = combine(sig)
      segments.push({
        index: segments.length + 1,
        preview: slice.length > 220 ? slice.slice(0, 220) + '…' : slice,
        words: wc,
        score: Math.round(score),
        label: labelFor(score),
        reasons: topReasons(sig),
      })
      if (start + WINDOW >= words.length) break
    }
  }

  // Puntuación global: media ponderada por palabras de cada segmento + métricas globales
  let overall: number
  if (segments.length > 0) {
    const segWeighted = mean(segments.map((s) => s.score * s.words)) / mean(segments.map((s) => s.words))
    overall = clamp(combine(g) * 0.45 + segWeighted * 0.55)
  } else {
    overall = combine(g)
  }

  let confidence: Confidence = 'baja'
  if (wordCount >= 300) confidence = 'media'
  if (wordCount >= 600 && segments.length >= 2) {
    const spread = std(segments.map((s) => s.score))
    confidence = spread < 28 ? 'alta' : 'media'
  }

  return {
    wordCount,
    overallScore: Math.round(overall),
    label: labelFor(overall),
    confidence,
    metrics,
    segments,
    warnings,
  }
}

/* ─────────────────── análisis oración por oración ──────────────────────────
   Cada oración se examina de forma independiente: predecibilidad de su
   vocabulario, frases de molde, comienzo y longitud respecto a la anterior,
   y secuencias de 3 palabras ya usadas antes en el texto.                 */

export function analyzeSentences(text: string): SentenceResult[] {
  const sentences = splitSentences(text.replace(/\n+/g, ' '))
  const freq = COMMON[detectLang(tokenize(text))]
  const seenGrams = new Set<string>()
  const results: SentenceResult[] = []
  let prevTokens: string[] = []
  let prevFirst = ''

  for (const sentence of sentences) {
    const tokens = tokenize(sentence)
    const words = tokens.length
    if (words === 0) continue
    const flags: string[] = []

    // predecibilidad del vocabulario de la oración
    let covered = 0
    for (const t of tokens) if (freq.has(t)) covered++
    const pred = scale(covered / words, 0.5, 0.95)

    // frases de molde detectadas (se nombran una a una)
    const flat = ' ' + norm(sentence).replace(/[^a-zñü0-9 ]/g, ' ').replace(/\s+/g, ' ') + ' '
    const hits: string[] = []
    for (const p of AI_PHRASES) {
      if (flat.includes(' ' + p + ' ')) hits.push(p)
    }
    if (hits.length > 0) flags.push(`frase típica de IA: «${hits.join('», «')}»`)

    // lenguaje grandilocuente: metáforas de manual, superlativos extremos y paralelismos
    const grand: string[] = []
    for (const t of GRANDILOQUENT) {
      if (flat.includes(' ' + t + ' ')) grand.push(t)
    }
    if (SUPERLATIVE_RE.test(flat)) {
      SUPERLATIVE_RE.lastIndex = 0
      grand.push('superlativo de manual («más …»)')
    }
    const cada = sentence.match(/\bcada\b/gi)
    if ((cada?.length ?? 0) >= 3) grand.push('construcción paralela «cada X, cada Y y cada Z»')
    if (grand.length > 0) flags.push(`lenguaje grandilocuente: «${grand.slice(0, 2).join('», «')}»`)

    // escritura genérica/desapegada: oración larga sin anclas concretas
    const hasDetail =
      /\d/.test(sentence) ||
      / [A-ZÁÉÍÓÚÑ][a-záéíóúñ]{2,}/.test(sentence) ||
      PERSONAL_MARKERS.some((m) => flat.includes(' ' + m + ' '))
    let genericPart = 0
    if (words >= 14 && !hasDetail) {
      genericPart = 25
      flags.push('escritura genérica: sin datos concretos, nombres propios ni voz personal')
    }

    // comienzo idéntico al de la oración anterior
    const first = norm(sentence).split(' ')[0] ?? ''
    const sameStart = prevTokens.length > 0 && first === prevFirst ? 100 : 0
    if (sameStart) flags.push('comienza con la misma palabra que la oración anterior')

    // longitud casi idéntica a la anterior (ritmo plano)
    let lenUniform = 0
    if (prevTokens.length > 0) {
      const prevLen = prevTokens.length
      if (Math.abs(words - prevLen) / Math.max(words, prevLen) < 0.2) lenUniform = 100
    }
    if (lenUniform) flags.push('longitud casi idéntica a la oración anterior (ritmo plano)')

    // secuencias de 3 palabras ya escritas antes en el documento
    let repeated = 0
    let totalGrams = 0
    for (let i = 0; i + 3 <= tokens.length; i++) {
      const g = tokens.slice(i, i + 3).join(' ')
      totalGrams++
      if (seenGrams.has(g)) repeated++
      seenGrams.add(g)
    }
    const ngram = totalGrams >= 2 ? scale(repeated / totalGrams, 0.1, 0.6) : 0
    if (ngram > 50) flags.push('repite secuencias de 3 palabras ya usadas antes en el texto')

    const phrasePart = Math.min(60, hits.length * 40)
    const grandPart = Math.min(40, grand.length * 20)
    const score = clamp(
      0.15 * pred + phrasePart + grandPart + 0.15 * genericPart + 0.2 * sameStart + 0.15 * lenUniform + 0.25 * ngram
    )

    results.push({
      index: results.length + 1,
      text: sentence,
      words,
      score: Math.round(score),
      label: labelFor(score),
      flags,
    })
    prevTokens = tokens
    prevFirst = first
  }
  return results
}

export interface DetailedAnalysis {
  report: AIDetectionReport
  sentences: SentenceResult[]
}

/**
 * Análisis completo: informe global + análisis oración por oración.
 * El veredicto global sale de las señales del documento completo (calibrado);
 * las oraciones aportan el detalle línea a línea que sustenta el informe.
 */
export function analyzeDetailed(raw: string): DetailedAnalysis {
  const sentences = analyzeSentences(raw)
  const report = analyzeText(raw)
  return { report, sentences }
}

export const LABEL_TEXT: Record<RiskLabel, string> = {
  humano: 'Probablemente humano',
  incierto: 'Resultado incierto',
  ia: 'Probablemente generado por IA',
}

export const LABEL_COLORS: Record<RiskLabel, string> = {
  humano: 'text-green-600',
  incierto: 'text-amber-600',
  ia: 'text-red-600',
}

export const LABEL_BAR: Record<RiskLabel, string> = {
  humano: 'bg-green-500',
  incierto: 'bg-amber-500',
  ia: 'bg-red-500',
}

export const LABEL_BADGE: Record<RiskLabel, string> = {
  humano: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300',
  incierto: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  ia: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
}

/* ─────────── criterio universitario configurable ─────────── */

/** máximo de IA aceptado por la universidad (%) */
export const UNI_AI_MAX = 15

/** máximo de plagio aceptado por la universidad (%) */
export const UNI_PLAGIO_MAX = 20

/** color del veredicto según el umbral universitario */
export const uniAIColor = (score: number): string =>
  score <= UNI_AI_MAX ? 'text-green-600' : 'text-red-600'

export const uniAIBadge = (score: number): string =>
  score <= UNI_AI_MAX
    ? LABEL_BADGE.humano
    : LABEL_BADGE.ia

export const uniAIText = (score: number): string =>
  score <= UNI_AI_MAX
    ? `≤${UNI_AI_MAX}% · dentro del criterio universitario`
    : `>${UNI_AI_MAX}% · supera el criterio universitario`
