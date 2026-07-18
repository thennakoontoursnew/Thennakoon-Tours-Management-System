import { jsPDF, autoTable, getLetterheadBase64, drawLetterheadBackground, A4_MARGINS } from './pdf-engine'

export async function generateQuotationPDF(quotation: any, companySettings: any) {
  const doc = new jsPDF('p', 'mm', 'a4')
  const base64Letterhead = await getLetterheadBase64()

  let currentY = A4_MARGINS.top

  // Header Title & Document Number
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

  // Customer Details Box
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

  // Items Table
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

  // Totals Summary Box
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

  // Bank Details Box
  doc.setFillColor(241, 245, 249)
  doc.roundedRect(A4_MARGINS.left, currentY, A4_MARGINS.width, 22, 2, 2, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(15, 23, 42)
  doc.text('BANK TRANSFER INSTRUCTIONS:', A4_MARGINS.left + 4, currentY + 5)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(51, 65, 85)
  doc.text(`Account Name: ${companySettings?.bank_account_name || 'Thennakoon Tours (Pvt) Ltd'}`, A4_MARGINS.left + 4, currentY + 10)
  doc.text(`Bank: ${companySettings?.bank_name || 'Nations Trust Bank'} (${companySettings?.bank_branch || 'Nugegoda'})`, A4_MARGINS.left + 4, currentY + 14)
  doc.text(`Account No: ${companySettings?.bank_account_number || '100-200-300400'}  |  SWIFT: ${companySettings?.bank_swift_code || 'NTBKLKLX'}`, A4_MARGINS.left + 4, currentY + 18)

  currentY += 26

  // Special Notes & Terms
  if (quotation.special_notes || companySettings?.default_quotation_terms) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(15, 23, 42)
    doc.text('TERMS & CONDITIONS:', A4_MARGINS.left, currentY)
    currentY += 4

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(71, 85, 105)
    const terms = quotation.terms_and_conditions || companySettings?.default_quotation_terms || ''
    const splitTerms = doc.splitTextToSize(terms, A4_MARGINS.width)
    doc.text(splitTerms, A4_MARGINS.left, currentY)
  }

  // Draw Full-Page A4 Letterhead Background Image
  drawLetterheadBackground(doc, base64Letterhead)

  return doc
}
