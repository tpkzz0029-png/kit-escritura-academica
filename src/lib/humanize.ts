// Humanizador de texto: reduce los patrones que dispara el detector de IA
// mediante sustituciones de frases de molde, sinónimos menos predecibles,
// variación deliberada del ritmo (dividir/unir oraciones) y diversificación
// del vocabulario de contenido repetido.

import { WORD_SYNONYMS } from './synonyms.ts'

export interface HumanizeOptions {
  /** variar el ritmo dividiendo oraciones muy largas */
  varyRhythm: boolean
  /** si se da, solo se reescriben estas oraciones (índices 1-based del análisis) */
  onlySentences?: Set<number>
  /** dividir oraciones a partir de esta longitud (palabras) */
  longSentenceWords?: number
  /**
   * arreglos dirigidos por señal del detector (para el cuadro de opciones de
   * acomodo). Si se omite, se aplican todos.
   */
  fix?: Partial<Record<'metaphors' | 'phrases' | 'connectors' | 'repetition', boolean>>
}

/** conjunto de arreglos activos: undefined = todos (comportamiento clásico) */
type FixSet = HumanizeOptions['fix']

const PHRASE_MAP: Array<[string, string]> = [
  // español
  ['es importante destacar', 'conviene tener en cuenta'],
  ['es importante senalar', 'conviene aclarar'],
  ['cabe destacar', 'vale mencionar'],
  ['cabe senalar', 'conviene aclarar'],
  ['vale la pena destacar', 'merece mencionarse'],
  ['en conclusion', 'resumiendo'],
  ['en resumen', 'resumiendo'],
  ['para resumir', 'resumiendo'],
  ['en definitiva', 'al final'],
  ['en el ambito de', 'en el campo de'],
  ['en la actualidad', 'hoy en dia'],
  ['en el mundo actual', 'hoy'],
  ['en la era digital', 'hoy'],
  ['juega un papel fundamental', 'resulta clave'],
  ['juega un papel crucial', 'resulta decisivo'],
  ['desempena un papel', 'cumple una funcion'],
  ['es fundamental comprender', 'conviene entender'],
  ['es esencial comprender', 'conviene entender'],
  ['es crucial comprender', 'conviene entender'],
  ['por lo tanto', 'asi que'],
  ['en consecuencia', 'por eso'],
  ['como resultado', 'por eso'],
  ['sin embargo', 'aun asi'],
  ['no obstante', 'aun asi'],
  ['por otro lado', 'de otro lado'],
  ['asimismo', 'tambien'],
  ['ademas', 'tambien'],
  ['a lo largo de la historia', 'desde siempre'],
  ['en constante evolucion', 'cambiando sin parar'],
  ['amplia gama de', 'gran variedad de'],
  ['es fundamental', 'es clave'],
  ['es crucial', 'es clave'],
  ['es esencial', 'es necesario'],
  ['revoluciona', 'cambia por completo'],
  ['solucion robusta', 'respuesta solida'],
  ['ultimamente', 'en los ultimos tiempos'],
  // inglés
  ['it is important to note', 'worth noting'],
  ['it is worth noting', 'worth remembering'],
  ['it is essential', 'it is necessary'],
  ['it is crucial', 'it is key'],
  ['in conclusion', 'to wrap up'],
  ['in summary', 'to sum up'],
  ['to summarize', 'to sum up'],
  ['to sum up', 'all in all'],
  ['furthermore', 'also'],
  ['moreover', 'besides'],
  ['additionally', 'also'],
  ['consequently', 'so'],
  ['as a result', 'because of that'],
  ['in the realm of', 'in the field of'],
  ['in today fast-paced', 'today'],
  ['in the digital age', 'today'],
  ['plays a crucial role', 'is central'],
  ['plays a vital role', 'is key'],
  ['plays an important role', 'matters'],
  ['plays a significant role', 'matters'],
  ['delve into', 'dig into'],
  ['delving into', 'digging into'],
  ['ever-evolving', 'always changing'],
  ['ever-changing', 'always shifting'],
  ['crucial to understand', 'key to grasp'],
  ['essential to understand', 'necessary to grasp'],
  ['a wide range of', 'many'],
  ['a variety of', 'several'],
  ['it goes without saying', 'obviously'],
  ['needless to say', 'obviously'],
  ['last but not least', 'finally'],
  ['first and foremost', 'first'],
  ['on the other hand', 'then again'],
  ['in addition to', 'along with'],
  ['revolutionize', 'transform'],
  ['revolutionary', 'groundbreaking'],
  ['cutting-edge', 'advanced'],
  ['game-changer', 'big shift'],
  ['unlock the potential', 'tap into'],
  ['seamless', 'smooth'],
]

