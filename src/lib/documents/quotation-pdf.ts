import { jsPDF, autoTable, getLetterheadBase64, drawLetterheadBackground, A4_MARGINS } from './pdf-engine'
import { normalizeNewlines } from '@/lib/utils/formatters'

export async function generateQuotationPDF(quotation: any, companySettings?: any) {
  const doc = new jsPDF('p', 'mm', 'a4')
  const base64Letterhead = await getLetterheadBase64()

  let currentY = A4_MARGINS.top

  // Document Title & Reference
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(245, 158, 11) // Amber header
  doc.text('QUOTATION', A4_MARGINS.left, currentY)

  doc.setFontSize(10)
  doc.setTextColor(71, 85, 105) // Slate-600
  doc.text(`Ref: ${quotation.quotation_number}`, A4_MARGINS.right, currentY, { align: 'right' })

  currentY += 6

  // 1. Customer & Rental Date Information
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(`Date: ${quotation.quotation_date}`, A4_MARGINS.left, currentY)
  doc.text(
    `Valid Until: ${quotation.valid_until ? new Date(quotation.valid_until).toLocaleDateString() : '24 Hours from Issue'}`,
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
    styles: { fontSize: 8, cellPadding: 2.5 },
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  })

  currentY = (doc as any).lastAutoTable.finalY + 6

  // 4. Refundable Deposit and Totals
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

  // 5. SPECIAL NOTES (Pre-normalized line breaks)
  const specialNotesText = normalizeNewlines(quotation.special_notes)
  if (specialNotesText.trim()) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(15, 23, 42)
    doc.text('SPECIAL NOTES', A4_MARGINS.left, currentY)
    currentY += 4

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(71, 85, 105)
    const splitNotes = doc.splitTextToSize(specialNotesText, A4_MARGINS.width)
    doc.text(splitNotes, A4_MARGINS.left, currentY)
    currentY += splitNotes.length * 3.8 + 4
  }

  // 6. IMPORTANT (Pre-normalized line breaks)
  const importantMsg = normalizeNewlines(quotation.important_message)
  if (importantMsg.trim()) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(180, 83, 9)
    doc.text('IMPORTANT', A4_MARGINS.left, currentY)
    currentY += 4

    const splitMsg = doc.splitTextToSize(importantMsg, A4_MARGINS.width - 8)
    const boxHeight = Math.max(10, splitMsg.length * 3.8 + 5)

    doc.setFillColor(254, 243, 199)
    doc.setDrawColor(245, 158, 11)
    doc.roundedRect(A4_MARGINS.left, currentY, A4_MARGINS.width, boxHeight, 1.5, 1.5, 'FD')

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(120, 53, 15)
    doc.text(splitMsg, A4_MARGINS.left + 4, currentY + 4.5)
    currentY += boxHeight + 6
  }

  // 7. BANK DETAILS (Read strictly from saved snapshot columns)
  const bankAccName = quotation.bank_account_name_snapshot || companySettings?.bank_account_name || 'Thennakoon Tours (Pvt) Ltd'
  const bankName = quotation.bank_name_snapshot || companySettings?.bank_name || 'Nations Trust Bank'
  const bankBranch = quotation.bank_branch_snapshot || companySettings?.bank_branch || 'Nugegoda'
  const bankAccNum = quotation.bank_account_number_snapshot || companySettings?.bank_account_number || '100530013140'
  const bankSwift = quotation.bank_swift_code_snapshot || companySettings?.bank_swift_code || 'NTBCLKLX'
  const paymentInstructions = normalizeNewlines(quotation.payment_instructions_snapshot)

  doc.setFillColor(241, 245, 249)
  doc.setDrawColor(226, 232, 240)
  doc.roundedRect(A4_MARGINS.left, currentY, A4_MARGINS.width, 22, 2, 2, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(15, 23, 42)
  doc.text('BANK DETAILS', A4_MARGINS.left + 4, currentY + 5)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(51, 65, 85)
  doc.text(`Account Name: ${bankAccName}`, A4_MARGINS.left + 4, currentY + 10)
  doc.text(`Bank: ${bankName} (${bankBranch})`, A4_MARGINS.left + 4, currentY + 14)
  doc.text(`Account No: ${bankAccNum}  |  SWIFT Code: ${bankSwift}`, A4_MARGINS.left + 4, currentY + 18)

  if (paymentInstructions.trim()) {
    currentY += 24
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(7.5)
    doc.setTextColor(100, 116, 139)
    doc.text(`Payment Note: ${paymentInstructions}`, A4_MARGINS.left, currentY)
    currentY += 4
  } else {
    currentY += 26
  }

  // 8. Prepared By Block (Read strictly from saved snapshot columns)
  const prepName = quotation.prepared_by_name_snapshot || 'Authorized Officer'
  const prepDesignation = quotation.prepared_by_designation_snapshot || 'Admin & Marketing Assistant'
  const companyName = quotation.company_name_snapshot || 'Thennakoon Tours (Pvt) Ltd'

  const prepX = A4_MARGINS.right - 65
  doc.line(prepX, currentY, A4_MARGINS.right, currentY) // Signature line
  currentY += 4.5
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(15, 23, 42)
  doc.text(prepName, prepX + 32.5, currentY, { align: 'center' })
  currentY += 3.8
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(71, 85, 105)
  doc.text(prepDesignation, prepX + 32.5, currentY, { align: 'center' })
  currentY += 3.5
  doc.text(companyName, prepX + 32.5, currentY, { align: 'center' })

  // Draw Full-Page A4 Letterhead Background Image
  drawLetterheadBackground(doc, base64Letterhead)

  return doc
}
