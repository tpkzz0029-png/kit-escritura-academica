/* Motor de la «Descripción de rocas»: interpreta las respuestas de la persona
   y los porcentajes de minerales, propone el nombre más cercano con los mismos
   criterios de los diagramas (QAPF, QFL, Wentworth, foliación/grado) y redacta
   una descripción técnica en prosa, con variaciones de redacción. */

import { qapfName, qflName, VOLCANIC_EQ } from '@/lib/clasificacion'
import { AMBIENTE_GENERICO, GUIA, type FichaRoca } from '@/lib/guiaRocas'

export type Tipo = 'ignea' | 'sedimentaria' | 'metamorfica'
export type Respuestas = Record<string, string>
export type Minerales = Record<string, number>

export type MineralDef = { id: string; label: string; nombre: string }

export const MINERALES: Record<Tipo, MineralDef[]> = {
  ignea: [
    { id: 'q', label: 'Cuarzo (Q)', nombre: 'cuarzo' },
    { id: 'a', label: 'Feldespato alcalino (A)', nombre: 'feldespato alcalino' },
    { id: 'p', label: 'Plagioclasa (P)', nombre: 'plagioclasa' },
    { id: 'f', label: 'Feldespatoides (F)', nombre: 'feldespatoides' },
    { id: 'ol', label: 'Olivino', nombre: 'olivino' },
    { id: 'px', label: 'Piroxeno', nombre: 'piroxeno' },
    { id: 'anf', label: 'Anfíbol', nombre: 'anfíbol' },
    { id: 'bt', label: 'Biotita', nombre: 'biotita' },
    { id: 'ms', label: 'Moscovita', nombre: 'moscovita' },
    { id: 'op', label: 'Opacos / otros', nombre: 'minerales opacos y accesorios' },
  ],
  sedimentaria: [
    { id: 'q', label: 'Cuarzo', nombre: 'cuarzo' },
    { id: 'f', label: 'Feldespato', nombre: 'feldespato' },
    { id: 'l', label: 'Fragmentos líticos', nombre: 'fragmentos líticos' },
    { id: 'mat', label: 'Matriz (limo/arcilla)', nombre: 'matriz limo-arcillosa' },
    { id: 'cb', label: 'Calcita / carbonatos', nombre: 'carbonato cálcico' },
    { id: 'fos', label: 'Bioclastos / fósiles', nombre: 'bioclastos' },
    { id: 'ot', label: 'Otros', nombre: 'otros componentes' },
  ],
  metamorfica: [
    { id: 'q', label: 'Cuarzo', nombre: 'cuarzo' },
    { id: 'fd', label: 'Feldespatos', nombre: 'feldespatos' },
    { id: 'ms', label: 'Moscovita / sericita', nombre: 'moscovita' },
    { id: 'bt', label: 'Biotita', nombre: 'biotita' },
    { id: 'chl', label: 'Clorita', nombre: 'clorita' },
    { id: 'grt', label: 'Granate', nombre: 'granate' },
    { id: 'als', label: 'Andalucita / cianita / silimanita', nombre: 'aluminosilicatos' },
    { id: 'cal', label: 'Calcita / dolomita', nombre: 'calcita' },
    { id: 'anf', label: 'Anfíbol', nombre: 'anfíbol' },
    { id: 'px', label: 'Piroxeno', nombre: 'piroxeno' },
  ],
}

export type Resultado = {
  nombre: string
  ficha?: FichaRoca
  grupo: 'plutonica' | 'volcanica' | 'sedimentaria' | 'metamorfica'
  /** Criterios usados, en lenguaje técnico (se muestran como etiquetas y se redactan) */
  criterios: string[]
  confianza: 'alta' | 'media' | 'baja'
  avisos: string[]
}

/* ─────────────────────────── utilidades ─────────────────────────── */

const norm = (t = '') => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const has = (t: string, ...k: string[]) => {
  const n = norm(t)
  return k.some((x) => n.includes(x))
}
const limpiar = (v = '') => v.trim().replace(/\s+/g, ' ').replace(/[.;,\s]+$/, '')
const mayus = (t: string) => (t ? t.charAt(0).toUpperCase() + t.slice(1) : t)
const negativo = (t = '') => /^(no|ninguno|ninguna|nada|sin|ausente|no tiene|no se observa)/.test(norm(limpiar(t)))
const n0 = (x?: number) => (Number.isFinite(x) ? (x as number) : 0)
const r0 = (x: number) => Math.round(x)

/** Tamaño en mm a partir de textos como «2 a 5 mm», «1 cm», «1/16 mm», «60 µm» */
export function tamanoMm(t = ''): { min: number; max: number } | null {
  const s = norm(t).replace(/,/g, '.')
  const nums: number[] = []
  const re = /(\d+(?:\.\d+)?)(?:\s*\/\s*(\d+(?:\.\d+)?))?/g
  let m: RegExpExecArray | null
  while ((m = re.exec(s))) nums.push(m[2] ? Number(m[1]) / Number(m[2]) : Number(m[1]))
  if (!nums.length) return null
  let f = 1
  if (/\bcm\b|centimetr/.test(s)) f = 10
  else if (/µm|μm|\bum\b|micra|micro?n/.test(s)) f = 0.001
  else if (/\bm\b|metro/.test(s) && !/mm/.test(s)) f = 1000
  const v = nums.map((x) => x * f)
  return { min: Math.min(...v), max: Math.max(...v) }
}

const fmtMm = (x: number) => (x >= 1 ? `${+x.toFixed(1)}`.replace('.', ',') : `${+x.toFixed(3)}`.replace('.', ','))

/** «a (40 %), b (30 %) y c (5 %)» ordenado de mayor a menor */
function listaMinerales(tipo: Tipo, m: Minerales): string {
  const items = MINERALES[tipo]
    .map((d) => ({ n: d.nombre, v: n0(m[d.id]) }))
    .filter((x) => x.v > 0)
    .sort((a, b) => b.v - a.v)
    .map((x) => `${x.n} (${r0(x.v)} %)`)
  if (items.length <= 1) return items.join('')
  return `${items.slice(0, -1).join(', ')} y ${items[items.length - 1]}`
}

