import { jsPDF, A4_MARGINS, getLetterheadBase64, drawLetterheadOnPage } from './pdf-engine'
import { formatCurrency, formatDateOrdinal } from '@/lib/utils/formatters'
import { parseExtensionLetterBlocks } from '@/lib/agreements/extension-template-renderer'

function markdownToRichSegments(text: string): TextSegment[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  const segments: TextSegment[] = []
  for (const part of parts) {
    if (!part) continue
    if (part.startsWith('**') && part.endsWith('**')) {
      segments.push({ text: part.slice(2, -2), bold: true })
    } else {
      segments.push({ text: part.replace(/\*([^*]+)\*/g, '$1'), bold: false })
    }
  }
  return segments
}

interface LoadedImage {
  dataUrl: string
  format: 'PNG' | 'JPEG'
  width: number
  height: number
}

interface TextSegment {
  text: string
  bold?: boolean
}

async function loadImageAsset(url?: string | null): Promise<LoadedImage | null> {
  if (!url || typeof window === 'undefined') return null
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const blob = await res.blob()
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(String(reader.result || ''))
      reader.onerror = () => reject(new Error('Failed to read image blob'))
      reader.readAsDataURL(blob)
    })

    const dims = await new Promise<{ width: number; height: number }>((resolve) => {
      const img = new window.Image()
      img.onload = () => resolve({ width: img.naturalWidth || 300, height: img.naturalHeight || 120 })
      img.onerror = () => resolve({ width: 300, height: 120 })
      img.src = dataUrl
    })

    const format = dataUrl.includes('image/jpeg') || dataUrl.includes('image/jpg') ? 'JPEG' : 'PNG'
    return { dataUrl, format, width: dims.width, height: dims.height }
  } catch {
    return null
  }
}

function drawRichParagraph(
  doc: jsPDF,
  segments: TextSegment[],
  x: number,
  startY: number,
  maxWidth: number,
  lineHeight: number
): number {
  const words: Array<{ text: string; bold: boolean; newline?: boolean }> = []
  for (const seg of segments) {
    const subLines = seg.text.split(/\n/)
    subLines.forEach((lineText, idx) => {
      if (idx > 0) words.push({ text: '\n', bold: false, newline: true })
      const parts = lineText.split(/(\s+)/)
      for (const part of parts) {
        if (part.length > 0) {
          words.push({ text: part, bold: Boolean(seg.bold) })
        }
      }
    })
  }

  const lines: Array<Array<{ text: string; bold: boolean }>> = []
  let currentLine: Array<{ text: string; bold: boolean }> = []
  let currentWidth = 0

  for (const token of words) {
    if (token.newline) {
      while (currentLine.length > 0 && /^\s+$/.test(currentLine[currentLine.length - 1].text)) {
        currentLine.pop()
      }
      lines.push(currentLine)
      currentLine = []
      currentWidth = 0
      continue
    }

    const isWhitespace = /^\s+$/.test(token.text)
    if (isWhitespace && currentLine.length === 0) continue

    doc.setFont('helvetica', token.bold ? 'bold' : 'normal')
    const tokenWidth = doc.getTextWidth(token.text)

    if (!isWhitespace && currentWidth + tokenWidth > maxWidth && currentLine.length > 0) {
      while (currentLine.length > 0 && /^\s+$/.test(currentLine[currentLine.length - 1].text)) {
        currentLine.pop()
      }
      lines.push(currentLine)
      currentLine = [token]
      currentWidth = tokenWidth
    } else {
      currentLine.push(token)
      currentWidth += tokenWidth
    }
  }
  if (currentLine.length > 0) {
    while (currentLine.length > 0 && /^\s+$/.test(currentLine[currentLine.length - 1].text)) {
      currentLine.pop()
    }
    if (currentLine.length > 0) lines.push(currentLine)
  }

  let y = startY
  for (const line of lines) {
    let cursorX = x
    for (const token of line) {
      doc.setFont('helvetica', token.bold ? 'bold' : 'normal')
      doc.text(token.text, cursorX, y)
      cursorX += doc.getTextWidth(token.text)
    }
    y += lineHeight
  }

  return y
}

export function buildExtensionPdfFilename(extension: any): string {
  const reg = (extension?.vehicle_reg_no || 'Vehicle')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
  const recipient = (extension?.recipient_name || 'Recipient')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `Extension-Letter-${reg || 'Vehicle'}-${recipient || 'Agreement'}.pdf`
}

