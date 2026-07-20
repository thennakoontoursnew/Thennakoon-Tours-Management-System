import { jsPDF, autoTable, getLetterheadBase64, drawLetterheadBackground, A4_MARGINS } from './pdf-engine'

export async function generateQuotationPDF(quotation: any, companySettings: any) {
  const doc = new jsPDF('p', 'mm', 'a4')
  const base64Letterhead = await getLetterheadBase64()

  let currentY = A4_MARGINS.top

  // Header Title & Document Reference
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(245, 158, 11) // Amber header
  doc.text('QUOTATION', A4_MARGINS.left, currentY)

  doc.setFontSize(10)
  doc.setTextColor(71, 85, 105) // Slate-600
  doc.text(`Ref: ${quotation.quotation_number}`, A4_MARGINS.right, currentY, { align: 'right' })

  currentY += 6

  // Date & Validity
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(`Date: ${quotation.quotation_date}`, A4_MARGINS.left, currentY)
  doc.text(
    `Valid Until: ${quotation.valid_until ? new Date(quotation.valid_until).toLocaleDateString() : '7 Days from Issue'}`,
    A4_MARGINS.right,
    currentY,
    { align: 'right' }
  )

  currentY += 8

  // 1. Customer Section
  const customer = quotation.customer || {}
  doc.setFillColor(248, 250, 252) // Slate-50 background box
  doc.setDrawColor(226, 232, 240)
  doc.roundedRect(A4_MARGINS.left, currentY, A4_MARGINS.width, 24, 2, 2, 'FD')

  let boxY = currentY + 5
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(15, 23, 42)
  doc.text(`QUOTATION FOR: ${customer.full_name || 'Valued Customer'}`, A4_MARGINS.left + 4, boxY)

  if (customer.company_name) {
    doc.setFont('helvetica', 'normal')
    doc.text(`Company: ${customer.company_name}`, A4_MARGINS.left + 100, boxY)
  }

  boxY += 5
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(71, 85, 105)
  doc.text(`Mobile: ${customer.mobile || 'N/A'}  |  NIC/Passport: ${customer.nic || customer.passport_number || 'N/A'}`, A4_MARGINS.left + 4, boxY)

  boxY += 5
  doc.text(`Rental Start: ${quotation.rental_start_date}  |  Rental End: ${quotation.rental_end_date}`, A4_MARGINS.left + 4, boxY)

  boxY += 5
  doc.text(`Route/Destination: ${quotation.destination || 'As requested'}`, A4_MARGINS.left + 4, boxY)

  currentY += 28

  // 2. Vehicle Table
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
    styles: { fontSize: 8, cellPadding: 2.5 },
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  })

  currentY = (doc as any).lastAutoTable.finalY + 6

  // 3. Totals Section
  const totalsX = A4_MARGINS.right - 70
  doc.setFontSize(8.5)

  doc.setFont('helvetica', 'normal')
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
  doc.setFontSize(10)
  doc.setTextColor(217, 119, 6) // Amber
  doc.text('GRAND TOTAL:', totalsX, currentY)
  doc.text(`LKR ${Number(quotation.grand_total).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, A4_MARGINS.right, currentY, { align: 'right' })

  currentY += 10

  // 4. Special Notes
  const specialNotesText = quotation.special_notes || ''
  if (specialNotesText.trim()) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(15, 23, 42)
    doc.text('SPECIAL NOTES:', A4_MARGINS.left, currentY)
    currentY += 4

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(71, 85, 105)
    const splitNotes = doc.splitTextToSize(specialNotesText, A4_MARGINS.width)
    doc.text(splitNotes, A4_MARGINS.left, currentY)
    currentY += splitNotes.length * 4 + 4
  }

  // 5. Important Message
  const importantMsg = quotation.important_message || ''
  if (importantMsg.trim()) {
    doc.setFillColor(254, 243, 199) // Light amber highlight box
    doc.setDrawColor(245, 158, 11)
    doc.roundedRect(A4_MARGINS.left, currentY, A4_MARGINS.width, 10, 1.5, 1.5, 'FD')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(180, 83, 9) // Dark amber text
    doc.text(importantMsg, A4_MARGINS.left + 4, currentY + 6)
    currentY += 14
  }

  // 6. Bank Details (Using saved snapshot)
  const bank = quotation.bank_details_snapshot || companySettings?.bank_details || {
    bank_name: companySettings?.bank_name || 'Bank of Ceylon',
    bank_branch: companySettings?.bank_branch || 'Colombo Super Grade',
    bank_account_name: companySettings?.bank_account_name || 'Thennakoon Tours (Pvt) Ltd',
    bank_account_number: companySettings?.bank_account_number || '000123456789',
    bank_swift_code: companySettings?.bank_swift_code || 'BCEYLKLX',
  }

  doc.setFillColor(241, 245, 249)
  doc.setDrawColor(226, 232, 240)
  doc.roundedRect(A4_MARGINS.left, currentY, A4_MARGINS.width, 20, 2, 2, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(15, 23, 42)
  doc.text('BANK PAYMENT INSTRUCTIONS:', A4_MARGINS.left + 4, currentY + 5)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(51, 65, 85)
  doc.text(`Account Name: ${bank.bank_account_name || 'Thennakoon Tours (Pvt) Ltd'}`, A4_MARGINS.left + 4, currentY + 10)
  doc.text(`Bank: ${bank.bank_name || 'Bank of Ceylon'} (${bank.bank_branch || 'Colombo Super Grade'})`, A4_MARGINS.left + 4, currentY + 14)
  doc.text(`Account No: ${bank.bank_account_number || '000123456789'}  |  SWIFT: ${bank.bank_swift_code || 'BCEYLKLX'}`, A4_MARGINS.left + 4, currentY + 18)

  currentY += 26

  // 7. Prepared By Block
  const prepLabel = quotation.prepared_by_label_snapshot || 'Authorized Reservation Officer'
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(100, 116, 139)

  const prepX = A4_MARGINS.right - 60
  doc.line(prepX, currentY, A4_MARGINS.right, currentY) // Signature line
  currentY += 4
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(15, 23, 42)
  doc.text(prepLabel, prepX + 30, currentY, { align: 'center' })
  currentY += 3.5
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(100, 116, 139)
  doc.text('Thennakoon Tours (Pvt) Ltd', prepX + 30, currentY, { align: 'center' })

  // Draw Full-Page A4 Letterhead Background Image
  drawLetterheadBackground(doc, base64Letterhead)

  return doc
}