const suma = (m: Minerales) => Object.values(m).reduce((a, b) => a + n0(b), 0)

/* Generador pseudoaleatorio con semilla, para variar la redacción de forma reproducible */
function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
type Pick = <T>(arr: T[]) => T

/* ─────────────────────────── términos técnicos ─────────────────────────── */

function indiceColor(M: number | null, texto: string): string | null {
  if (M !== null) {
    if (M < 10) return 'hololeucocrática'
    if (M < 35) return 'leucocrática'
    if (M < 65) return 'mesocrática'
    if (M < 90) return 'melanocrática'
    return 'holomelanocrática (ultramáfica)'
  }
  if (has(texto, 'hololeuc')) return 'hololeucocrática'
  if (has(texto, 'leuco', 'clar', 'felsic', 'blanc')) return 'leucocrática'
  if (has(texto, 'meso', 'medi', 'intermed', 'gris')) return 'mesocrática'
  if (has(texto, 'ultramaf', 'holomel')) return 'holomelanocrática (ultramáfica)'
  if (has(texto, 'melano', 'oscur', 'mafic', 'negr')) return 'melanocrática'
  return null
}

function cristalinidad(t: string): string | null {
  if (!limpiar(t)) return null
  if (has(t, 'holohial', 'vitre', 'vidrio', 'hialin')) return 'holohialina'
  if (has(t, 'hipocrist', 'hipohial', 'parte vidrio', 'mixta')) return 'hipocristalina'
  if (has(t, 'holocrist', 'cristal')) return 'holocristalina'
  return null
}

function granoIgneo(s: { min: number; max: number } | null, t: string): { termino: string; faneritica: boolean | null } {
  const rango = s ? (s.min === s.max ? `${fmtMm(s.max)} mm` : `${fmtMm(s.min)}–${fmtMm(s.max)} mm`) : ''
  if (has(t, 'no se ve', 'no se aprecian', 'no se distinguen', 'lupa', 'microscop', 'afanit')) {
    return { termino: `afanítica, con cristales no distinguibles a simple vista${rango ? ` (≈ ${rango})` : ''}`, faneritica: false }
  }
  if (!s) {
    if (has(t, 'muy grues', 'pegmat')) return { termino: 'fanerítica de grano muy grueso', faneritica: true }
    if (has(t, 'grues')) return { termino: 'fanerítica de grano grueso', faneritica: true }
    if (has(t, 'medi')) return { termino: 'fanerítica de grano medio', faneritica: true }
    if (has(t, 'fin')) return { termino: 'de grano fino', faneritica: null }
    return { termino: limpiar(t), faneritica: null }
  }
  const x = s.max
  if (x < 1) return { termino: `afanítica, con cristales menores de 1 mm (${rango})`, faneritica: false }
  if (x < 2) return { termino: `fanerítica de grano fino (${rango})`, faneritica: true }
  if (x <= 5) return { termino: `fanerítica de grano medio (${rango})`, faneritica: true }
  if (x <= 30) return { termino: `fanerítica de grano grueso (${rango})`, faneritica: true }
  return { termino: `fanerítica de grano muy grueso, pegmatítica (${rango})`, faneritica: true }
}

function formaCristales(t: string): string | null {
  const v = limpiar(t)
  if (!v) return null
  if (has(v, 'euhedr', 'idiomorf', 'bien formad', 'caras complet')) return 'predominantemente euhedrales (idiomorfos), con caras cristalinas bien desarrolladas'
  if (has(v, 'subhedr', 'subidiom', 'algunas caras')) return 'mayoritariamente subhedrales (subidiomorfos)'
  if (has(v, 'anhedr', 'alotriom', 'irregular', 'sin caras')) return 'anhedrales (alotriomorfos), sin caras cristalinas definidas'
  return v
}

function distribucion(t: string): string | null {
  const v = limpiar(t)
  if (!v) return null
  if (has(v, 'porfid', 'porfir', 'fenocrist')) return `porfídica: ${v.replace(/^porf[ií]dica[,:]?\s*/i, '') || 'fenocristales englobados en una matriz de grano más fino'}`
  if (has(v, 'inequigran', 'seriad', 'distint')) return 'inequigranular'
  if (has(v, 'equigran', 'similar', 'igual')) return 'equigranular'
  return v
}

function wentworth(mm: number): string {
  if (mm > 256) return 'bloques'
  if (mm > 64) return 'cantos'
  if (mm > 4) return 'guijarros'
  if (mm > 2) return 'gránulos'
  if (mm > 1) return 'arena muy gruesa'
  if (mm > 0.5) return 'arena gruesa'
  if (mm > 0.25) return 'arena media'
  if (mm > 0.125) return 'arena fina'
  if (mm > 0.0625) return 'arena muy fina'
  if (mm > 0.0039) return 'limo'
  return 'arcilla'
}

function redondez(t: string): string | null {
  const v = limpiar(t)
  if (!v) return null
  if (has(v, 'muy angul')) return 'muy angulosos'
  if (has(v, 'subangul')) return 'subangulosos'
  if (has(v, 'angul')) return 'angulosos'
  if (has(v, 'bien redond', 'muy redond')) return 'bien redondeados'
  if (has(v, 'subredond')) return 'subredondeados'
  if (has(v, 'redond')) return 'redondeados'
  return v
}

function seleccion(t: string): string | null {
  const v = limpiar(t)
  if (!v) return null
  if (has(v, 'muy bien')) return 'muy bien seleccionada'
  if (has(v, 'bien')) return 'bien seleccionada'
  if (has(v, 'moder', 'regular', 'media')) return 'moderadamente seleccionada'
  if (has(v, 'muy mal')) return 'muy mal seleccionada'
  if (has(v, 'mal', 'pobre', 'poco')) return 'mal seleccionada'
  return v
}