/** sinónimos cíclicos: cada aparición usa la siguiente variante */
const SYNONYM_MAP: Array<[string, string[]]> = [
  ['importante', ['relevante', 'de peso']],
  ['fundamental', ['clave', 'central']],
  ['adicional', ['extra', 'mas']],
  ['numerosos', ['muchos', 'un buen numero de']],
  ['considerable', ['notable', 'apreciable']],
  ['eficiente', ['eficaz', 'rendidor']],
  ['destacar', ['remarcar', 'subrayar']],
  ['important', ['key', 'major']],
  ['significant', ['notable', 'sizeable']],
  ['additionally', ['also', 'on top of that']],
  ['efficient', ['effective', 'lean']],
  ['crucial', ['key', 'pivotal']],
  ['manera', ['forma', 'modo']],
  ['resultados', ['hallazgos', 'los datos obtenidos']],
  ['muestran', ['evidencian', 'revelan']],
  ['proceso', ['desarrollo', 'curso']],
  ['sistema', ['mecanismo', 'estructura']],
  ['sociedad', ['comunidad', 'colectividad']],
  ['actualidad', ['el presente', 'hoy en dia']],
  ['historia', ['recorrido', 'trayectoria']],
  ['futuro', ['porvenir', 'lo que viene']],
  ['cambio', ['transformacion', 'modificacion']],
  ['impacto', ['efecto', 'influencia']],
  ['problema', ['dificultad', 'reto']],
  ['beneficio', ['ventaja', 'provecho']],
  ['permite', ['posibilita', 'facilita']],
  ['aumenta', ['incrementa', 'eleva']],
  ['reduce', ['disminuye', 'recorta']],
  ['desarrollo', ['evolucion', 'avance']],
  ['incluye', ['contempla', 'abarca']],
  ['demuestra', ['evidencia', 'prueba']],
  ['necesario', ['imprescindible', 'requerido']],
  ['revolucionando', ['cambiando por completo', 'transformando']],
  ['revoluciona', ['cambia por completo', 'transforma']],
  ['demonstrates', ['shows', 'proves']],
  ['allows', ['enables', 'permits']],
  ['improves', ['enhances', 'boosts']],
  ['includes', ['comprises', 'covers']],
  ['shows', ['reveals', 'indicates']],
  ['development', ['evolution', 'growth']],
  ['society', ['community', 'the public']],
  ['change', ['shift', 'transformation']],
  ['impact', ['effect', 'influence']],
  ['benefits', ['advantages', 'gains']],
  ['problem', ['issue', 'challenge']],
]

const CONNECTOR_SPLIT = /,\s+(y|e|pero|aunque|porque|mientras|so|and|but|although|because|while)\s+/i

/* lenguaje grandilocuente → equivalentes sobrios (bajan la señal de
   metáforas del detector de IA). Los reemplazos son de género neutro
   (enorme, grande, constante…) para no romper la concordancia. */
