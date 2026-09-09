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
export async function getLetterheadBase64(companySettings?: Record<string, any> | null): Promise<string | null> {
  try {
    let customUrl: string | null = companySettings?.letterhead_url || null

    if (!customUrl && typeof window === 'undefined') {
      try {
        const { createAdminClient } = await import('@/lib/supabase/admin')
        const adminClient = createAdminClient()
        const { data: cs } = await adminClient
          .from('company_settings')
          .select('letterhead_url')
          .limit(1)
          .maybeSingle()
        if (cs?.letterhead_url) {
          customUrl = cs.letterhead_url
        }
      } catch (_) {}
    }

    if (customUrl && typeof customUrl === 'string' && customUrl.trim()) {
      try {
        const fetchUrl = `${customUrl}${customUrl.includes('?') ? '&' : '?'}v=${Date.now()}`
        const res = await fetch(fetchUrl)
        if (res.ok) {
          if (typeof window !== 'undefined') {
            const blob = await res.blob()
            return new Promise((resolve) => {
              const reader = new FileReader()
              reader.onloadend = () => resolve(reader.result as string)
              reader.onerror = () => resolve(null)
              reader.readAsDataURL(blob)
            })
          } else {
            const arrayBuffer = await res.arrayBuffer()
            const buffer = Buffer.from(arrayBuffer)
            const contentType = res.headers.get('content-type') || 'image/png'
            const mime = contentType.includes('jpeg') || contentType.includes('jpg') ? 'image/jpeg' : 'image/png'
            return `data:${mime};base64,${buffer.toString('base64')}`
          }
        }
      } catch (err) {
        console.warn('[getLetterheadBase64] Custom letterhead URL fetch failed, falling back to default asset:', err)
      }
    }

    // Default Built-in Fallback
    if (typeof window !== 'undefined') {
      const cacheBustUrl = `/documents/thennakoon-tours-letterhead.png?v=20260909_seal_${Date.now()}`
      const response = await fetch(cacheBustUrl)
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
    const isJpg = base64Img.includes('image/jpeg') || base64Img.includes('image/jpg')
    doc.addImage(base64Img, isJpg ? 'JPEG' : 'PNG', 0, 0, 210, 297)
  } catch (err) {
    console.error('Error drawing letterhead on page', err)
  }
}

// Draw letterhead background image on the CURRENT US Legal page (215.9 x 355.6 mm)
export function drawLetterheadOnLegalPage(doc: jsPDF, base64Img: string | null) {
  if (!base64Img) return
  try {
    const isJpg = base64Img.includes('image/jpeg') || base64Img.includes('image/jpg')
    doc.addImage(base64Img, isJpg ? 'JPEG' : 'PNG', 0, 0, 215.9, 355.6)
  } catch (err) {
    console.error('Error drawing legal letterhead on page', err)
  }
}

// Draw letterhead background image on all existing pages of an A4 jsPDF document
export function drawLetterheadBackground(doc: jsPDF, base64Img: string | null) {
  if (!base64Img) return
  const isJpg = base64Img.includes('image/jpeg') || base64Img.includes('image/jpg')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalPages = (doc as any).internal.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.addImage(base64Img, isJpg ? 'JPEG' : 'PNG', 0, 0, 210, 297)
  }
}

// Draw letterhead background image on all existing pages of a US Legal jsPDF document
export function drawLetterheadBackgroundLegal(doc: jsPDF, base64Img: string | null) {
  if (!base64Img) return
  const isJpg = base64Img.includes('image/jpeg') || base64Img.includes('image/jpg')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalPages = (doc as any).internal.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.addImage(base64Img, isJpg ? 'JPEG' : 'PNG', 0, 0, 215.9, 355.6)
  }
}

export interface TextOptionsWithAlign {
  align?: 'left' | 'center' | 'right'
}

/**
 * Standard uniform text rendering for plain text ordinal dates.
 * Dates flow naturally on the exact same baseline and font size as surrounding text.
 */
export function drawTextWithOrdinalSuperscript(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  options?: TextOptionsWithAlign
) {
  if (!text) return
  const cleanText = String(text)
    .replace(/ˢᵗ/g, 'st')
    .replace(/ⁿᵈ/g, 'nd')
    .replace(/ʳᵈ/g, 'rd')
    .replace(/ᵗʰ/g, 'th')
  doc.text(cleanText, x, y, options)
}