/* ─────────────────────────── clasificación ─────────────────────────── */

/** Nombre en minúscula dentro de una frase, respetando siglas y nombres propios */
const nombreEnTexto = (n: string) => n.charAt(0).toLowerCase() + n.slice(1)
const femenino = (nombre: string) => /a$|ita$/.test(norm(nombre.split(/[\s/]/)[0]))
const conPorfidica = (nombre: string) => `${nombre} ${femenino(nombre) ? 'porfídica' : 'porfídico'}`

function fichaIgnea(nombre: string, r: Respuestas): FichaRoca | undefined {
  const n = norm(nombre)
  if (n.startsWith('porfido')) return GUIA.porfido
  if (n.includes('feldespato alcalino') && n.includes('granito')) return GUIA['granito-alcalino']
  if (/granito|sienogranito|monzogranito|granitoide/.test(n)) return GUIA.granito
  if (/granodiorita|tonalita/.test(n)) return GUIA.granodiorita
  if (/sienita|monzonita/.test(n)) return GUIA.sienita
  if (n.includes('anortosita')) return GUIA.anortosita
  if (n.includes('gabro')) return GUIA.gabro
  if (n.includes('diorita')) return GUIA.diorita
  if (/peridotita|dunita|piroxenita|hornblendita|harzburgita|lherzolita|wehrlita|komatiita/.test(n)) return GUIA.peridotita
  if (/riolita|dacita/.test(n)) return GUIA.riolita
  if (n.includes('basalto')) return has(r.estructuras ?? '', 'cordad') ? GUIA['lava-cordada'] : GUIA.basalto
  if (n.includes('andesita')) return GUIA.andesita
  if (n.includes('obsidiana')) return GUIA.obsidiana
  if (n.includes('pumicita') || n.includes('pomez')) return GUIA.pumicita
  if (/piroclast|ceniza|lapilli|bomba|toba/.test(n)) return GUIA.piroclastos
  return undefined
}

function clasificarIgnea(r: Respuestas, m: Minerales): Resultado {
  const criterios: string[] = []
  const avisos: string[] = []
  const todo = Object.values(r).join(' ')
  const size = tamanoMm(r.tamano)
  const grano = granoIgneo(size, r.tamano ?? '')
  const crist = cristalinidad(r.cristalinidad ?? '')
  const vesicular = has(`${r.estructuras ?? ''} ${r.distribucion ?? ''}`, 'vesic', 'espum', 'poros', 'huec', 'burbuj')
  const porfidica = has(r.distribucion ?? '', 'porfid', 'porfir', 'fenocrist')
  const pirocl = has(`${r.estructuras ?? ''} ${r.cristalinidad ?? ''}`, 'piroclast', 'ceniza', 'lapilli', 'fragmentos volcan', 'tefra')

  const Q = n0(m.q), A = n0(m.a), P = n0(m.p), F = n0(m.f)
  const M = n0(m.ol) + n0(m.px) + n0(m.anf) + n0(m.bt)
  const total = suma(m)
  const Mpct = total > 0 ? (M / total) * 100 : null
  const volcanica = grano.faneritica === false || crist === 'hipocristalina'
  const grupo: Resultado['grupo'] = volcanica ? 'volcanica' : 'plutonica'

  if (crist) criterios.push(`Cristalinidad ${crist}`)
  if (grano.faneritica !== null) criterios.push(grano.faneritica ? 'Textura fanerítica → roca plutónica' : 'Textura afanítica → roca volcánica')

  // 1. Piroclastos y rocas vítreas
  if (pirocl) {
    const t = size ? (size.max < 2 ? 'ceniza' : size.max <= 64 ? 'lapilli' : 'bombas o bloques') : null
    if (t) criterios.push(`Fragmentos de tamaño ${t}`)
    const nombre = vesicular && has(r.color ?? '', 'clar', 'blanc', 'gris clar') ? 'Pumicita (pómez)' : `Piroclastos${t ? ` (${t})` : ''}`
    return { nombre, ficha: fichaIgnea(nombre, r), grupo: 'volcanica', criterios, confianza: 'media', avisos }
  }
  if (crist === 'holohialina') {
    const nombre = vesicular ? 'Pumicita (pómez)' : 'Obsidiana'
    criterios.push(vesicular ? 'Vidrio volcánico vesicular' : 'Vidrio volcánico compacto, sin vesículas')
    return { nombre, ficha: fichaIgnea(nombre, r), grupo: 'volcanica', criterios, confianza: 'alta', avisos }
  }

  // 2. Ultramáficas (> 90 % de máficos)
  if (Mpct !== null && Mpct >= 90) {
    const ol = n0(m.ol), px = n0(m.px), anf = n0(m.anf)
    const fm = ol + px + anf || 1
    const olp = (ol / fm) * 100
    let nombre = olp >= 90 ? 'Dunita' : olp >= 40 ? 'Peridotita' : olp >= 10 ? 'Olivino-piroxenita' : 'Piroxenita'
    if (anf > px && anf > ol) nombre = 'Hornblendita'
    if (volcanica) nombre = 'Komatiita (lava ultramáfica)'
    criterios.push(`Máficos ${r0(Mpct)} % (> 90 %): el QAPF no aplica; triángulo Ol–Px con olivino ${r0(olp)} %`)
    return { nombre, ficha: fichaIgnea(nombre, r), grupo, criterios, confianza: 'alta', avisos }
  }

  // 3. QAPF
  const qapf = Q + A + P + F
  if (qapf > 0) {
    const usaF = F > 0
    const t = usaF ? A + P + F : Q + A + P
    const rq = r0(((usaF ? F : Q) / t) * 100), ra = r0((A / t) * 100), rp = r0((P / t) * 100)
    criterios.push(`QAPF recalculado al 100 %: ${usaF ? `F ${rq}` : `Q ${rq}`} · A ${ra} · P ${rp}`)
    if (Q > 0 && F > 0) avisos.push('El cuarzo y los feldespatoides no coexisten en equilibrio: revisa la identificación (se usó el triángulo con feldespatoides).')
    let nombre = qapfName(usaF ? 0 : Q, A, P, F)
    const pPlag = Q + A + P > 0 ? (P / (Q + A + P)) * 100 : 0
    if (pPlag >= 90 && (Mpct ?? 0) < 10 && !volcanica) {
      nombre = 'Anortosita'
      criterios.push('Plagioclasa > 90 % y máficos < 10 %')
    }
    const melano = (Mpct ?? 0) >= 35
    if (nombre.includes('Diorita / Gabro') || nombre.includes('Monzodiorita / Monzogabro')) {
      nombre = nombre
        .replace('Diorita / Gabro', melano ? 'Gabro' : 'Diorita')
        .replace('Monzodiorita / Monzogabro', melano ? 'Monzogabro' : 'Monzodiorita')
      if (Mpct !== null) criterios.push(`Índice de color ${r0(Mpct)} % → composición ${melano ? 'máfica (gabroica/basáltica)' : 'intermedia (diorítica/andesítica)'}`)
    }
    if (volcanica) {
      const base = qapfName(usaF ? 0 : Q, A, P, F)
      let v = VOLCANIC_EQ[base] ?? nombre
      if (v === 'Sin equivalente volcánico') v = 'Riolita (campo rico en cuarzo)'
      v = v.replace('Andesita / Basalto', melano ? 'Basalto' : 'Andesita')
      nombre = v
    }
    if (porfidica) {
      nombre = volcanica ? conPorfidica(nombre) : has(r.tamano ?? '', 'matriz') ? `Pórfido ${norm(nombre).includes('granit') ? 'granítico' : 'de composición ' + nombre.toLowerCase()}` : conPorfidica(nombre)
      criterios.push('Textura porfídica (fenocristales en matriz)')
    }
    const conf: Resultado['confianza'] = qapf >= 10 && grano.faneritica !== null ? 'alta' : 'media'
    if (Math.abs(total - 100) > 5 && total > 0) avisos.push(`Los porcentajes suman ${r0(total)} %: se recalcularon proporcionalmente.`)
    return { nombre, ficha: fichaIgnea(nombre, r), grupo, criterios, confianza: conf, avisos }
  }

  // 4. Sin porcentajes: estimación por índice de color y textura
  const ic = indiceColor(null, `${r.indice ?? ''} ${r.color ?? ''}`)
  avisos.push('Indica los porcentajes de minerales para clasificar con el diagrama QAPF.')
  if (!ic && grano.faneritica === null) {
    return { nombre: limpiar(r.nombre) || 'Roca ígnea (sin datos suficientes)', grupo, criterios, confianza: 'baja', avisos }
  }
  const claro = ic?.includes('leuco')
  const oscuro = ic?.includes('melano')
  let nombre = volcanica ? (claro ? 'Riolita' : oscuro ? 'Basalto' : 'Andesita') : claro ? 'Granito' : oscuro ? 'Gabro' : 'Diorita'
  if (porfidica) nombre = conPorfidica(nombre)
  if (ic) criterios.push(`Roca ${ic} (estimación por el color)`)
  if (todo && has(todo, 'cordad')) nombre = 'Basalto (lava cordada)'
  return { nombre, ficha: fichaIgnea(nombre, r), grupo, criterios, confianza: 'baja', avisos }
}