export async function generateExtensionLetterPDF(
  extension: any,
  companySettings?: Record<string, any> | null
): Promise<jsPDF> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const letterheadB64 = await getLetterheadBase64(companySettings)
  if (letterheadB64) {
    drawLetterheadOnPage(doc, letterheadB64)
  }

  const [signatureImg, sealImg, recipientSigImg] = await Promise.all([
    loadImageAsset(extension?.issued_by_signature_url),
    loadImageAsset(companySettings?.company_seal_url),
    loadImageAsset(extension?.recipient_signature_url),
  ])

  const left = 18
  const right = 192
  const contentWidth = right - left
  const companyName = companySettings?.company_name || 'Thennakoon Tours (Pvt) Ltd'
  const regNo = extension?.vehicle_reg_no || 'N/A'
  const origRef = extension?.original_agreement_ref || 'Original Agreement'
  const isOwner = extension?.agreement_type === 'owner'
  const isIndefinite = extension?.extension_period_type === 'until_further_notice'
  const durationLabel = extension?.extension_duration_label || 'further term'
  const newEndFormatted = formatDateOrdinal(extension?.new_end_date) || 'N/A'
  const amountFormatted =
    extension?.renewal_amount && Number(extension.renewal_amount) > 0
      ? formatCurrency(extension.renewal_amount, extension?.currency || 'LKR')
      : null

  let y = 44

  const hasLockedSnapshot =
    (Array.isArray(extension?.rendered_sections_snapshot) &&
      extension.rendered_sections_snapshot.length > 0) ||
    Boolean(extension?.rendered_content_snapshot)

  if (hasLockedSnapshot) {
    const blocks = parseExtensionLetterBlocks(
      extension?.rendered_sections_snapshot,
      extension?.rendered_content_snapshot
    )

    for (const block of blocks) {
      if (block.type === 'ref_date_row') {
        doc.setTextColor(15, 23, 42)
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.text(block.left.replace(/\*\*/g, ''), left, y)
        doc.text(block.right.replace(/\*\*/g, ''), right, y, { align: 'right' })
        doc.setDrawColor(203, 213, 225)
        doc.setLineWidth(0.25)
        doc.line(left, y + 2.2, right, y + 2.2)
        y += 8.5
        continue
      }

      if (block.type === 'subject') {
        y += 2
        const cleanSubject = block.text.replace(/\*\*/g, '').toUpperCase()
        doc.setTextColor(15, 23, 42)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(10.5)
        const subjectLines = doc.splitTextToSize(cleanSubject, contentWidth)
        doc.text(subjectLines, left, y)
        const firstLineWidth = Math.min(doc.getTextWidth(subjectLines[0] || ''), contentWidth)
        doc.setDrawColor(15, 23, 42)
        doc.setLineWidth(0.35)
        doc.line(left, y + 1.4, left + firstLineWidth, y + 1.4)
        y += subjectLines.length * 5.2 + 5.5
        continue
      }

      if (block.type === 'note') {
        doc.setFontSize(9.5)
        doc.setTextColor(30, 41, 59)
        const startNoteY = y
        const endNoteY = drawRichParagraph(
          doc,
          markdownToRichSegments(block.text),
          left + 3.5,
          startNoteY,
          contentWidth - 3.5,
          5.6
        )
        doc.setDrawColor(148, 163, 184)
        doc.setLineWidth(0.7)
        doc.line(left + 0.5, startNoteY - 2.8, left + 0.5, Math.max(startNoteY, endNoteY - 2.8))
        y = endNoteY + 6
        continue
      }

      const isGreeting = /^To\s*:/i.test(block.text) || /^Dear\s+/i.test(block.text)
      doc.setFontSize(10)
      doc.setTextColor(isGreeting ? 15 : 30, isGreeting ? 23 : 41, isGreeting ? 42 : 59)
      y = drawRichParagraph(
        doc,
        markdownToRichSegments(block.text),
        left,
        y,
        contentWidth,
        6.5
      )
      y += 6
    }
  } else {
    // Legacy fallback for extensions created prior to editable master templates
    doc.setTextColor(15, 23, 42)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text(`Ref: ${extension?.extension_number || 'EXT'}`, left, y)
    doc.text(`Date: ${formatDateOrdinal(extension?.issue_date) || 'N/A'}`, right, y, { align: 'right' })

    y += 8.5
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text(`To: ${extension?.recipient_name || ''}`, left, y)

    y += 9
    const subjectText = isOwner
      ? `RE: EXTENSION OF VEHICLE OWNER AGREEMENT – VEHICLE NO: ${regNo}`
      : `RE: EXTENSION OF VEHICLE RENTAL AGREEMENT – VEHICLE NO: ${regNo}`

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10.5)
    const subjectLines = doc.splitTextToSize(subjectText, contentWidth)
    doc.text(subjectLines, left, y)
    const firstLineWidth = Math.min(doc.getTextWidth(subjectLines[0] || ''), contentWidth)
    doc.setDrawColor(15, 23, 42)
    doc.setLineWidth(0.35)
    doc.line(left, y + 1.4, left + firstLineWidth, y + 1.4)
    y += subjectLines.length * 5.2 + 5.5

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text(`Dear ${extension?.recipient_name || 'Sir / Madam'},`, left, y)
    y += 8

    doc.setFontSize(10)
    doc.setTextColor(30, 41, 59)

    if (isOwner) {
      y = drawRichParagraph(
        doc,
        [
          { text: 'This letter formally confirms the mutual extension of the Vehicle Owner Agreement between ' },
          { text: companyName, bold: true },
          { text: ' and ' },
          { text: extension?.recipient_name || 'the Vehicle Owner', bold: true },
          { text: ' regarding the vehicle bearing registration number ' },
          { text: regNo, bold: true },
          { text: ' (Reference Agreement No. ' },
          { text: origRef, bold: true },
          { text: ').' },
        ],
        left,
        y,
        contentWidth,
        6.5
      )
    } else {
      y = drawRichParagraph(
        doc,
        [
          { text: 'We are pleased to confirm the extension of your vehicle rental agreement with ' },
          { text: companyName, bold: true },
          { text: ' for the vehicle bearing registration number ' },
          { text: regNo, bold: true },
          { text: ' (originally commenced under Agreement No. ' },
          { text: origRef, bold: true },
          { text: ').' },
        ],
        left,
        y,
        contentWidth,
        6.5
      )
    }

    y += 6

    const para2Segments: TextSegment[] = []
    if (isOwner) {
      if (isIndefinite) {
        para2Segments.push(
          { text: 'Both parties have mutually agreed to extend the operational engagement of the above vehicle ' },
          { text: 'until further notice', bold: true },
          { text: '.' }
        )
      } else {
        para2Segments.push(
          { text: 'Both parties have mutually agreed to extend the operational engagement of the above vehicle for a further period of ' },
          { text: durationLabel, bold: true },
          { text: ' until ' },
          { text: newEndFormatted, bold: true },
          { text: '.' }
        )
      }
      if (amountFormatted) {
        para2Segments.push(
          { text: ' The agreed monthly owner rental amount during the extended term shall be ' },
          { text: amountFormatted, bold: true },
          { text: '.' }
        )
      }
    } else {
      if (isIndefinite) {
        para2Segments.push(
          { text: 'By mutual consent, the rental period is hereby extended ' },
          { text: 'until further notice', bold: true },
          { text: ', effective immediately following the original expiry date.' }
        )
      } else {
        para2Segments.push(
          { text: 'By mutual consent, the rental period is hereby extended for a further period of ' },
          { text: durationLabel, bold: true },
          { text: ', with the revised rental end date now set as ' },
          { text: newEndFormatted, bold: true },
          { text: '.' }
        )
      }
      if (amountFormatted) {
        para2Segments.push(
          { text: ' The agreed renewal/periodic rental charge shall be ' },
          { text: amountFormatted, bold: true },
          { text: '.' }
        )
      }
    }

    y = drawRichParagraph(doc, para2Segments, left, y, contentWidth, 6.5)
    y += 6

    const para3Text = isOwner
      ? 'All original terms, conditions, revenue-share / monthly payment schedules, mileage limits, and maintenance responsibilities set out in the principal Vehicle Owner Agreement shall remain binding throughout the extended tenure.'
      : 'All other terms, conditions, security deposit provisions, insurance obligations, and covenants stated in the original Vehicle Rental Agreement shall remain unchanged and continue in full force and effect during this extended period.'

    y = drawRichParagraph(doc, [{ text: para3Text }], left, y, contentWidth, 6.5)
    y += 6

    if (extension?.custom_notes) {
      y = drawRichParagraph(
        doc,
        [
          { text: isOwner ? 'Special Notes: ' : 'Additional Notes / Agreed Terms: ', bold: true },
          { text: String(extension.custom_notes) },
        ],
        left,
        y,
        contentWidth,
        5.6
      )
      y += 6
    }

    y = drawRichParagraph(
      doc,
      [
        {
          text: 'Kindly sign and return a copy of this letter as your formal acknowledgment and acceptance of this extension.',
        },
      ],
      left,
      y,
      contentWidth,
      6.5
    )
  }

  // Signature & Seal Block anchored near bottom of letter above footer (clears >= 56mm bottom margin / ~241mm Y)
  const sigTopY = Math.min(Math.max(y + 6, 210), 214)
  const leftColX = left
  const rightColX = 112

  doc.setFontSize(8.5)
  doc.setTextColor(71, 85, 105)
  doc.setFont('helvetica', 'normal')
  doc.text('Issued For & On Behalf of', leftColX, sigTopY)
  doc.text('Acknowledged & Accepted By', rightColX, sigTopY)

  doc.setFontSize(9)
  doc.setTextColor(15, 23, 42)
  doc.setFont('helvetica', 'bold')
  doc.text(companyName, leftColX, sigTopY + 4.2)
  doc.text(isOwner ? 'Vehicle Owner' : 'Customer / Authorized Signatory', rightColX, sigTopY + 4.2)

  // Signature line sits 18mm below sigTopY, finishing the entire block cleanly around 240mm
  const lineY = Math.min(sigTopY + 18, 229)

  // Render Staff Digital Signature (height ~12.5mm) & Official Company Seal (height ~15mm)
  let sealOffsetX = leftColX
  if (signatureImg) {
    const maxH = 12.5
    const maxW = 48
    const ratio = Math.min(maxW / signatureImg.width, maxH / signatureImg.height)
    const drawW = signatureImg.width * ratio
    const drawH = signatureImg.height * ratio
    doc.addImage(
      signatureImg.dataUrl,
      signatureImg.format,
      leftColX,
      lineY - drawH - 1.2,
      drawW,
      drawH
    )
    sealOffsetX = Math.max(leftColX + drawW - 3, leftColX + 34)
  }

  if (sealImg) {
    const maxSeal = 15
    const ratio = Math.min(maxSeal / sealImg.width, maxSeal / sealImg.height)
    const drawW = sealImg.width * ratio
    const drawH = sealImg.height * ratio
    doc.addImage(sealImg.dataUrl, sealImg.format, sealOffsetX, lineY - drawH - 0.5, drawW, drawH)
  }

  // Render Recipient Saved E-Signature above right-hand signature line if included
  if (recipientSigImg) {
    const maxH = 12.5
    const maxW = 48
    const ratio = Math.min(maxW / recipientSigImg.width, maxH / recipientSigImg.height)
    const drawW = recipientSigImg.width * ratio
    const drawH = recipientSigImg.height * ratio
    doc.addImage(
      recipientSigImg.dataUrl,
      recipientSigImg.format,
      rightColX,
      lineY - drawH - 1.2,
      drawW,
      drawH
    )
  }

  doc.setDrawColor(100, 116, 139)
  doc.setLineWidth(0.3)
  doc.setLineDashPattern([1, 1], 0)
  doc.line(leftColX, lineY, leftColX + 74, lineY)
  doc.line(rightColX, lineY, rightColX + 74, lineY)
  doc.setLineDashPattern([], 0)

  const rawDesignation = String(extension?.issued_by_designation || 'Management').trim()
  const formattedDesignation = rawDesignation.replace(/\b\w/g, (ch) => ch.toUpperCase())

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(15, 23, 42)
  doc.text(extension?.issued_by_name || 'Authorized Officer', leftColX, lineY + 4)
  doc.text(extension?.recipient_name || (isOwner ? 'Vehicle Owner' : 'Customer'), rightColX, lineY + 4)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.2)
  doc.setTextColor(71, 85, 105)
  doc.text(formattedDesignation, leftColX, lineY + 8)
  doc.text('Signature', rightColX, lineY + 8)
  doc.text('Date / NIC: ________________________', rightColX, lineY + 12)

  return doc
}
