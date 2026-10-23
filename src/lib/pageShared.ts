/** pone la variante en mayúscula si la palabra original lo estaba */
export function matchCase(original: string, variant: string): string {
  return /^[A-ZÁÉÍÓÚÑ]/.test(original)
    ? variant.charAt(0).toUpperCase() + variant.slice(1)
    : variant
}

/** divide una oración larga en dos: primero en un conector, si no en la coma más cercana al centro */
export function dividirOracion(sentence: string): string {
  const trimmed = sentence.trim()
  const punctMatch = trimmed.match(/[.!?…]+\s*$/)
  const punct = punctMatch ? punctMatch[0] : '.'
  const body = punctMatch ? trimmed.slice(0, trimmed.length - punctMatch[0].length) : trimmed
  if (body.split(/\s+/).length < 10) return sentence
  let cut = -1
  const conn = /,\s+(y|e|pero|aunque|porque|mientras|sin embargo|no obstante|so|and|but|although|because|while|however)\s+/i.exec(
    body
  )
  if (conn && conn.index > body.length * 0.25) cut = conn.index
  if (cut === -1) {
    const commas: number[] = []
    const re = /,\s+/g
    let m: RegExpExecArray | null
    while ((m = re.exec(body)) !== null) commas.push(m.index)
    if (commas.length > 0) {
      const mid = body.length / 2
      cut = commas.reduce((a, b) => (Math.abs(b - mid) < Math.abs(a - mid) ? b : a))
    }
  }
  if (cut === -1) return sentence
  const first = body.slice(0, cut).trim()
  const second = body.slice(cut).replace(/^,\s*/, '').trim()
  if (!first || !second) return sentence
  const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1)
  return `${first}. ${cap(second)}${punct}`
}

/* ═══ Claves de sessionStorage para el flujo de texto entre páginas ═══ */
export const K_PDF_TEXT = 'app:pdfText' // texto extraído del PDF (Conversor → Detector)
export const K_DETECT_TEXT = 'app:detectText' // texto del detector (Detector ↔ Plagio)
export const K_DOC_NAME = 'app:docName' // nombre del documento cargado en el detector
export const K_PENDING_DETECT = 'app:pendingDetectText' // transferencia Plagio → Detector
export const EV_TEXT = 'app:text' // evento personalizado: el texto del detector cambió
