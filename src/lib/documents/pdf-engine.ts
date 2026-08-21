import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

export { jsPDF }

export interface DocumentMargins {
  top: number
  bottom: number
  left: number
  right: number
  width: number
}

// A4 Margins (for non-agreement sales documents like Quotation, Invoice, Receipt)
export const A4_MARGINS: DocumentMargins = {
  top: 48,
  bottom: 260,
  left: 15,
  right: 195,
  width: 180,
}

// US LEGAL Margins (8.5 x 14 in / 215.9 x 355.6 mm) for ALL Agreements
export const LEGAL_PAPER_SIZE_MM = {
  width: 215.9,
  height: 355.6,
}

export const LEGAL_MARGINS: DocumentMargins = {
  top: 48,
  bottom: 330,
  left: 15,
  right: 200.9,
  width: 185.9,
}

// Convert image URL or path to base64 for jsPDF rendering
export async function getLetterheadBase64(): Promise<string | null> {
  try {
    if (typeof window !== 'undefined') {
      const response = await fetch('/documents/thennakoon-tours-letterhead.png')
      if (!response.ok) return null
      const blob = await response.blob()
      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.onerror = () => resolve(null)
        reader.readAsDataURL(blob)
      })
    } else {
      try {
        const fs = await import('fs')
        const path = await import('path')
        const letterheadPath = path.join(process.cwd(), 'public', 'documents', 'thennakoon-tours-letterhead.png')
        if (fs.existsSync(letterheadPath)) {
          const fileBuffer = fs.readFileSync(letterheadPath)
          return `data:image/png;base64,${fileBuffer.toString('base64')}`
        }
      } catch {
        return null
      }
    }
    return null
  } catch (err) {
    console.error('Failed to load letterhead image', err)
    return null
  }
}

// Draw letterhead background image on the CURRENT A4 page
export function drawLetterheadOnPage(doc: jsPDF, base64Img: string | null) {
  if (!base64Img) return
  try {
    doc.addImage(base64Img, 'PNG', 0, 0, 210, 297)
  } catch (err) {
    console.error('Error drawing letterhead on page', err)
  }
}

// Draw letterhead background image on the CURRENT US Legal page (215.9 x 355.6 mm)
export function drawLetterheadOnLegalPage(doc: jsPDF, base64Img: string | null) {
  if (!base64Img) return
  try {
    doc.addImage(base64Img, 'PNG', 0, 0, 215.9, 355.6)
  } catch (err) {
    console.error('Error drawing legal letterhead on page', err)
  }
}

// Draw letterhead background image on all existing pages of an A4 jsPDF document
export function drawLetterheadBackground(doc: jsPDF, base64Img: string | null) {
  if (!base64Img) return
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalPages = (doc as any).internal.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.addImage(base64Img, 'PNG', 0, 0, 210, 297)
  }
}

// Draw letterhead background image on all existing pages of a US Legal jsPDF document
export function drawLetterheadBackgroundLegal(doc: jsPDF, base64Img: string | null) {
  if (!base64Img) return
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalPages = (doc as any).internal.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.addImage(base64Img, 'PNG', 0, 0, 215.9, 355.6)
  }
}

export interface TextOptionsWithAlign {
  align?: 'left' | 'center' | 'right'
}

/**
 * Draws text with authentic superscript styling for ordinal date suffixes (st, nd, rd, th).
 * Automatically calculates character widths and renders the suffix at a smaller font size
 * with an elevated vertical baseline.
 */
export function drawTextWithOrdinalSuperscript(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  options?: TextOptionsWithAlign
) {
  if (!text) return

  const mainFontSize = doc.getFontSize()
  const supFontSize = Math.max(5.5, mainFontSize * 0.62)
  const baselineOffset = mainFontSize * 0.28 // Baseline elevation in mm

  // Standardize any unicode superscripts back to ASCII for clean font rendering
  let cleanText = String(text)
    .replace(/ˢᵗ/g, 'st')
    .replace(/ⁿᵈ/g, 'nd')
    .replace(/ʳᵈ/g, 'rd')
    .replace(/ᵗʰ/g, 'th')

  const regex = /(\b\d{1,2})(st|nd|rd|th)\b/gi
  let match: RegExpExecArray | null

  // Tokenize text into segments: { text: string, isSuperscript: boolean }
  const segments: { text: string; isSuperscript: boolean }[] = []
  let lastIndex = 0

  while ((match = regex.exec(cleanText)) !== null) {
    const dayPart = match[1]
    const suffixPart = match[2]
    const matchStart = match.index

    // Text before match
    if (matchStart > lastIndex) {
      segments.push({ text: cleanText.slice(lastIndex, matchStart), isSuperscript: false })
    }

    // Day part
    segments.push({ text: dayPart, isSuperscript: false })

    // Suffix part
    segments.push({ text: suffixPart, isSuperscript: true })

    lastIndex = regex.lastIndex
  }

  if (lastIndex < cleanText.length) {
    segments.push({ text: cleanText.slice(lastIndex), isSuperscript: false })
  }

  // If no ordinal match found, fallback to standard doc.text
  if (segments.length <= 1) {
    doc.text(cleanText, x, y, options)
    return
  }

  // Calculate total width of all segments
  let totalWidth = 0
  const segmentWidths: number[] = []

  for (const seg of segments) {
    if (seg.isSuperscript) {
      doc.setFontSize(supFontSize)
    } else {
      doc.setFontSize(mainFontSize)
    }
    const w = doc.getTextWidth(seg.text)
    segmentWidths.push(w)
    totalWidth += w
  }

  // Determine starting X coordinate
  let currentX = x
  if (options?.align === 'right') {
    currentX = x - totalWidth
  } else if (options?.align === 'center') {
    currentX = x - totalWidth / 2
  }

  // Render segments
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]
    const w = segmentWidths[i]

    if (seg.isSuperscript) {
      doc.setFontSize(supFontSize)
      doc.text(seg.text, currentX, y - baselineOffset)
    } else {
      doc.setFontSize(mainFontSize)
      doc.text(seg.text, currentX, y)
    }

    currentX += w
  }

  // Restore original font size
  doc.setFontSize(mainFontSize)
}

export { autoTable }
