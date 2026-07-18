import { jsPDF, getLetterheadBase64, drawLetterheadBackground, A4_MARGINS } from './pdf-engine'

export async function generateReceiptPDF(receipt: any, companySettings: any) {
  const doc = new jsPDF('p', 'mm', 'a4')
  const base64Letterhead = await getLetterheadBase64()

  let currentY = A4_MARGINS.top

  // Header Title & Document Number
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(16, 185, 129) // Emerald header
  doc.text('PAYMENT RECEIPT', A4_MARGINS.left, currentY)

  doc.setFontSize(10)
  doc.setTextColor(71, 85, 105)
  doc.text(`Receipt No: ${receipt.receipt_number}`, A4_MARGINS.right, currentY, { align: 'right' })

  currentY += 6

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(`Date: ${new Date(receipt.receipt_date || receipt.created_at).toLocaleDateString()}`, A4_MARGINS.left, currentY)

  currentY += 10

  // Customer Box
  const customer = receipt.customer || {}
  doc.setFillColor(248, 250, 252)
  doc.setDrawColor(226, 232, 240)
  doc.roundedRect(A4_MARGINS.left, currentY, A4_MARGINS.width, 35, 2, 2, 'FD')

  let boxY = currentY + 6
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  doc.setTextColor(15, 23, 42)
  doc.text(`RECEIVED FROM: ${customer.full_name || 'Valued Customer'}`, A4_MARGINS.left + 5, boxY)

  boxY += 6
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(71, 85, 105)
  doc.text(`Mobile: ${customer.mobile || 'N/A'}`, A4_MARGINS.left + 5, boxY)

  boxY += 6
  doc.text(`Payment Method: ${receipt.payment_method?.toUpperCase()}`, A4_MARGINS.left + 5, boxY)

  if (receipt.reference_number) {
    boxY += 6
    doc.text(`Reference No: ${receipt.reference_number}`, A4_MARGINS.left + 5, boxY)
  }

  currentY += 42

  // Amount Received Highlight Box
  doc.setFillColor(236, 253, 245) // Emerald light background
  doc.setDrawColor(167, 243, 208)
  doc.roundedRect(A4_MARGINS.left, currentY, A4_MARGINS.width, 24, 2, 2, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(6, 95, 70)
  doc.text('AMOUNT RECEIVED:', A4_MARGINS.left + 6, currentY + 10)

  doc.setFontSize(16)
  doc.text(`LKR ${Number(receipt.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, A4_MARGINS.right - 6, currentY + 15, { align: 'right' })

  // Draw Full-Page A4 Letterhead Background Image
  drawLetterheadBackground(doc, base64Letterhead)

  return doc
}