export interface KeyValueRowOptions {
  labelWidth?: number
  colonGap?: number
  fontSize?: number
  labelColor?: [number, number, number]
  valueColor?: [number, number, number]
  isBoldValue?: boolean
  isBoldLabel?: boolean
  maxWidth?: number
  lineHeight?: number
}

/**
 * Standardized key-value row renderer for jsPDF documents.
 * Renders Label at x, Colon (:) precisely at x + labelWidth, and Value at x + labelWidth + colonGap with text wrapping.
 * Returns the next Y position.
 */
export function drawAlignedKeyValueRow(
  doc: jsPDF,
  label: string,
  value: string | number | null | undefined,
  x: number,
  y: number,
  options: KeyValueRowOptions = {}
): number {
  if (value === undefined || value === null || value === '') return y

  const labelWidth = options.labelWidth ?? 25 // 25mm (~70pt)
  const colonGap = options.colonGap ?? 2 // 2mm gap after colon
  const fontSize = options.fontSize ?? 8.5
  const labelColor = options.labelColor ?? [71, 85, 105] // slate-600
  const valueColor = options.valueColor ?? [15, 23, 42] // slate-900
  const isBoldValue = options.isBoldValue ?? true
  const isBoldLabel = options.isBoldLabel ?? false
  const maxWidth = options.maxWidth ?? 65 // max width for value wrapping
  const lineHeight = options.lineHeight ?? 4.0 // mm per line

  doc.setFontSize(fontSize)

  // 1. Draw Label
  if (isBoldLabel) {
    doc.setFont('helvetica', 'bold')
  } else {
    doc.setFont('helvetica', 'normal')
  }
  doc.setTextColor(labelColor[0], labelColor[1], labelColor[2])
  doc.text(label, x, y)

  // 2. Draw Colon (:) aligned precisely at x + labelWidth
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(labelColor[0], labelColor[1], labelColor[2])
  doc.text(':', x + labelWidth, y)

  // 3. Draw Value aligned at x + labelWidth + colonGap
  if (isBoldValue) {
    doc.setFont('helvetica', 'bold')
  } else {
    doc.setFont('helvetica', 'normal')
  }
  doc.setTextColor(valueColor[0], valueColor[1], valueColor[2])

  let valStr = String(value ?? '')
  valStr = valStr
    .replace(/ˢᵗ/g, 'st')
    .replace(/ⁿᵈ/g, 'nd')
    .replace(/ʳᵈ/g, 'rd')
    .replace(/ᵗʰ/g, 'th')

  const valX = x + labelWidth + colonGap

  // Wrap long text within maxWidth
  const splitValue = doc.splitTextToSize(valStr, maxWidth)
  doc.text(splitValue, valX, y)

  const numLines = Array.isArray(splitValue) ? splitValue.length : 1
  return y + (numLines * lineHeight)
}

/**
 * Helper to render the standardized PREPARED BY block with optional e-signature image.
 */
export function drawPreparedBySection(
  doc: jsPDF,
  title: string = 'PREPARED BY:',
  preparerName: string = 'Rashanthi Gunasekara',
  preparerDesignation: string = 'Director',
  companyName: string = 'THENNAKOON TOURS (PVT) LTD',
  x: number,
  y: number,
  signatureBase64OrUrl?: string | null
): number {
  let currentY = y

  // 1. Heading
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(153, 119, 17) // Brand Gold #997711
  doc.text(title, x, currentY)
  currentY += 4.5

  // 2. E-Signature Image (if available)
  if (signatureBase64OrUrl && typeof signatureBase64OrUrl === 'string' && signatureBase64OrUrl.trim()) {
    try {
      const imgWidth = 32
      const imgHeight = 12
      const isJpg = signatureBase64OrUrl.includes('image/jpeg') || signatureBase64OrUrl.includes('image/jpg')
      doc.addImage(signatureBase64OrUrl, isJpg ? 'JPEG' : 'PNG', x, currentY, imgWidth, imgHeight)
      currentY += imgHeight + 2
    } catch (err) {
      console.warn('[PDF Engine] Could not embed signature image:', err)
    }
  }

  // 3. Preparer Name
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  doc.setTextColor(15, 23, 42)
  doc.text(preparerName, x, currentY)
  currentY += 4.0

  // 4. Designation & Company
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(100, 116, 139)
  if (preparerDesignation) {
    doc.text(preparerDesignation, x, currentY)
    currentY += 3.6
  }
  doc.text(companyName, x, currentY)
  currentY += 4.0

  return currentY
}

export { autoTable }