function clasificarSedimentaria(r: Respuestas, m: Minerales): Resultado {
  const criterios: string[] = []
  const avisos: string[] = []
  const todo = Object.values(r).join(' ')
  const hcl = r.hcl ?? ''
  const hclFuerte = has(hcl, 'fuert', 'vigoros', 'intens', 'abundant', 'si ', 'sí') && !has(hcl, 'debil', 'nula', 'no reac', 'polvo', 'leve')
  const hclDebil = has(hcl, 'debil', 'polvo', 'rasp', 'leve', 'poca')
  const cb = n0(m.cb) + n0(m.fos)
  const total = suma(m)
  const cbPct = total > 0 ? (cb / total) * 100 : 0
  const size = tamanoMm(r.tamano)
  const fosiles = limpiar(r.fosiles) && !negativo(r.fosiles)
  const base = (nombre: string, ficha?: FichaRoca, conf: Resultado['confianza'] = 'media'): Resultado => ({ nombre, ficha, grupo: 'sedimentaria', criterios, confianza: conf, avisos })

  // Químicas y orgánicas por palabras clave
  if (has(todo, 'yeso', 'selenita', 'alabastro', 'se raya con la una', 'raya con la una')) {
    criterios.push('Mineral blando que se raya con la uña (yeso)')
    return base('Roca de yeso', GUIA.yeso)
  }
  if (has(todo, 'halita', 'salad', 'roca de sal', 'silvita')) {
    criterios.push('Cloruros solubles de sabor salado')
    return base('Roca de sal', GUIA.sal)
  }
  if (/\bcarbon\b|lignito|turba|hulla|antracita/.test(norm(todo))) {
    criterios.push('Materia orgánica carbonosa')
    return base('Carbón', GUIA.carbon)
  }
  if (has(todo, 'bauxita', 'pisolit')) return base('Bauxita', GUIA.bauxita)
  if (has(todo, 'estalact', 'estalagm', 'espeleotem')) return base('Espeleotema', GUIA.espeleotema)
  if (has(todo, 'travertin', 'toba calc', 'moldes de hoja', 'moldes de tallo')) return base('Travertino / toba calcárea', GUIA.travertino)
  if (has(todo, 'silex', 'pedernal', 'chert', 'jaspe')) {
    criterios.push('Sílice microcristalina con fractura concoidea')
    return base('Chert (sílex)')
  }

  // Carbonatadas
  if (hclDebil && !hclFuerte && (cbPct >= 50 || has(todo, 'dolom'))) {
    criterios.push('Efervescencia débil con HCl (solo en polvo): dolomita')
    return base('Dolomía', GUIA.dolomia)
  }
  const fino = size ? size.max <= 0.0625 : has(r.tamano ?? '', 'fin', 'arcill', 'limo', 'micrit')
  if (cbPct >= 35 && cbPct < 65 && fino) {
    criterios.push(`Carbonato ${r0(cbPct)} % con fracción arcillosa (35–65 %)`)
    return base('Marga', GUIA.marga)
  }
  if (cbPct >= 50 || (hclFuerte && total === 0)) {
    if (cbPct) criterios.push(`Carbonato cálcico ${r0(cbPct)} % (> 50 %)`)
    if (hclFuerte) criterios.push('Efervescencia fuerte con HCl: calcita')
    const mat = r.matriz ?? ''
    let folk = ''
    if (has(mat, 'micrit', 'lodo', 'barro')) folk = fosiles ? 'biomicrita' : 'micrita'
    if (has(mat, 'esparit', 'cristalin', 'cemento calc')) folk = fosiles ? 'bioesparita' : 'esparita'
    if (folk) criterios.push(`Clasificación de Folk: ${folk}`)
    const nombre = fosiles ? 'Caliza fosilífera' : 'Caliza'
    return base(folk ? `${nombre} (${folk})` : nombre, fosiles ? GUIA['caliza-fosilifera'] : GUIA.caliza, cbPct ? 'alta' : 'media')
  }

  // Detríticas por tamaño de grano (Wentworth)
  let mm = size?.max ?? null
  if (mm === null) {
    const t = r.tamano ?? ''
    if (has(t, 'bloque', 'canto', 'guijarr', 'grava')) mm = 10
    else if (has(t, 'arena')) mm = has(t, 'grues') ? 0.75 : has(t, 'fin') ? 0.2 : 0.35
    else if (has(t, 'limo')) mm = 0.03
    else if (has(t, 'arcill')) mm = 0.002
  }
  if (mm === null) {
    avisos.push('Indica el tamaño de grano (en mm) para clasificar con la escala de Wentworth.')
    return base(limpiar(r.nombre) || 'Roca sedimentaria (sin datos suficientes)', undefined, 'baja')
  }
  const clase = wentworth(mm)
  criterios.push(`Escala de Wentworth: ${clase} (${fmtMm(mm)} mm)`)

  if (mm > 2) {
    const ang = has(r.redondez ?? '', 'angul')
    criterios.push(ang ? 'Clastos angulosos: transporte corto' : 'Clastos redondeados: transporte prolongado')
    const nombre = ang ? 'Brecha' : 'Conglomerado'
    const mat = n0(m.mat)
    const sop = total > 0 && (mat / total) * 100 >= 15 ? ' soportado por matriz' : ''
    const poli = has(todo, 'polimict', 'varios tipos', 'diferentes rocas', 'distintas rocas') ? ' polimíctico' : has(todo, 'monomict', 'un solo tipo') ? ' monomíctico' : ''
    return base(`${nombre}${poli}${sop}`.replace('Brecha polimíctico', 'Brecha polimíctica').replace('Brecha monomíctico', 'Brecha monomíctica').replace('Brecha soportado', 'Brecha soportada'), ang ? GUIA.brecha : GUIA.conglomerado, 'alta')
  }
  if (mm > 0.0625) {
    const Q = n0(m.q), F = n0(m.f), L = n0(m.l), mat = n0(m.mat)
    const qfl = Q + F + L
    if (qfl > 0) {
      const matPct = total > 0 ? (mat / total) * 100 : 0
      const q = r0((Q / qfl) * 100), f = r0((F / qfl) * 100), l = r0((L / qfl) * 100)
      criterios.push(`QFL recalculado: Q ${q} · F ${f} · L ${l}`)
      if (matPct >= 15) {
        criterios.push(`Matriz ${r0(matPct)} % (> 15 %): wacka`)
        return base('Grauvaca (wacka)', GUIA.arenisca, 'alta')
      }
      const { name, interp } = qflName(Q, F, L)
      criterios.push(interp)
      return base(name, GUIA.arenisca, 'alta')
    }
    avisos.push('Indica los % de cuarzo, feldespato y líticos para nombrar la arenisca con el diagrama QFL.')
    return base('Arenisca', GUIA.arenisca)
  }
  const fisil = has(todo, 'fisil', 'laminas', 'lajas', 'hojas', 'se parte en capas')
  if (mm > 0.0039 && !fisil) {
    criterios.push('Predomina el limo (tacto áspero o harinoso)')
    return base('Limolita', GUIA.lutita)
  }
  if (fisil) criterios.push('Fisilidad: se divide en láminas finas')
  return base(fisil ? 'Lutita' : 'Arcillolita', GUIA.lutita)
}

