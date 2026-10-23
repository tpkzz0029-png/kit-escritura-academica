import mammoth from 'mammoth'
import { extractPages } from './pdf'

export const ACCEPTED_DOC_EXTENSIONS = ['.txt', '.md', '.csv', '.docx', '.pdf']

function ext(name: string): string {
  const i = name.lastIndexOf('.')
  return i >= 0 ? name.slice(i).toLowerCase() : ''
}

/**
 * Extrae texto plano de un archivo: .txt/.md/.csv (texto directo),
 * .docx (vía mammoth) y .pdf (vía pdf.js, reutilizando el extractor del conversor).
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const e = ext(file.name)

  if (e === '.pdf') {
    const pages = await extractPages(file)
    return pages.map((p) => p.text).join('\n\n').trim()
  }

  if (e === '.docx') {
    const buffer = await file.arrayBuffer()
    const result = await mammoth.extractRawText({ arrayBuffer: buffer })
    const text = result.value.trim()
    if (!text) {
      throw new Error('El documento Word no contiene texto extraíble (¿es un escaneo?).')
    }
    return text
  }

  if (ACCEPTED_DOC_EXTENSIONS.includes(e)) {
    const text = (await file.text()).replace(/\r/g, '').trim()
    if (!text) throw new Error('El archivo está vacío.')
    return text
  }

  throw new Error(`Formato no soportado: ${e || '(sin extensión)'}. Usa ${ACCEPTED_DOC_EXTENSIONS.join(', ')}.`)
}