const GRAND_MAP: Array<[string, string]> = [
  ['archivo vivo', 'registro abierto'],
  ['biografia secreta', 'historia'],
  ['profundidad del tiempo', 'escala del tiempo'],
  ['reloj cosmico', 'reloj universal'],
  ['memoria de eventos', 'registro de eventos'],
  ['colosal', 'enorme'],
  ['imponente', 'grande'],
  ['imponentes', 'grandes'],
  ['implacable', 'constante'],
  ['cosmico', 'universal'],
  ['cosmica', 'universal'],
  ['gigantesca', 'enorme'],
  ['gigantescas', 'enormes'],
  ['gigantesco', 'enorme'],
  ['gigantescos', 'enormes'],
  ['sublime', 'notable'],
  ['trascendental', 'relevante'],
  ['inmenso', 'enorme'],
  ['inmensa', 'enorme'],
  ['inmensos', 'enormes'],
  ['inmensas', 'enormes'],
  ['vasto', 'amplio'],
  ['vasta', 'amplia'],
  ['vastos', 'amplios'],
  ['vastas', 'amplias'],
  ['majestuoso', 'sobrio'],
  ['majestuosa', 'sobria'],
  ['legendario', 'conocido'],
  ['legendaria', 'conocida'],
  ['prodigioso', 'notable'],
  ['prodigiosa', 'notable'],
  ['portentoso', 'asombroso'],
  ['portentosa', 'asombrosa'],
  ['etereo', 'delicado'],
  ['eterea', 'delicada'],
  ['imparable', 'incessante'],
  ['incansable', 'persistente'],
  ['inquebrantable', 'firme'],
  ['imperecedero', 'duradero'],
  ['imperecedera', 'duradera'],
  ['sinfonia', 'combinacion'],
  ['mosaico', 'conjunto'],
  ['tapiz', 'conjunto'],
  ['danza de', 'alternancia de'],
  ['latir', 'moverse'],
  ['latido', 'pulso'],
  ['respirar', 'alimentarse'],
  ['pulsar', 'moverse'],
  ['danzar', 'alternarse'],
]

const ACCENTS: Record<string, string> = {
  a: 'aáàäâãå',
  e: 'eéèëê',
  i: 'iíìïî',
  o: 'oóòöôõ',
  u: 'uúùüû',
  n: 'nñ',
}

/** construye una regex que casa la frase ignorando mayúsculas y tildes */
function flexibleRegex(phrase: string): RegExp {
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  let out = ''
  for (const ch of escaped) {
    const cls = ACCENTS[ch]
    out += cls ? `[${cls}]` : ch === ' ' ? '\\s+' : ch
  }
  return new RegExp(`(?<![a-zñü])${out}(?![a-zñü])`, 'gi')
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function splitSentencesKeep(text: string): string[] {
  return text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?…])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

/* ajuste de concordancia: las sustituciones por sinónimos pueden cambiar el
   género de la palabra ("la historia" → "el recorrido"). Se corrige el
   determinante inmediato con una heurística de género por terminación. */
const EL_FEM_EXCEPTIONS = new Set(
  'agua aguas area areas hacha ala ave aguila arma arpa hada aula alfa isla aspa mano manos radio radios foto fotos moto motos soprano dinamo suma'.split(
    ' '
  )
)
/* masculinos terminados en -a (incluidos los de origen griego en -ma) */
const MASC_IN_A = new Set(
  'dia mapa sofa sabado pijama planeta cometa problema sistemas sistema tema temas clima poema poemas idioma drama programa programas esquema fantasma plasma axioma teorema lema emblema prisma dilema diploma aroma'.split(
    ' '
  )
)

function guessGender(w: string): 'm' | 'f' | null {
  const lw = w
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
  if (EL_FEM_EXCEPTIONS.has(lw)) return 'f'
  if (MASC_IN_A.has(lw)) return 'm'
  if (/a$/.test(lw)) return 'f'
  if (/(o|or|aje|go|so|cho)$/.test(lw)) return 'm'
  if (/(ion|sis|dad|tad|tud|umbre|ie|ez|ina)$/.test(lw)) return 'f'
  return null
}