function clasificarMetamorfica(r: Respuestas, m: Minerales): Resultado {
  const criterios: string[] = []
  const avisos: string[] = []
  const todo = Object.values(r).join(' ')
  const fol = r.foliacion ?? ''
  const tex = `${fol} ${r.textura ?? ''}`
  const size = tamanoMm(r.tamano)
  const total = suma(m)
  const pct = (k: string) => (total > 0 ? (n0(m[k]) / total) * 100 : 0)
  const noFol = has(fol, 'no ', 'sin ', 'masiv', 'no foliada', 'ausent', 'granoblast') || negativo(fol)
  const bandeada = has(tex, 'band', 'gneis', 'alternan', 'franjas')
  const esquist = has(tex, 'esquist', 'escam', 'micas visibles', 'lepidoblast')
  const satinado = has(todo, 'satin', 'sedos', 'brillo seda', 'nacarad')
  const contacto = has(todo, 'contacto', 'aureola', 'intrusi', 'motead')
  const porfiro = limpiar(r.porfiroblastos) && !negativo(r.porfiroblastos)
  const visible = size ? size.max >= 0.5 : has(r.tamano ?? '', 'visible', 'medio', 'grues')
  const base = (nombre: string, ficha?: FichaRoca, conf: Resultado['confianza'] = 'media'): Resultado => ({ nombre, ficha, grupo: 'metamorfica', criterios, confianza: conf, avisos })

  const micaDom = pct('bt') > pct('ms') ? 'biotita' : 'moscovita'
  const conGrt = pct('grt') >= 3 || has(todo, 'granate')
  const conAls = pct('als') >= 3 || has(todo, 'andalucita', 'cianita', 'distena', 'silimanita', 'estaurolita')

  if (!noFol && limpiar(fol)) {
    criterios.push('Roca foliada')
    if (bandeada || (size && size.max >= 2 && pct('fd') >= 20)) {
      criterios.push('Bandeado gnéisico: alternancia de bandas claras y oscuras, grano visible')
      const orto = pct('fd') >= 30 ? ' (probable ortogneis)' : conAls || pct('ms') + pct('bt') >= 25 ? ' (probable paragneis)' : ''
      return base(`Gneis${orto}`, GUIA.gneis, 'alta')
    }
    if (esquist || visible) {
      criterios.push('Esquistosidad con micas visibles a simple vista')
      let n = `Esquisto de ${micaDom}`
      if (conGrt) n += ' con granate'
      else if (conAls) n += ' con aluminosilicatos'
      return base(n, GUIA.esquisto, 'alta')
    }
    if (contacto && porfiro) {
      criterios.push('Porfiroblastos milimétricos por metamorfismo de contacto')
      return base('Filita moteada', GUIA['filita-moteada'], 'alta')
    }
    if (satinado) {
      criterios.push('Grano fino no visible y brillo satinado')
      return base('Filita', GUIA.filita, 'alta')
    }
    criterios.push('Grano muy fino, brillo mate y clivaje pizarroso')
    return base('Pizarra', GUIA.pizarra, 'media')
  }

  if (noFol) criterios.push('Roca no foliada (granoblástica)')
  if (pct('cal') >= 50 || has(todo, 'calcita', 'efervesc', 'reacciona con hcl')) {
    criterios.push(pct('cal') ? `Calcita/dolomita ${r0(pct('cal'))} %` : 'Reacciona con HCl: carbonatos')
    return base('Mármol', GUIA.marmol, 'alta')
  }
  if (pct('q') >= 80) {
    criterios.push(`Cuarzo ${r0(pct('q'))} % (> 80 %)`)
    return base('Cuarcita', GUIA.cuarcita, 'alta')
  }
  if (pct('grt') >= 15 && pct('px') >= 15 && pct('grt') + pct('px') >= 60) {
    criterios.push('Granate + piroxeno dominantes: alta presión')
    return base('Eclogita', GUIA.eclogita, 'alta')
  }
  if (pct('anf') >= 40) {
    criterios.push(`Anfíbol ${r0(pct('anf'))} %`)
    return base('Anfibolita', GUIA.anfibolita, 'alta')
  }
  if (!noFol && !limpiar(fol)) avisos.push('Indica si la roca tiene foliación: es el primer criterio para clasificar una metamórfica.')
  if (noFol || contacto) {
    criterios.push('Mosaico de cristales sin orientación (textura decusada)')
    return base('Corneana', GUIA.corneana, contacto ? 'alta' : 'media')
  }
  return base(limpiar(r.nombre) || 'Roca metamórfica (sin datos suficientes)', undefined, 'baja')
}

