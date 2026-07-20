import { jsPDF, autoTable, getLetterheadBase64, drawLetterheadOnPage, A4_MARGINS } from './pdf-engine'
import { normalizeNewlines } from '@/lib/utils/formatters'

export async function generateQuotationPDF(quotation: any, companySettings?: any) {
  const doc = new jsPDF('p', 'mm', 'a4')
  const base64Letterhead = await getLetterheadBase64()

  // 1. Draw Letterhead Background FIRST on Page 1 (Layer 0)
  if (base64Letterhead) {
    drawLetterheadOnPage(doc, base64Letterhead)
  }

  // 2. Explicitly Set Dark Text Color & Starting Position
  doc.setTextColor(17, 17, 17) // #111111 Black
  let currentY = 38 // Compact top position within safe letterhead area

  // Helper for multi-page overflow (only triggered for genuinely long content)
  const ensureSpace = (requiredHeight: number) => {
    if (currentY + requiredHeight > 255) {
      doc.addPage()
      if (base64Letterhead) {
        drawLetterheadOnPage(doc, base64Letterhead)
      }
      doc.setTextColor(17, 17, 17)
      currentY = 38
    }
  }

  // 1. QUOTATION Title in a White Rounded Card
  const titleCardHeight = 13
  doc.setFillColor(255, 255, 255) // White background card
  doc.setDrawColor(203, 213, 225) // 1px Light Gray border
  doc.roundedRect(A4_MARGINS.left, currentY, A4_MARGINS.width, titleCardHeight, 4, 4, 'FD')

  // Title Text (Black 18pt Bold)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(17, 17, 17) // #111111 Black
  doc.text('QUOTATION', A4_MARGINS.left + 5, currentY + 9)

  // Reference Text (9.5pt Slate-600)
  doc.setFontSize(9.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(71, 85, 105)
  doc.text(`Ref: ${quotation.quotation_number}`, A4_MARGINS.right - 5, currentY + 8.5, { align: 'right' })

  currentY += titleCardHeight + 5

  // 2. Customer Information Grid Table (Perfect Column & Row Alignment)
  const customer = quotation.customer || {}
  const cardHeight = 26
  doc.setFillColor(248, 250, 252) // Slate-50 background
  doc.setDrawColor(226, 232, 240) // Light border
  doc.roundedRect(A4_MARGINS.left, currentY, A4_MARGINS.width, cardHeight, 3, 3, 'FD')

  // Fixed Grid Coordinates
  const leftLabelX = A4_MARGINS.left + 5
  const leftValueX = A4_MARGINS.left + 35
  const rightLabelX = A4_MARGINS.left + 95
  const rightValueX = A4_MARGINS.left + 130

  let rowY = currentY + 6.5

  // Row 1
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(71, 85, 105)
  doc.text('TO:', leftLabelX, rowY)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(34, 34, 34) // #222222
  doc.text(customer.full_name || 'Valued Customer', leftValueX, rowY)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(71, 85, 105)
  doc.text('Quotation Date:', rightLabelX, rowY)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  doc.setTextColor(34, 34, 34)
  doc.text(quotation.quotation_date || 'N/A', rightValueX, rowY)

  // Row 2
  rowY += 6.5
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(71, 85, 105)
  doc.text('Mobile:', leftLabelX, rowY)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  doc.setTextColor(34, 34, 34)
  doc.text(customer.mobile || customer.phone || 'N/A', leftValueX, rowY)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(71, 85, 105)
  doc.text('Rental Period:', rightLabelX, rowY)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  doc.setTextColor(34, 34, 34)
  doc.text(`${quotation.rental_start_date} – ${quotation.rental_end_date}`, rightValueX, rowY)

  // Row 3
  rowY += 6.5
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(71, 85, 105)
  doc.text('NIC / Passport:', leftLabelX, rowY)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  doc.setTextColor(34, 34, 34)
  doc.text(customer.nic || customer.passport_number || 'N/A', leftValueX, rowY)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(71, 85, 105)
  doc.text('Route / Destination:', rightLabelX, rowY)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  doc.setTextColor(34, 34, 34)
  const destText = doc.splitTextToSize(quotation.destination || 'As requested', 50)
  doc.text(destText, rightValueX, rowY)

  currentY += cardHeight + 5

  // 3. Vehicle Table
  const tableHead = [['#', 'Description', 'Days', 'Rate (LKR)', 'Amount (LKR)']]
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
    styles: { fontSize: 8.5, cellPadding: 2, textColor: [34, 34, 34] },
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    willDrawPage: (data) => {
      if (base64Letterhead && data.pageNumber > 1) {
        drawLetterheadOnPage(doc, base64Letterhead)
      }
    },
  })

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
  doc.setTextColor(217, 119, 6) // Amber #D97706
  doc.text('GRAND TOTAL:', totalsX, currentY)
  doc.text(`LKR ${Number(quotation.grand_total).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, A4_MARGINS.right, currentY, { align: 'right' })

  currentY += 7

  // 5. SPECIAL NOTES (9pt Bold Heading, 8.5pt Body, 4mm Line Height)
  const specialNotesText = normalizeNewlines(quotation.special_notes)
  if (specialNotesText.trim()) {
    const splitNotes = doc.splitTextToSize(specialNotesText, A4_MARGINS.width)
    const requiredH = splitNotes.length * 4 + 7
    ensureSpace(requiredH)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(17, 17, 17)
    doc.text('SPECIAL NOTES', A4_MARGINS.left, currentY)
    currentY += 4.5

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(51, 65, 85) // Slate-700
    doc.text(splitNotes, A4_MARGINS.left, currentY)
    currentY += splitNotes.length * 4 + 4
  }

  // 6. IMPORTANT (9pt Bold Heading, 8.5pt Body in Amber Box with Generous Padding)
  const importantMsg = normalizeNewlines(quotation.important_message)
  if (importantMsg.trim()) {
    const splitMsg = doc.splitTextToSize(importantMsg, A4_MARGINS.width - 8)
    const boxHeight = Math.max(10, splitMsg.length * 4 + 6)
    ensureSpace(boxHeight + 7)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(180, 83, 9)
    doc.text('IMPORTANT', A4_MARGINS.left, currentY)
    currentY += 4.5

    doc.setFillColor(254, 243, 199) // Amber-100
    doc.setDrawColor(245, 158, 11) // Amber-500
    doc.roundedRect(A4_MARGINS.left, currentY, A4_MARGINS.width, boxHeight, 2, 2, 'FD')

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(120, 53, 15)
    doc.text(splitMsg, A4_MARGINS.left + 4, currentY + 4.5)
    currentY += boxHeight + 5
  }

  // 7. BANK DETAILS BOX (10pt Heading, 8.5pt Labels/Values, Clean Alignment)
  const bankAccName = quotation.bank_account_name_snapshot || companySettings?.bank_account_name || 'Thennakoon Tours (Pvt) Ltd'
  const bankName = quotation.bank_name_snapshot || companySettings?.bank_name || 'Nations Trust Bank'
  const bankBranch = quotation.bank_branch_snapshot || companySettings?.bank_branch || 'Nugegoda'
  const bankAccNum = quotation.bank_account_number_snapshot || companySettings?.bank_account_number || '100530013140'
  const bankSwift = quotation.bank_swift_code_snapshot || companySettings?.bank_swift_code || 'NTBCLKLX'

  const bankBoxWidth = 95 // 95mm wide box
  const bankBoxHeight = 25
  ensureSpace(bankBoxHeight + 25)

  const bankBoxStartY = currentY
  doc.setFillColor(248, 250, 252) // Slate-50
  doc.setDrawColor(203, 213, 225) // Slate-300
  doc.roundedRect(A4_MARGINS.left, bankBoxStartY, bankBoxWidth, bankBoxHeight, 2, 2, 'FD')

  let bY = bankBoxStartY + 5
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(17, 17, 17)
  doc.text('BANK DETAILS', A4_MARGINS.left + 4, bY)

  bY += 4.2
  const renderBankRow = (label: string, value: string, isBoldValue = false) => {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(71, 85, 105)
    doc.text(label, A4_MARGINS.left + 4, bY)

    doc.setFont('helvetica', isBoldValue ? 'bold' : 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(34, 34, 34)
    doc.text(value, A4_MARGINS.left + 30, bY)
    bY += 3.8
  }

  renderBankRow('Account Name:', bankAccName)
  renderBankRow('Account Number:', bankAccNum, true)
  renderBankRow('Bank:', bankName)
  renderBankRow('Branch:', bankBranch)
  renderBankRow('Swift Code:', bankSwift)

  currentY = bankBoxStartY + bankBoxHeight + 4

  // 8. PREPARED BY BLOCK (9pt Heading, 10pt Bold Name, Text-Only - NO SIGNATURE LINE)
  const prepName = quotation.prepared_by_name_snapshot || 'Authorized Officer'
  const prepDesignation = quotation.prepared_by_designation_snapshot || 'Admin & Marketing Assistant'
  const companyName = quotation.company_name_snapshot || 'Thennakoon Tours (Pvt) Ltd'

  const prepX = A4_MARGINS.left + 4
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(71, 85, 105)
  doc.text('Prepared By:', prepX, currentY)
  currentY += 4.2

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(17, 17, 17)
  doc.text(prepName, prepX, currentY)

  currentY += 3.8
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(71, 85, 105)
  doc.text(prepDesignation, prepX, currentY)

  currentY += 3.8
  doc.text(companyName, prepX, currentY)

  return doc
}