const DET_FEM_TO_MASC: Record<string, string> = {
  la: 'el', una: 'un', esta: 'este', esa: 'ese', aquella: 'aquel',
  otra: 'otro', misma: 'mismo', nuestra: 'nuestro', vuestra: 'vuestro',
  alguna: 'algún', ninguna: 'ningún',
}
const DET_MASC_TO_FEM: Record<string, string> = {
  el: 'la', un: 'una', este: 'esta', ese: 'esa', aquel: 'aquella',
  otro: 'otra', mismo: 'misma', nuestro: 'nuestra', vuestro: 'vuestra',
  'algún': 'alguna', 'ningún': 'ninguna', del: 'de la', al: 'a la',
}

function fixDeterminers(s: string): string {
  const keepCase = (orig: string, rep: string) =>
    /^[A-ZÁÉÍÓÚÑ]/.test(orig) ? rep.charAt(0).toUpperCase() + rep.slice(1) : rep
  let out = s.replace(
    /\b(la|el|una|un|esta|este|esa|ese|aquella|aquel|otra|otro|misma|mismo|nuestra|nuestro|vuestra|vuestro|alguna|algún|ninguna|ningún|del|al)\s+([a-záéíóúñü]{3,})\b/gi,
    (whole, det: string, noun: string) => {
      const nw = noun.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      // femeninos que se construyen con "el/del" (agua, arma…): no tocar
      if (EL_FEM_EXCEPTIONS.has(nw)) return whole
      const g = guessGender(noun)
      if (!g) return whole
      const d = det.toLowerCase()
      if (g === 'm' && DET_FEM_TO_MASC[d]) return `${keepCase(det, DET_FEM_TO_MASC[d])} ${noun}`
      if (g === 'f' && DET_MASC_TO_FEM[d]) return `${keepCase(det, DET_MASC_TO_FEM[d])} ${noun}`
      return whole
    }
  )
  // adjetivo posterior: si el sustantivo quedó femenino, el adjetivo que lo
  // sigue debe pasar a -a ("la evolución humano" → "la evolución humana")
  out = out.replace(
    /\b(la|una|esta|esa|aquella|otra|misma|nuestra|vuestra|alguna|ninguna)\s+([a-záéíóúñü]{3,})\s+([a-záéíóúñü]{2,}o)\b/gi,
    (whole, det: string, noun: string, adj: string) => {
      if (guessGender(noun) !== 'f') return whole
      const lw = adj.toLowerCase()
      if (lw === 'homo' || lw === 'tubo' || lw === 'euro') return whole
      return `${det} ${noun} ${adj.slice(0, -1)}a`
    }
  )
  return out
}

function rewriteSentence(sentence: string, counters: Map<string, number>, fix?: FixSet): string {
  let out = sentence
  const on = (k: 'metaphors' | 'phrases' | 'connectors' | 'repetition') => !fix || fix[k] === true

  // 1. frases de molde → alternativas más naturales
  if (on('phrases')) {
    for (const [from, to] of PHRASE_MAP) {
      const re = flexibleRegex(from)
      out = out.replace(re, (match) => {
        const replacement = /^[A-ZÁÉÍÓÚÑ]/.test(match) ? capitalize(to) : to
        return replacement
      })
    }
  }

  // 1b. lenguaje grandilocuente → equivalentes sobrios (baja la señal de
  //     metáforas del detector; se respeta mayúscula y plural)
  if (on('metaphors')) {
    for (const [from, to] of GRAND_MAP) {
      const re = flexibleRegex(from)
      out = out.replace(re, (match) => {
        let replacement = to
        if (/s$/i.test(match) && !/s$/i.test(replacement)) replacement += 's'
        return /^[A-ZÁÉÍÓÚÑ]/.test(match) ? capitalize(replacement) : replacement
      })
    }
  }

  // 2. sinónimos cíclicos para romper la predecibilidad
  if (on('connectors')) {
    for (const [from, variants] of SYNONYM_MAP) {
      const re = flexibleRegex(from)
      out = out.replace(re, (match) => {
        const i = counters.get(from) ?? 0
        counters.set(from, i + 1)
        const v = variants[i % variants.length]
        return /^[A-ZÁÉÍÓÚÑ]/.test(match) ? capitalize(v) : v
      })
    }
  }

  // 2b. diversificar el vocabulario de contenido repetido (baja la señal de
  //     repetición de vocabulario del detector): la primera aparición se
  //     conserva; desde la segunda se usa una variante del diccionario.
  //     Solo variantes de una sola palabra para no romper la concordancia.
  if (on('repetition')) {
    out = out.replace(/[a-záéíóúñü]+/gi, (match) => {
      const key = match
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
      const variants = WORD_SYNONYMS[key]?.filter((v) => !v.includes(' '))
      if (!variants || variants.length === 0) return match
      const i = counters.get('w:' + key) ?? 0
      counters.set('w:' + key, i + 1)
      if (i === 0) return match
      const v = variants[(i - 1) % variants.length]
      return /^[A-ZÁÉÍÓÚÑ]/.test(match) ? capitalize(v) : v
    })
  }

  // 3. reparar la concordancia de género que puedan haber roto las
  //    sustituciones ("la historia" → "el recorrido")
  out = fixDeterminers(out)

  return out
}