export function clasificar(tipo: Tipo, r: Respuestas, m: Minerales): Resultado {
  const res = tipo === 'ignea' ? clasificarIgnea(r, m) : tipo === 'sedimentaria' ? clasificarSedimentaria(r, m) : clasificarMetamorfica(r, m)
  const propio = limpiar(r.nombre)
  if (propio && res.confianza !== 'baja' && !norm(res.nombre).includes(norm(propio).split(' ')[0])) {
    res.avisos.push(`Tu nombre («${propio}») no coincide con el calculado («${res.nombre}»): revisa los porcentajes y las observaciones.`)
  }
  return res
}

/* ─────────────────────────── redacción ─────────────────────────── */

function redactarIgnea(r: Respuestas, m: Minerales, res: Resultado, pick: Pick): string[] {
  const p1: string[] = []
  const id = limpiar(r.muestra)
  const total = suma(m)
  const M = n0(m.ol) + n0(m.px) + n0(m.anf) + n0(m.bt)
  const ic = cristalinidad(r.cristalinidad ?? '') === 'holohialina' ? null : indiceColor(total > 0 ? (M / total) * 100 : null, `${r.indice ?? ''} ${r.color ?? ''}`)
  const tipoRoca = res.grupo === 'plutonica' ? 'ígnea plutónica' : 'ígnea volcánica'
  const color = limpiar(r.color)
  p1.push(
    pick([
      `${id ? `La muestra ${id}` : 'La muestra'} corresponde a una roca ${tipoRoca}${color ? ` de color ${color} en corte fresco` : ''}`,
      `${id ? `En la muestra de mano ${id} se reconoce` : 'Se reconoce'} una roca ${tipoRoca}${color ? `, de tonalidad ${color} en superficie fresca` : ''}`,
      `Se describe ${id ? `la muestra ${id}, ` : ''}una roca ${tipoRoca}${color ? ` que en fresco presenta un color ${color}` : ''}`,
    ])
  )
  const alt = limpiar(r.alteracion)
  if (alt) p1.push(pick([`la superficie meteorizada muestra ${alt}`, `la superficie alterada presenta ${alt}`, `por meteorización adquiere ${alt}`]))
  if (ic) p1.push(pick([`por su índice de color es ${ic}${total > 0 ? ` (${r0((M / total) * 100)} % de minerales máficos)` : ''}`, `se trata de una roca ${ic}${total > 0 ? `, con un ${r0((M / total) * 100)} % de máficos` : ''}`]))
  const crist = cristalinidad(r.cristalinidad ?? '') ?? limpiar(r.cristalinidad)
  const grano = limpiar(r.tamano) ? granoIgneo(tamanoMm(r.tamano), r.tamano ?? '').termino : ''
  if (crist || grano) {
    p1.push(
      pick([
        `presenta una textura ${[crist, grano].filter(Boolean).join(' y ')}`,
        `su textura es ${[crist, grano].filter(Boolean).join(', ')}`,
        `texturalmente es ${[crist, grano].filter(Boolean).join(' y ')}`,
      ])
    )
  }
  const dist = distribucion(r.distribucion ?? '')
  if (dist) p1.push(pick([`la distribución del tamaño de los cristales es ${dist}`, `en cuanto a la distribución granulométrica, la roca es ${dist}`]))
  const forma = formaCristales(r.forma ?? '')
  if (forma) p1.push(pick([`los cristales son ${forma}`, `en cuanto a su forma, los cristales son ${forma}`]))
  const est = limpiar(r.estructuras)
  if (est && !negativo(est)) p1.push(pick([`como rasgos particulares presenta ${est}`, `destaca además la presencia de ${est}`, `se observan estructuras como ${est}`]))

  const p2: string[] = []
  const lista = listaMinerales('ignea', m)
  const otros = limpiar(r.otros)
  if (lista) p2.push(pick([`La moda mineral estimada está compuesta por ${lista}`, `Mineralógicamente se identifican ${lista}`, `La composición modal estimada comprende ${lista}`]))
  if (otros) p2.push(pick([`como accesorios se reconocen ${otros}`, `además aparecen ${otros} como minerales accesorios`]))
  return [frase(p1), frase(p2)]
}

