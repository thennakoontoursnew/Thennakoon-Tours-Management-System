import { jsPDF, autoTable, getLetterheadBase64, drawLetterheadOnPage, drawTextWithOrdinalSuperscript, drawAlignedKeyValueRow, drawPreparedBySection, A4_MARGINS } from './pdf-engine'
import { normalizeNewlines, formatDateOrdinal, formatRentalPeriodOrdinal } from '@/lib/utils/formatters'
import { setPdfBrandGoldText, PDF_COLORS } from './pdf-theme'
import { COMPANY_CONFIG } from '../company-config'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function generateQuotationPDF(quotation: any, companySettings?: any) {
  const doc = new jsPDF('p', 'mm', 'a4')
  const base64Letterhead = await getLetterheadBase64(companySettings)

  // 1. Draw Letterhead Background FIRST on Page 1 (Layer 0)
  if (base64Letterhead) {
    drawLetterheadOnPage(doc, base64Letterhead)
  }

  // 2. Explicitly Set Dark Text Color & Starting Position
  doc.setTextColor(17, 17, 17) // #111111 Black
  let currentY = 38 // Compact top position within safe letterhead area

  // Helper for multi-page overflow (only triggered for genuinely long content)
  const ensureSpace = (requiredHeight: number) => {
    if (currentY + requiredHeight > A4_MARGINS.bottom) {
      doc.addPage()
      if (base64Letterhead) {
        drawLetterheadOnPage(doc, base64Letterhead)
      }
      currentY = A4_MARGINS.top
    }
  }
  const checkPageOverflow = ensureSpace

  // 1. Header Title & Quotation Metadata Box
  const titleCardHeight = 12
  doc.setFillColor(248, 250, 252) // Slate-50
  doc.setDrawColor(226, 232, 240) // Light Slate Border
  doc.roundedRect(A4_MARGINS.left, currentY, A4_MARGINS.width, titleCardHeight, 2, 2, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  setPdfBrandGoldText(doc) // Brand Gold #997711
  doc.text('OFFICIAL QUOTATION', A4_MARGINS.left + 5, currentY + 8)

  doc.setFontSize(10.5)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(15, 23, 42)
  doc.text(`Quotation No.: #${quotation.quotation_number || 'QT-10001'}`, A4_MARGINS.right - 5, currentY + 8, { align: 'right' })

  currentY += titleCardHeight + 5

  // 2. Customer Information Grid Table (Perfect Column & Row Alignment)
  const customer = quotation.customer || {}
  const cardHeight = 26
  doc.setFillColor(248, 250, 252) // Slate-50 background
  doc.setDrawColor(226, 232, 240) // Light border
  doc.roundedRect(A4_MARGINS.left, currentY, A4_MARGINS.width, cardHeight, 3, 3, 'FD')

  // Fixed Grid Coordinates
  const leftLabelX = A4_MARGINS.left + 5
  const rightLabelX = A4_MARGINS.left + 95

  let leftY = currentY + 6.0
  let rightY = currentY + 6.0

  leftY = drawAlignedKeyValueRow(doc, 'QUOTATION TO', customer.full_name || 'Valued Customer', leftLabelX, leftY, { labelWidth: 26, isBoldLabel: true, maxWidth: 60 })
  leftY = drawAlignedKeyValueRow(doc, 'Mobile', customer.mobile || customer.phone || 'N/A', leftLabelX, leftY, { labelWidth: 26, maxWidth: 60 })
  leftY = drawAlignedKeyValueRow(doc, 'NIC / Passport', customer.nic || customer.passport_number || 'N/A', leftLabelX, leftY, { labelWidth: 26, maxWidth: 60 })

  rightY = drawAlignedKeyValueRow(doc, 'Quotation Date', formatDateOrdinal(quotation.quotation_date) || 'N/A', rightLabelX, rightY, { labelWidth: 26, maxWidth: 55 })
  rightY = drawAlignedKeyValueRow(doc, 'Rental Period', formatRentalPeriodOrdinal(quotation.rental_start_date, quotation.rental_end_date), rightLabelX, rightY, { labelWidth: 26, maxWidth: 55 })
  rightY = drawAlignedKeyValueRow(doc, 'Destination', quotation.destination || 'As requested', rightLabelX, rightY, { labelWidth: 26, maxWidth: 55 })

  currentY += Math.max(leftY - currentY, rightY - currentY, cardHeight) + 5

  // 3. Vehicle Table (9.5pt Header & Body, Centered Numeric Values)
  const tableHead = [['#', 'Description', 'Days', 'Rate (LKR)', 'Amount (LKR)']]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tableRows = (quotation.items || []).map((item: any, idx: number) => [
    idx + 1,
    `${item.description}${item.vehicle_name_snapshot ? ` (${item.vehicle_name_snapshot})` : ''}`,
    item.number_of_days,
    Number(item.unit_rate).toLocaleString('en-US', { minimumFractionDigits: 2 }),
    Number(item.line_total).toLocaleString('en-US', { minimumFractionDigits: 2 }),
  ])

  autoTable(doc, {
    startY: currentY,
    head: tableHead,
    body: tableRows,
    margin: { left: A4_MARGINS.left, right: 210 - A4_MARGINS.right },
    styles: { fontSize: 9.5, cellPadding: 2.5, textColor: [34, 34, 34], valign: 'middle' },
    headStyles: { fillColor: [23, 23, 26], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9.5, halign: 'center', valign: 'middle' },
    columnStyles: {
      0: { halign: 'center', valign: 'middle' },
      1: { halign: 'left', valign: 'middle' },
      2: { halign: 'center', valign: 'middle' },
      3: { halign: 'center', valign: 'middle' },
      4: { halign: 'center', valign: 'middle' },
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    willDrawPage: (data) => {
      if (base64Letterhead && data.pageNumber > 1) {
        drawLetterheadOnPage(doc, base64Letterhead)
      }
    },
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  currentY = (doc as any).lastAutoTable.finalY + 5

  // 4. Structured Totals Block (Right Aligned Card with 14pt Bold Amber Grand Total)
  const totalsCardWidth = 80
  const totalsX = A4_MARGINS.right - totalsCardWidth
  doc.setFontSize(9.5)

  doc.setFont('helvetica', 'normal')
  doc.setTextColor(34, 34, 34)
  doc.text('Subtotal:', totalsX, currentY)
  doc.text(`LKR ${Number(quotation.subtotal).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, A4_MARGINS.right, currentY, { align: 'right' })
  currentY += 4.5

  if (Number(quotation.discount_amount) > 0) {
    doc.text('Discount:', totalsX, currentY)
    doc.text(`- LKR ${Number(quotation.discount_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, A4_MARGINS.right, currentY, { align: 'right' })
    currentY += 4.5
  }

  if (Number(quotation.refundable_deposit) > 0) {
    doc.text('Refundable Deposit:', totalsX, currentY)
    doc.text(`+ LKR ${Number(quotation.refundable_deposit).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, A4_MARGINS.right, currentY, { align: 'right' })
    currentY += 4.5
  }

  // Divider line above Grand Total
  doc.setDrawColor(203, 213, 225)
  doc.line(totalsX, currentY, A4_MARGINS.right, currentY)
  currentY += 5

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14) // Prominent 14pt Bold
  setPdfBrandGoldText(doc) // Brand Gold #997711
  doc.text('GRAND TOTAL:', totalsX, currentY)
  doc.text(`LKR ${Number(quotation.grand_total).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, A4_MARGINS.right, currentY, { align: 'right' })

  currentY += 7

  // 5. SPECIAL NOTES (Minimal Corporate Bordered Layout)
  const specialNotesText = normalizeNewlines(
    quotation.special_notes || companySettings?.default_special_notes || COMPANY_CONFIG.defaultInvoiceSpecialNotes
  )
  if (specialNotesText.trim()) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    const splitNotes = doc.splitTextToSize(specialNotesText, A4_MARGINS.width)
    const requiredH = splitNotes.length * 4 + 12
    ensureSpace(requiredH)

    // Heading Strip (1px Thin Border)
    doc.setDrawColor(PDF_COLORS.border.rgb[0], PDF_COLORS.border.rgb[1], PDF_COLORS.border.rgb[2])
    doc.setLineWidth(0.3)
    doc.rect(A4_MARGINS.left, currentY, A4_MARGINS.width, 6, 'S')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9.5)
    setPdfBrandGoldText(doc) // Brand Gold #997711
    doc.text('SPECIAL NOTES', A4_MARGINS.left + 3, currentY + 4.2)
    currentY += 6 + 4 // Heading strip -> Body spacing: 4 mm

    // Body Text
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(17, 17, 17)
    doc.text(splitNotes, A4_MARGINS.left, currentY)
    currentY += splitNotes.length * 4 + 7 // Body -> Next section spacing: 7 mm
  }

  // 6. IMPORTANT TERMS (Minimal Corporate Bordered Layout)
  const importantMsg = normalizeNewlines(
    quotation.important_message || quotation.terms_and_conditions || companySettings?.default_quotation_terms || companySettings?.default_invoice_terms || COMPANY_CONFIG.defaultInvoiceImportantTerms
  )
  if (importantMsg.trim()) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    const splitMsg = doc.splitTextToSize(importantMsg, A4_MARGINS.width)
    const requiredH = splitMsg.length * 4 + 12
    ensureSpace(requiredH)

    // Heading Strip (1px Thin Border)
    doc.setDrawColor(PDF_COLORS.border.rgb[0], PDF_COLORS.border.rgb[1], PDF_COLORS.border.rgb[2])
    doc.setLineWidth(0.3)
    doc.rect(A4_MARGINS.left, currentY, A4_MARGINS.width, 6, 'S')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9.5)
    setPdfBrandGoldText(doc) // Brand Gold #997711
    doc.text('IMPORTANT TERMS & CONDITIONS', A4_MARGINS.left + 3, currentY + 4.2)
    currentY += 6 + 4 // Heading strip -> Body spacing: 4 mm

    // Body Text
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(17, 17, 17)
    doc.text(splitMsg, A4_MARGINS.left, currentY)
    currentY += splitMsg.length * 4 + 7 // Body -> Next section spacing: 7 mm
  }

  // 7. PAYMENT & BANK DETAILS (Simple Rectangular Box, Thin Border)
  const bankAccName = quotation.bank_account_name_snapshot || companySettings?.bank_account_name || 'Thennakoon Tours (Pvt) Ltd'
  const bankName = quotation.bank_name_snapshot || companySettings?.bank_name || 'Nations Trust Bank'
  const bankBranch = quotation.bank_branch_snapshot || companySettings?.bank_branch || 'Nugegoda'
  const bankAccNum = quotation.bank_account_number_snapshot || companySettings?.bank_account_number || '100530013140'
  const bankSwift = quotation.bank_swift_code_snapshot || companySettings?.bank_swift_code || 'NTBCLKLX'

  const bankBoxWidth = 110
  const bankBoxHeight = 28
  ensureSpace(bankBoxHeight + 25)

  const bankBoxStartY = currentY
  doc.setDrawColor(PDF_COLORS.border.rgb[0], PDF_COLORS.border.rgb[1], PDF_COLORS.border.rgb[2])
  doc.setLineWidth(0.3)
  doc.rect(A4_MARGINS.left, bankBoxStartY, bankBoxWidth, bankBoxHeight, 'S')

  let bY = bankBoxStartY + 5
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  setPdfBrandGoldText(doc) // Brand Gold #997711
  doc.text('PAYMENT & BANK DETAILS', A4_MARGINS.left + 4, bY)

  bY += 5
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(17, 17, 17)
  doc.text(bankAccName, A4_MARGINS.left + 4, bY)

  bY += 4.5
  doc.setFont('helvetica', 'bold')
  doc.text(`Account # ${bankAccNum}`, A4_MARGINS.left + 4, bY)

  bY += 4.5
  doc.setFont('helvetica', 'normal')
  doc.text(`${bankName} - ${bankBranch}`, A4_MARGINS.left + 4, bY)

  bY += 4.5
  doc.text(`Swift Code : ${bankSwift}`, A4_MARGINS.left + 4, bY)

  currentY = bankBoxStartY + bankBoxHeight + 6 // Bank Details -> Prepared By: 6 mm

  // 8. PREPARED BY BLOCK
  const prepName = quotation.prepared_by_name_snapshot || quotation.prepared_by_profile?.full_name || 'Rashanthi Gunasekara'
  const prepDesignation = quotation.prepared_by_designation_snapshot || 'Director'
  const companyName = quotation.company_name_snapshot || COMPANY_CONFIG.name
  const signatureUrl = quotation.prepared_by_profile?.signature_url || companySettings?.signature_url

  drawPreparedBySection(
    doc,
    'PREPARED BY:',
    prepName,
    prepDesignation,
    companyName,
    A4_MARGINS.left,
    currentY,
    signatureUrl
  )

  return doc
}
