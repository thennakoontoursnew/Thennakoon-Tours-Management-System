import { jsPDF } from 'jspdf'

function formatNumberSafe(val: any, decimals: number = 2): string {
  const num = Number(val ?? 0)
  if (isNaN(num)) return '0.00'
  return num.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

function formatDateSafe(val: any): string {
  if (!val) return 'N/A'
  try {
    const d = new Date(val)
    if (isNaN(d.getTime())) return 'N/A'
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return 'N/A'
  }
}

export async function generateCommercialInvoicePDF(invoice: any, companySettings?: any) {
  // A4 Portrait: 210 x 297 mm
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  let currentY = 15

  // STEP 1: Company Header
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(15, 23, 42)
  doc.text('THENNAKOON TOURS (PVT) LTD', 15, currentY)

  doc.setFontSize(8.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(71, 85, 105)
  doc.text('39A, 1st cross street, Pagoda Road, Nugegoda, Sri Lanka | Reg No. PV 00312253', 15, currentY + 4.5)
  doc.text('Phone: +94 112 823 723 / +94 77 727 3820 | Email: info@thennakoontours.lk', 15, currentY + 8.5)

  // Invoice Title & Ref
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.setTextColor(15, 23, 42)
  doc.text('INVOICE', 195, currentY, { align: 'right' })

  doc.setFontSize(9)
  doc.setTextColor(180, 83, 9)
  doc.text(invoice.invoice_number || 'TT-IN-10001', 195, currentY + 5, { align: 'right' })

  doc.setFontSize(8)
  doc.setTextColor(71, 85, 105)
  doc.setFont('helvetica', 'normal')
  doc.text(`Status: ${(invoice.status || 'draft').toUpperCase()}`, 195, currentY + 9, { align: 'right' })

  currentY += 16
  doc.setLineWidth(0.4)
  doc.setDrawColor(15, 23, 42)
  doc.line(15, currentY, 195, currentY)
  currentY += 6

  // STEP 2: Customer & Invoice Meta Details (2 columns)
  const customer = invoice.customer || invoice.lessee_snapshot || {}
  const booking = invoice.booking || {}

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(15, 23, 42)
  doc.text('BILLED TO:', 15, currentY)
  doc.text('INVOICE DETAILS:', 120, currentY)

  currentY += 4.5
  doc.setFontSize(9.5)
  doc.text(customer.full_name || 'Customer Name', 15, currentY)

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(71, 85, 105)
  doc.text(`Invoice Date: ${formatDateSafe(invoice.invoice_date)}`, 120, currentY)

  currentY += 4
  if (customer.company_name) {
    doc.text(`Company: ${customer.company_name}`, 15, currentY)
  }
  doc.text(`Due Date: ${formatDateSafe(invoice.due_date || invoice.invoice_date)}`, 120, currentY)

  currentY += 4
  doc.text(`Mobile: ${customer.mobile || 'N/A'} | NIC: ${customer.identifier_no || customer.nic || 'N/A'}`, 15, currentY)
  doc.text(`Payment Terms: ${invoice.payment_terms || 'Due Upon Receipt'}`, 120, currentY)

  currentY += 4
  doc.text(`Address: ${customer.address || customer.address_line_1 || 'Sri Lanka'}`, 15, currentY)
  if (booking.booking_number) {
    doc.text(`Booking Ref: ${booking.booking_number}`, 120, currentY)
  }

  currentY += 10

  // STEP 3: Structured Line Items Table Header
  doc.setFillColor(15, 23, 42)
  doc.rect(15, currentY, 180, 6.5, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(255, 255, 255)

  doc.text('NO', 18, currentY + 4.5)
  doc.text('DESCRIPTION', 32, currentY + 4.5)
  doc.text('QTY / DAYS', 125, currentY + 4.5, { align: 'right' })
  doc.text('RATE (LKR)', 155, currentY + 4.5, { align: 'right' })
  doc.text('AMOUNT (LKR)', 192, currentY + 4.5, { align: 'right' })

  currentY += 6.5

  const items = invoice.items || []
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(30, 41, 59)

  items.forEach((it: any, idx: number) => {
    if (currentY > 250) {
      doc.addPage()
      currentY = 20
    }

    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252)
      doc.rect(15, currentY, 180, 6, 'F')
    }

    doc.text(String(idx + 1), 18, currentY + 4)
    const desc = (it.description || 'Service Line Item').length > 55 ? (it.description || '').slice(0, 53) + '...' : it.description
    doc.text(desc, 32, currentY + 4)
    doc.text(String(it.quantity || 1), 125, currentY + 4, { align: 'right' })
    doc.text(formatNumberSafe(it.unit_price), 155, currentY + 4, { align: 'right' })
    doc.text(formatNumberSafe(it.line_total), 192, currentY + 4, { align: 'right' })

    currentY += 6
  })

  currentY += 4
  doc.setLineWidth(0.2)
  doc.setDrawColor(226, 232, 240)
  doc.line(15, currentY, 195, currentY)
  currentY += 6

  // STEP 4: Financial Summary Box (Right aligned)
  const sumX = 120
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(71, 85, 105)

  doc.text('Subtotal:', sumX, currentY)
  doc.text(`LKR ${formatNumberSafe(invoice.subtotal)}`, 192, currentY, { align: 'right' })
  currentY += 4.5

  if (Number(invoice.discount_amount) > 0) {
    doc.text('Discount:', sumX, currentY)
    doc.text(`-LKR ${formatNumberSafe(invoice.discount_amount)}`, 192, currentY, { align: 'right' })
    currentY += 4.5
  }

  if (Number(invoice.tax_amount) > 0) {
    doc.text(`Tax (${invoice.tax_rate || 0}%):`, sumX, currentY)
    doc.text(`LKR ${formatNumberSafe(invoice.tax_amount)}`, 192, currentY, { align: 'right' })
    currentY += 4.5
  }

  if (Number(invoice.refundable_deposit) > 0) {
    doc.text('Refundable Deposit (Separate):', sumX, currentY)
    doc.text(`LKR ${formatNumberSafe(invoice.refundable_deposit)}`, 192, currentY, { align: 'right' })
    currentY += 4.5
  }

  doc.setLineWidth(0.4)
  doc.setDrawColor(15, 23, 42)
  doc.line(sumX, currentY, 195, currentY)
  currentY += 5

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(15, 23, 42)
  doc.text('GRAND TOTAL:', sumX, currentY)
  doc.text(`LKR ${formatNumberSafe(invoice.grand_total)}`, 192, currentY, { align: 'right' })
  currentY += 5

  doc.setFontSize(8.5)
  doc.setTextColor(16, 185, 129)
  doc.text('Amount Paid:', sumX, currentY)
  doc.text(`LKR ${formatNumberSafe(invoice.amount_paid)}`, 192, currentY, { align: 'right' })
  currentY += 4.5

  doc.setFontSize(9.5)
  doc.setTextColor(225, 29, 72)
  doc.text('BALANCE DUE:', sumX, currentY)
  doc.text(`LKR ${formatNumberSafe(invoice.balance_due)}`, 192, currentY, { align: 'right' })

  // STEP 5: Payment Instructions (Left column)
  const instrY = currentY - 25
  doc.setFillColor(248, 250, 252)
  doc.setDrawColor(226, 232, 240)
  doc.roundedRect(15, instrY, 95, 30, 1.5, 1.5, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(15, 23, 42)
  doc.text('BANK PAYMENT INSTRUCTIONS:', 18, instrY + 4.5)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(71, 85, 105)
  doc.text('Bank: Nations Trust Bank — Nugegoda Branch', 18, instrY + 9)
  doc.text('Account Name: Thennakoon Tours (PVT) Ltd', 18, instrY + 13)
  doc.text('Account No: 100530013140', 18, instrY + 17)
  doc.text(`Please reference Invoice No (${invoice.invoice_number}) on transfers.`, 18, instrY + 21)

  currentY += 20

  // STEP 6: Notes & Signature
  if (invoice.notes || invoice.important_message) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(15, 23, 42)
    doc.text('NOTES / REMARKS:', 15, currentY)
    currentY += 4

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(71, 85, 105)
    doc.text(invoice.notes || invoice.important_message || '', 15, currentY)
    currentY += 12
  }

  const sigY = Math.max(currentY, 260)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(15, 23, 42)
  doc.line(135, sigY, 195, sigY)
  doc.text('For Thennakoon Tours (Pvt) Ltd', 135, sigY + 4)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.text('Authorized Signature & Stamp', 135, sigY + 8)

  // Dynamic Page X of Y Footer
  const totalPages = (doc as any).internal.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(100, 116, 139)
    doc.text(`Commercial Invoice — ${invoice.invoice_number || 'TT-IN-10001'}`, 15, 290)
    doc.text(`Page ${i} of ${totalPages}`, 195, 290, { align: 'right' })
  }

  return doc
}
