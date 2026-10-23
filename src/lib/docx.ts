import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from 'docx'
import type { PdfPage } from './pdf'

export type DocMode = 'convert' | 'translate' | 'bilingual'

export function paragraphsFromText(text: string, italic = false, color?: string): Paragraph[] {
  if (!text.trim()) return []
  return text.split('\n').map(
    (line) =>
      new Paragraph({
        children: line.trim()
          ? [new TextRun({ text: line, italics: italic, color })]
          : [],
      })
  )
}

export async function buildDocx(
  original: PdfPage[],
  translated: PdfPage[] | null,
  mode: DocMode,
  title: string,
  withPageHeadings: boolean,
  footerNote: string
): Promise<Blob> {
  const children: Paragraph[] = []

  children.push(
    new Paragraph({
      text: title,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
    })
  )
  if (footerNote) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: footerNote, italics: true, color: '6B7280', size: 18 }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 240 },
      })
    )
  }

  original.forEach((page, idx) => {
    if (withPageHeadings) {
      children.push(
        new Paragraph({
          text: `Página ${page.page}`,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 320, after: 120 },
        })
      )
    }

    if (mode !== 'translate') {
      children.push(...paragraphsFromText(page.text))
    }

    if (mode !== 'convert' && translated) {
      const tPage = translated[idx]
      if (tPage && tPage.text.trim()) {
        if (mode === 'bilingual') {
          children.push(...paragraphsFromText(tPage.text, true, '374151'))
        } else {
          children.push(...paragraphsFromText(tPage.text))
        }
      }
    }
  })

  const doc = new Document({
    creator: 'Conversor PDF → Word',
    title,
    sections: [{ children }],
  })

  return Packer.toBlob(doc)
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}
