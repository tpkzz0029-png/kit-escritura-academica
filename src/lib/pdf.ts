import * as pdfjsLib from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl

export interface PdfPage {
  page: number
  text: string
}

export async function extractPages(
  file: File,
  onProgress?: (done: number, total: number) => void
): Promise<PdfPage[]> {
  const data = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data }).promise
  const pages: PdfPage[] = []

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const items = content.items as Array<{ str?: string; transform?: number[]; hasEOL?: boolean }>

    let text = ''
    let lastY: number | null = null
    let line = ''

    for (const item of items) {
      if (typeof item.str !== 'string') continue
      const y = item.transform ? item.transform[5] : null
      if (lastY !== null && y !== null && Math.abs(y - lastY) > 2 && line.trim()) {
        text += line.trimEnd() + '\n'
        line = ''
      }
      line += item.str
      if (item.hasEOL) {
        if (line.trim()) text += line.trimEnd() + '\n'
        line = ''
        lastY = null
      } else if (y !== null) {
        lastY = y
      }
    }
    if (line.trim()) text += line.trimEnd() + '\n'

    pages.push({ page: i, text: text.trim() })
    onProgress?.(i, pdf.numPages)
  }
  return pages
}

export function countWords(pages: PdfPage[]): number {
  return pages.reduce((acc, p) => acc + (p.text ? p.text.split(/\s+/).filter(Boolean).length : 0), 0)
}

export function countChars(pages: PdfPage[]): number {
  return pages.reduce((acc, p) => acc + p.text.length, 0)
}