export function humanizeText(text: string, opts: HumanizeOptions): string {
  const sentences = splitSentencesKeep(text)
  const longAt = opts.longSentenceWords ?? 26
  const counters = new Map<string, number>()
  const out: string[] = []
  const looksEnglish = /\b(the|and|of|to)\b/i.test(text.slice(0, 200))
  const joiner = looksEnglish ? ', and ' : ', y '

  let i = 0
  while (i < sentences.length) {
    const target = !opts.onlySentences || opts.onlySentences.has(i + 1)
    let rewritten = target ? rewriteSentence(sentences[i], counters, opts.fix) : sentences[i]
    const wc = rewritten.split(/\s+/).length
    const isLast = i === sentences.length - 1

    if (opts.varyRhythm && !isLast) {
      const nextIsTarget = !opts.onlySentences || opts.onlySentences.has(i + 2)
      const nextRaw = sentences[i + 1]
      const nwc = nextRaw.split(/\s+/).length
      const hasQuestion = /[?!…]/.test(rewritten) || /[?!…]/.test(nextRaw)
      const similar =
        wc >= 6 && nwc >= 6 ? Math.abs(wc - nwc) / Math.max(wc, nwc) : 1

      // 3a. unir dos oraciones cortas y parecidas → rompe la monotonía y
      //     aleja la longitud media del rango "de plantilla" (12–22 palabras)
      if (
        !hasQuestion &&
        wc >= 6 && wc <= 18 &&
        nwc >= 6 && nwc <= 24 &&
        similar <= 0.4
      ) {
        const nextRew = nextIsTarget ? rewriteSentence(nextRaw, counters, opts.fix) : nextRaw
        const body = rewritten.replace(/[.!?…]+\s*$/, '')
        const nextBody = nextRew.charAt(0).toLowerCase() + nextRew.slice(1).replace(/[.!?…]+\s*$/, '')
        out.push(`${body}${joiner}${nextBody}.`)
        i += 2
        continue
      }

      // 3b. dividir oraciones largas en el conector; también cuando dos
      //     oraciones largas seguidas son casi idénticas en longitud (ritmo
      //     de plantilla aunque no superen el umbral general)
      const uniformPair = wc >= 14 && nwc >= 14 && similar <= 0.15
      if ((wc > longAt || (uniformPair && wc > 18)) && CONNECTOR_SPLIT.test(rewritten)) {
        rewritten = rewritten.replace(CONNECTOR_SPLIT, (m) => {
          const cleaned = m.replace(/^,\s+/, '').trim()
          return `. ${capitalize(cleaned)}`
        })
      }
    }
    out.push(rewritten)
    i++
  }

  return out.join(' ')
}