function redactarSedimentaria(r: Respuestas, m: Minerales, _res: Resultado, pick: Pick): string[] {
  const p1: string[] = []
  const id = limpiar(r.muestra)
  const color = limpiar(r.color)
  const origenRaw = limpiar(r.origen)
  const origen = has(origenRaw, 'bioquim') ? 'bioquímico' : has(origenRaw, 'detrit', 'clast') ? 'detrítico' : has(origenRaw, 'quim') ? 'químico' : has(origenRaw, 'organ', 'biogen') ? 'orgánico' : origenRaw
  p1.push(
    pick([
      `${id ? `La muestra ${id}` : 'La muestra'} corresponde a una roca sedimentaria${origen ? ` de origen ${origen.toLowerCase()}` : ''}${color ? `, de color ${color} en corte fresco` : ''}`,
      `Se describe ${id ? `la muestra ${id}, ` : ''}una roca sedimentaria${origen ? ` ${origen.toLowerCase()}` : ''}${color ? ` que en fresco muestra una tonalidad ${color}` : ''}`,
    ])
  )
  const alt = limpiar(r.alteracion)
  if (alt) p1.push(pick([`la superficie meteorizada adquiere un color ${alt}`, `por alteración superficial toma un tono ${alt}`]))
  const size = tamanoMm(r.tamano)
  if (limpiar(r.tamano)) {
    const t = size ? `${wentworth(size.max)} (${size.min === size.max ? fmtMm(size.max) : `${fmtMm(size.min)}–${fmtMm(size.max)}`} mm, escala de Wentworth)` : limpiar(r.tamano)
    p1.push(size ? pick([`el tamaño de grano corresponde a ${t}`, `granulométricamente se clasifica como ${t}`]) : `el tamaño de grano es ${t}`)
  }
  const red = redondez(r.redondez ?? '')
  if (red) p1.push(pick([`los clastos son ${red}`, `los granos se presentan ${red}`]))
  const sel = seleccion(r.seleccion ?? '')
  if (sel) {
    const madura = red && /redond/.test(red) && /bien/.test(sel)
    p1.push(pick([`la roca está ${sel}${madura ? ', lo que indica una madurez textural alta' : ''}`, `presenta una textura ${sel}${madura ? ' y texturalmente madura' : ''}`]))
  }
  const mat = limpiar(r.matriz)
  if (mat) p1.push(pick([`los granos están unidos por ${mat}`, `como material intersticial presenta ${mat}`]))
  const hcl = limpiar(r.hcl)
  if (hcl) {
    if (negativo(hcl) || has(hcl, 'no reac')) p1.push(pick(['no reacciona con ácido clorhídrico diluido', 'la prueba con HCl es negativa']))
    else p1.push(pick([`frente al ácido clorhídrico diluido muestra ${hcl}`, `la prueba con HCl da ${hcl}`]))
  }
  const est = limpiar(r.estructuras)
  if (est && !negativo(est)) p1.push(pick([`se reconocen estructuras sedimentarias como ${est}`, `entre sus estructuras destacan ${est}`]))
  const fos = limpiar(r.fosiles)
  if (fos) p1.push(negativo(fos) ? 'no se observan restos fósiles' : pick([`contiene restos fósiles de ${fos.replace(/^(s[ií],?\s*)/i, '')}`, `en cuanto al contenido paleontológico, presenta ${fos}`]))

  const p2: string[] = []
  const lista = listaMinerales('sedimentaria', m)
  if (lista) p2.push(pick([`Su composición estimada es de ${lista}`, `Composicionalmente está formada por ${lista}`]))
  const otros = limpiar(r.otros)
  if (otros) p2.push(`también se reconocen ${otros}`)
  return [frase(p1), frase(p2)]
}

