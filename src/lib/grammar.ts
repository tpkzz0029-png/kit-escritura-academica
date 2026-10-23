// Segunda opinión automática de escritura con LanguageTool (API pública gratuita,
// sin clave). Revisa gramática, ortografía, puntuación y estilo en el idioma
// que detecte, para cualquier persona que use la app sin instalar nada.
//
// Los trozos enviados al API son subcadenas EXACTAS del texto original, así
// que cada aviso conserva su posición absoluta (offset/length) y las
// correcciones de ortografía y concordancia se pueden aplicar sobre el texto
// de una vez con applyGrammarFixes().

const LT_URL = 'https://api.languagetool.org/v2/check'
const CHUNK_LEN = 3000
const MAX_CHUNKS = 6
const PAUSE_MS = 800

export interface GrammarIssue {
  message: string
  short: string
  category: string
  categoryId: string
  issueType: string
  sentence: string
  replacement?: string
  /** posición absoluta en el texto original; -1 = no aplicable */
  offset: number
  length: number
}

export interface GrammarReport {
  languageName: string
  languageCode: string
  issues: GrammarIssue[]
  counts: Array<{ category: string; count: number }>
}

interface Chunk {
  text: string
  /** índice de inicio en el texto original; -1 si los offsets no son fiables */
  start: number
}

function chunkForLT(text: string): Chunk[] {
  // párrafos con su posición original (trozos [^\n]+)
  const paras: Array<{ text: string; start: number }> = []
  const re = /[^\n]+/g
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    paras.push({ text: m[0], start: m.index })
  }

  // agrupa párrafos contiguos (incluyendo los saltos de línea intermedios,
  // de modo que cada chunk sea un substring exacto del original)
  const raw: Chunk[] = []
  let curStart = -1
  let curEnd = -1
  for (const p of paras) {
    if (curStart === -1) {
      curStart = p.start
      curEnd = p.start + p.text.length
      continue
    }
    if (p.start + p.text.length - curStart <= CHUNK_LEN) {
      curEnd = p.start + p.text.length
    } else {
      raw.push({ text: text.slice(curStart, curEnd), start: curStart })
      curStart = p.start
      curEnd = p.start + p.text.length
    }
  }
  if (curStart !== -1) raw.push({ text: text.slice(curStart, curEnd), start: curStart })

  // párrafos gigantes: dividir por espacios sin pasar del límite
  const chunks: Chunk[] = []
  for (const c of raw) {
    if (c.text.length <= CHUNK_LEN) {
      chunks.push(c)
      continue
    }
    let pos = 0
    while (pos < c.text.length) {
      let end = Math.min(pos + CHUNK_LEN, c.text.length)
      if (end < c.text.length) {
        const sp = c.text.lastIndexOf(' ', end)
        if (sp > pos + CHUNK_LEN * 0.5) end = sp
      }
      chunks.push({ text: c.text.slice(pos, end), start: c.start + pos })
      pos = end
    }
  }

  // límite de trozos de la API gratuita: se fusiona el resto; los avisos de
  // ese trozo ya no tienen offsets fiables (offset -1 = no aplicable)
  if (chunks.length > MAX_CHUNKS) {
    const head = chunks.slice(0, MAX_CHUNKS - 1)
    const tail = chunks.slice(MAX_CHUNKS - 1)
    head.push({ text: tail.map((c) => c.text).join('\n\n'), start: -1 })
    return head
  }
  return chunks
}

export async function checkGrammar(text: string): Promise<GrammarReport> {
  const chunks = chunkForLT(text)
  if (chunks.length === 0) throw new Error('No hay texto que revisar.')

  const issues: GrammarIssue[] = []
  let languageName = ''
  let languageCode = ''

  for (let i = 0; i < chunks.length; i++) {
    if (i > 0) await new Promise((r) => setTimeout(r, PAUSE_MS))
    const chunk = chunks[i]
    const params = new URLSearchParams({ text: chunk.text, language: 'auto' })
    const res = await fetch(LT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
      body: params.toString(),
    })
    if (!res.ok) {
      if (res.status === 429) throw new Error('Demasiadas solicitudes a LanguageTool. Espera un minuto y reintenta.')
      throw new Error(`LanguageTool respondió con error ${res.status}.`)
    }
    const data = await res.json()
    languageName = data?.language?.detectedLanguage?.name ?? data?.language?.name ?? ''
    languageCode = data?.language?.detectedLanguage?.code ?? data?.language?.code ?? ''
    for (const m of data?.matches ?? []) {
      issues.push({
        message: m.message ?? '',
        short: m.shortMessage ?? '',
        category: m.rule?.category?.name ?? 'Otro',
        categoryId: m.rule?.category?.id ?? '',
        issueType: m.rule?.issueType ?? '',
        sentence: m.sentence ?? '',
        replacement: m.replacements?.[0]?.value,
        offset: chunk.start >= 0 ? chunk.start + (m.offset ?? 0) : -1,
        length: m.length ?? 0,
      })
    }
  }

  const byCat = new Map<string, number>()
  for (const issue of issues) {
    byCat.set(issue.category, (byCat.get(issue.category) ?? 0) + 1)
  }
  const counts = Array.from(byCat.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)

  return {
    languageName,
    languageCode,
    issues: issues.slice(0, 100),
    counts,
  }
}

/** ¿pertenece la categoría a ortografía o gramática/concordancia? */
export function isAutoFixable(issue: GrammarIssue): boolean {
  const id = issue.categoryId.toUpperCase()
  if (id === 'TYPOS' || id === 'GRAMMAR') return true
  const c = issue.category.toLowerCase()
  return (
    c.includes('ortograf') ||
    c.includes('typo') ||
    c.includes('gram') ||
    c.includes('concord') ||
    c.includes('spelling')
  )
}

/**
 * Aplica al texto, de una vez, todas las correcciones de ortografía y
 * concordancia que tienen sugerencia automática. Se aplica de atrás hacia
 * adelante para no invalidar las posiciones restantes.
 */
export function applyGrammarFixes(
  text: string,
  issues: GrammarIssue[]
): { text: string; applied: number } {
  const fixable = issues
    .filter(
      (i) =>
        i.replacement &&
        i.replacement.trim() &&
        isAutoFixable(i) &&
        i.offset >= 0 &&
        i.length > 0 &&
        i.offset + i.length <= text.length
    )
    .sort((a, b) => b.offset - a.offset)

  let out = text
  let applied = 0
  const used = new Set<number>()
  for (const i of fixable) {
    if (used.has(i.offset)) continue
    used.add(i.offset)
    out = out.slice(0, i.offset) + i.replacement + out.slice(i.offset + i.length)
    applied++
  }
  return { text: out, applied }
}

export function categoryBadgeClass(category: string): string {
  const c = category.toLowerCase()
  if (c.includes('ortograf') || c.includes('typo') || c.includes('misspell'))
    return 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
  if (c.includes('gram') || c.includes('concord'))
    return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
  if (c.includes('puntu') || c.includes('capital') || c.includes('mayús'))
    return 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
  if (c.includes('estilo') || c.includes('style') || c.includes('redund'))
    return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
  return 'bg-muted text-muted-foreground'
}
