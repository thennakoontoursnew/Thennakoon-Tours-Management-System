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
  doc.setTextColor(15, 23, 42) // Slate-900 / Solid Black
  let currentY = A4_MARGINS.top

  // Helper for multi-page overflow
  const ensureSpace = (requiredHeight: number) => {
    if (currentY + requiredHeight > A4_MARGINS.bottom) {
      doc.addPage()
      if (base64Letterhead) {
        drawLetterheadOnPage(doc, base64Letterhead)
      }
      doc.setTextColor(15, 23, 42)
      currentY = A4_MARGINS.top
    }
  }

  // 1. Document Title & Reference (Black / Charcoal Header)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(15, 23, 42) // Solid Black / Dark Charcoal
  doc.text('QUOTATION', A4_MARGINS.left, currentY)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(71, 85, 105) // Slate-600
  doc.text(`Ref: ${quotation.quotation_number}`, A4_MARGINS.right, currentY, { align: 'right' })

  currentY += 8

  // 2. Customer Information Card (Balanced 2-Column Layout)
  const customer = quotation.customer || {}
  const cardHeight = 32
  doc.setFillColor(248, 250, 252) // Slate-50 background
  doc.setDrawColor(226, 232, 240) // Slate-200 border
  doc.roundedRect(A4_MARGINS.left, currentY, A4_MARGINS.width, cardHeight, 2, 2, 'FD')

  // LEFT COLUMN (Customer details)
  const leftColX = A4_MARGINS.left + 5
  let colY = currentY + 5

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(100, 116, 139) // Slate-500
  doc.text('TO:', leftColX, colY)
  colY += 4.5
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(15, 23, 42)
  doc.text(customer.full_name || 'Valued Customer', leftColX, colY)
  if (customer.company_name) {
    colY += 4
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(71, 85, 105)
    doc.text(`Company: ${customer.company_name}`, leftColX, colY)
  }

  colY += 5
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(100, 116, 139)
  doc.text('Mobile:', leftColX, colY)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(30, 41, 59)
  doc.text(customer.mobile || customer.phone || 'N/A', leftColX + 16, colY)

  colY += 4.5
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(100, 116, 139)
  doc.text('NIC / Passport:', leftColX, colY)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(30, 41, 59)
  doc.text(customer.nic || customer.passport_number || 'N/A', leftColX + 26, colY)

  // RIGHT COLUMN (Dates & Route details)
  const rightColX = A4_MARGINS.left + 95
  let rColY = currentY + 5

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(100, 116, 139)
  doc.text('Quotation Date:', rightColX, rColY)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(30, 41, 59)
  doc.text(quotation.quotation_date || 'N/A', rightColX + 26, rColY)

  rColY += 5
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(100, 116, 139)
  doc.text('Rental Period:', rightColX, rColY)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(30, 41, 59)
  doc.text(`${quotation.rental_start_date} – ${quotation.rental_end_date}`, rightColX + 24, rColY)

  rColY += 5
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(100, 116, 139)
  doc.text('Route / Destination:', rightColX, rColY)
  rColY += 4.5
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(30, 41, 59)
  const destText = doc.splitTextToSize(quotation.destination || 'As requested', 75)
  doc.text(destText, rightColX, rColY)

  currentY += cardHeight + 6

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
    styles: { fontSize: 8.5, cellPadding: 2.5, textColor: [15, 23, 42] },
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    willDrawPage: (data) => {
      if (base64Letterhead && data.pageNumber > 1) {
        drawLetterheadOnPage(doc, base64Letterhead)
      }
    },
  })

  currentY = (doc as any).lastAutoTable.finalY + 6

  // 4. Refundable Deposit and Totals
  ensureSpace(25)
  const totalsX = A4_MARGINS.right - 70
  doc.setFontSize(8.5)

  doc.setFont('helvetica', 'normal')
  doc.setTextColor(15, 23, 42)
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

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10.5)
  doc.setTextColor(217, 119, 6) // Amber
  doc.text('GRAND TOTAL:', totalsX, currentY)
  doc.text(`LKR ${Number(quotation.grand_total).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, A4_MARGINS.right, currentY, { align: 'right' })

  currentY += 10

  // 5. SPECIAL NOTES (Pre-normalized line breaks)
  const specialNotesText = normalizeNewlines(quotation.special_notes)
  if (specialNotesText.trim()) {
    const splitNotes = doc.splitTextToSize(specialNotesText, A4_MARGINS.width)
    const requiredH = splitNotes.length * 3.8 + 10
    ensureSpace(requiredH)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(15, 23, 42)
    doc.text('SPECIAL NOTES', A4_MARGINS.left, currentY)
    currentY += 4.5

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(71, 85, 105)
    doc.text(splitNotes, A4_MARGINS.left, currentY)
    currentY += splitNotes.length * 3.8 + 6
  }

  // 6. IMPORTANT (Pre-normalized line breaks)
  const importantMsg = normalizeNewlines(quotation.important_message)
  if (importantMsg.trim()) {
    const splitMsg = doc.splitTextToSize(importantMsg, A4_MARGINS.width - 8)
    const boxHeight = Math.max(10, splitMsg.length * 3.8 + 5)
    ensureSpace(boxHeight + 10)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(180, 83, 9)
    doc.text('IMPORTANT', A4_MARGINS.left, currentY)
    currentY += 4.5

    doc.setFillColor(254, 243, 199)
    doc.setDrawColor(245, 158, 11)
    doc.roundedRect(A4_MARGINS.left, currentY, A4_MARGINS.width, boxHeight, 1.5, 1.5, 'FD')

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(120, 53, 15)
    doc.text(splitMsg, A4_MARGINS.left + 4, currentY + 4.5)
    currentY += boxHeight + 6
  }

  // 7. BANK DETAILS BOX (Wider Structured Card with Stacked Rows)
  const bankAccName = quotation.bank_account_name_snapshot || companySettings?.bank_account_name || 'Thennakoon Tours (Pvt) Ltd'
  const bankName = quotation.bank_name_snapshot || companySettings?.bank_name || 'Nations Trust Bank'
  const bankBranch = quotation.bank_branch_snapshot || companySettings?.bank_branch || 'Nugegoda'
  const bankAccNum = quotation.bank_account_number_snapshot || companySettings?.bank_account_number || '100530013140'
  const bankSwift = quotation.bank_swift_code_snapshot || companySettings?.bank_swift_code || 'NTBCLKLX'
  const paymentInstructions = normalizeNewlines(quotation.payment_instructions_snapshot)

  const bankBoxWidth = 115 // Wider box (115mm out of 180mm) leaving right side clear for stamp artwork
  const bankBoxHeight = paymentInstructions.trim() ? 36 : 30
  ensureSpace(bankBoxHeight + 35) // Ensure space for Bank Details + Prepared By together

  const bankBoxStartY = currentY
  doc.setFillColor(248, 250, 252) // Slate-50
  doc.setDrawColor(203, 213, 225) // Slate-300
  doc.roundedRect(A4_MARGINS.left, bankBoxStartY, bankBoxWidth, bankBoxHeight, 2, 2, 'FD')

  let bY = bankBoxStartY + 5.5
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  doc.setTextColor(15, 23, 42)
  doc.text('BANK DETAILS', A4_MARGINS.left + 5, bY)

  bY += 5
  const renderBankRow = (label: string, value: string, isBoldValue = false) => {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(100, 116, 139)
    doc.text(label, A4_MARGINS.left + 5, bY)

    doc.setFont('helvetica', isBoldValue ? 'bold' : 'normal')
    doc.setFontSize(9)
    doc.setTextColor(15, 23, 42)
    doc.text(value, A4_MARGINS.left + 33, bY)
    bY += 4.5
  }

  renderBankRow('Account Name:', bankAccName)
  renderBankRow('Account Number:', bankAccNum, true)
  renderBankRow('Bank:', bankName)
  renderBankRow('Branch:', bankBranch)
  renderBankRow('Swift Code:', bankSwift)

  if (paymentInstructions.trim()) {
    bY += 1
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(7.5)
    doc.setTextColor(100, 116, 139)
    const splitInstruction = doc.splitTextToSize(`Note: ${paymentInstructions}`, bankBoxWidth - 10)
    doc.text(splitInstruction, A4_MARGINS.left + 5, bY)
  }

  currentY = bankBoxStartY + bankBoxHeight + 6

  // 8. PREPARED BY BLOCK (Placed Directly Below Bank Details Box on the Left)
  const prepName = quotation.prepared_by_name_snapshot || 'Authorized Officer'
  const prepDesignation = quotation.prepared_by_designation_snapshot || 'Admin & Marketing Assistant'
  const companyName = quotation.company_name_snapshot || 'Thennakoon Tours (Pvt) Ltd'

  const prepX = A4_MARGINS.left + 5
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(100, 116, 139)
  doc.text('Prepared By:', prepX, currentY)
  currentY += 10 // Space for physical signature above name

  doc.setDrawColor(148, 163, 184)
  doc.line(prepX, currentY, prepX + 65, currentY) // Signature line
  currentY += 4.5

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10.5)
  doc.setTextColor(15, 23, 42)
  doc.text(prepName, prepX, currentY)

  currentY += 4
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(71, 85, 105)
  doc.text(prepDesignation, prepX, currentY)

  currentY += 4
  doc.text(companyName, prepX, currentY)

  return doc
}