function redactarMetamorfica(r: Respuestas, m: Minerales, _res: Resultado, pick: Pick): string[] {
  const p1: string[] = []
  const id = limpiar(r.muestra)
  const color = limpiar(r.color)
  p1.push(
    pick([
      `${id ? `La muestra ${id}` : 'La muestra'} corresponde a una roca metamórfica${color ? ` de color ${color} en corte fresco` : ''}`,
      `Se describe ${id ? `la muestra ${id}, ` : ''}una roca metamórfica${color ? ` de tonalidad ${color}` : ''}`,
    ])
  )
  const alt = limpiar(r.alteracion)
  if (alt) p1.push(pick([`la superficie meteorizada presenta ${alt}`, `por alteración superficial muestra ${alt}`]))
  const fol = limpiar(r.foliacion)
  if (fol) p1.push(negativo(fol) ? pick(['no presenta foliación, por lo que su estructura es masiva', 'carece de foliación y muestra una estructura masiva']) : pick([`estructuralmente es ${fol}`, `presenta ${fol}`]))
  const size = tamanoMm(r.tamano)
  if (limpiar(r.tamano)) {
    const t = size ? `${size.max < 0.5 ? 'muy fino, no distinguible a simple vista' : size.max < 1 ? 'fino' : size.max <= 5 ? 'medio, visible a simple vista' : 'grueso'} (${size.min === size.max ? fmtMm(size.max) : `${fmtMm(size.min)}–${fmtMm(size.max)}`} mm)` : limpiar(r.tamano)
    p1.push(pick([`el tamaño de grano es ${t}`, `sus cristales tienen un tamaño ${t}`]))
  }
  const tex = limpiar(r.textura)
  if (tex) p1.push(pick([`la textura es ${tex}`, `texturalmente se describe como ${tex}`]))
  const por = limpiar(r.porfiroblastos)
  if (por) p1.push(negativo(por) ? 'no se observan porfiroblastos' : pick([`contiene porfiroblastos de ${por}`, `destacan porfiroblastos de ${por}`]))

  const p2: string[] = []
  const lista = listaMinerales('metamorfica', m)
  if (lista) p2.push(pick([`La paragénesis mineral estimada está formada por ${lista}`, `Mineralógicamente se reconocen ${lista}`]))
  const otros = limpiar(r.otros)
  if (otros) p2.push(`además aparecen ${otros}`)
  const prot = limpiar(r.protolito)
  if (prot) p2.push(pick([`por su composición, el protolito probable es ${prot}`, `se interpreta como protolito ${prot}`]))
  const grado = limpiar(r.grado)
  if (grado) p2.push(pick([`la asociación mineral sugiere un metamorfismo de ${grado}`, `los minerales índice apuntan a ${grado}`]))
  return [frase(p1), frase(p2)]
}

/** Une fragmentos en oraciones: el primero abre oración y el resto se encadena con «;» o «.» alternos */
function frase(partes: string[]): string {
  const p = partes.filter(Boolean)
  if (!p.length) return ''
  const out: string[] = []
  p.forEach((x, i) => {
    if (i === 0 || i % 2 === 0) out.push(mayus(x))
    else out[out.length - 1] += `; ${x}`
  })
  return out.map((o) => (/[.!?]$/.test(o) ? o : `${o}.`)).join(' ')
}

export function redactar(tipo: Tipo, r: Respuestas, m: Minerales, res: Resultado, seed: number): string[] {
  const rand = rng(seed)
  const pick: Pick = (arr) => arr[Math.floor(rand() * arr.length)]
  const [desc, comp] =
    tipo === 'ignea' ? redactarIgnea(r, m, res, pick) : tipo === 'sedimentaria' ? redactarSedimentaria(r, m, res, pick) : redactarMetamorfica(r, m, res, pick)

  const hayDatos = Object.values(r).some((v) => limpiar(v)) || suma(m) > 0
  if (!hayDatos) return []

  const parrafos: string[] = []
  if (desc) parrafos.push(desc)

  // Clasificación razonada
  if (res.confianza !== 'baja' || res.criterios.length) {
    const crit = res.criterios.map((c) => (/^[A-Z]{2}/.test(c) ? c : c.charAt(0).toLowerCase() + c.slice(1)).replace(/ → /g, ': '))
    const lista = crit.length ? ` —${crit.join('; ')}—` : ''
    const nom = nombreEnTexto(res.nombre)
    const cl = pick([
      `De acuerdo con los criterios de clasificación${lista}, la roca se clasifica como ${nom}`,
      `Según los criterios aplicados${lista}, la muestra corresponde a un${femenino(res.nombre) ? 'a' : ''} ${nom}`,
      `La clasificación${lista} permite nombrar la roca como ${nom}`,
    ])
    parrafos.push([comp, mayus(cl) + '.'].filter(Boolean).join(' '))
  } else if (comp) parrafos.push(comp)

  const f = res.ficha
  if (f) {
    parrafos.push(
      pick([
        `${mayus(f.clase.toLowerCase())}. ${f.identificacion}`,
        `Rasgos diagnósticos ${femenino(f.nombre) ? 'de la' : 'del'} ${nombreEnTexto(f.nombre)}, ${f.clase.toLowerCase()}: ${nombreEnTexto(f.identificacion)}`,
        `Identificación ${femenino(f.nombre) ? 'de la' : 'del'} ${nombreEnTexto(f.nombre)}: ${nombreEnTexto(f.identificacion)}`,
      ])
    )
    parrafos.push(
      pick([
        `Ambiente de formación: ${nombreEnTexto(f.ambiente)}`,
        `En cuanto a su génesis, ${f.ambiente.charAt(0).toLowerCase() + f.ambiente.slice(1)}`,
        `Respecto a su ambiente de formación, ${f.ambiente.charAt(0).toLowerCase() + f.ambiente.slice(1)}`,
      ])
    )
  } else if (res.confianza !== 'baja') {
    parrafos.push(AMBIENTE_GENERICO[res.grupo])
  }

  const obs = limpiar(r.obs)
  if (obs) parrafos.push(`${pick(['Como observación adicional,', 'Cabe añadir que', 'Por último,'])} ${obs.charAt(0).toLowerCase() + obs.slice(1)}.`)
  return parrafos.filter(Boolean)
}
