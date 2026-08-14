import { jsPDF } from 'jspdf'
import { COMPANY_CONFIG } from '../company-config'
import { calculateCommercialInvoiceFinancials } from '../utils/relation-utils'

function formatNumberSafe(val: unknown, decimals: number = 2): string {
  const num = Number(val ?? 0)
  if (isNaN(num)) return '0.00'
  return num.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

function formatDateSafe(val: unknown): string {
  if (!val) return 'N/A'
  try {
    const d = new Date(String(val))
    if (isNaN(d.getTime())) return 'N/A'
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return 'N/A'
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function generateCommercialInvoicePDF(invoice: Record<string, any>) {
  // A4 Portrait: 210 x 297 mm
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  let currentY = 12

  // STEP 1: Top Geometric Header & Official Company Banner
  // Dark header block
  doc.setFillColor(15, 23, 42) // Slate-900 / Black
  doc.rect(15, currentY, 180, 22, 'F')

  // Yellow brand accent bar
  doc.setFillColor(245, 158, 11) // Amber-500 / Gold
  doc.rect(15, currentY + 22, 180, 2, 'F')

  // Company Name in Header Block
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(255, 255, 255)
  doc.text(COMPANY_CONFIG.name, 20, currentY + 9)

  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(203, 213, 225)
  doc.text(`Reg No. ${COMPANY_CONFIG.registrationNumber} | ${COMPANY_CONFIG.address}`, 20, currentY + 14)
  doc.text(`Tel: ${COMPANY_CONFIG.phoneFormatted} | Email: ${COMPANY_CONFIG.email}`, 20, currentY + 18)

  // Document Title & Invoice Number
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(245, 158, 11) // Yellow Gold
  doc.text('INVOICE', 190, currentY + 10, { align: 'right' })

  doc.setFontSize(9)
  doc.setTextColor(255, 255, 255)
  doc.text(invoice.invoice_number || 'TT-IN-10001', 190, currentY + 15, { align: 'right' })

  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(226, 232, 240)
  doc.text(`STATUS: ${(invoice.status || 'draft').toUpperCase()}`, 190, currentY + 19, { align: 'right' })

  currentY += 28

  // STEP 2: Customer Details & Invoice Metadata (2 Columns)
  const customer = invoice.customer || invoice.lessee_snapshot || {}
  const booking = invoice.booking || {}

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(245, 158, 11) // Gold Heading
  doc.text('INVOICE TO:', 15, currentY)
  doc.text('INVOICE & RENTAL METADATA:', 115, currentY)

  currentY += 4.5
  doc.setFontSize(9.5)
  doc.setTextColor(15, 23, 42)
  doc.text(customer.full_name || 'Customer Name', 15, currentY)

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(71, 85, 105)
  doc.text(`Invoice Date: ${formatDateSafe(invoice.invoice_date)}`, 115, currentY)

  currentY += 4
  if (customer.company_name) {
    doc.text(`Company: ${customer.company_name}`, 15, currentY)
  } else {
    doc.text(`Phone: ${customer.mobile || 'N/A'}`, 15, currentY)
  }
  doc.text(`Payment Due Date: ${formatDateSafe(invoice.due_date || invoice.invoice_date)}`, 115, currentY)

  currentY += 4
  if (customer.company_name) {
    doc.text(`Phone: ${customer.mobile || 'N/A'} | Email: ${customer.email || 'N/A'}`, 15, currentY)
  } else {
    doc.text(`Email: ${customer.email || 'N/A'}`, 15, currentY)
  }
  doc.text(`Payment Terms: ${invoice.payment_terms || 'Due Upon Receipt'}`, 115, currentY)

  currentY += 4
  doc.text(`Address: ${customer.address || customer.address_line_1 || 'Sri Lanka'}`, 15, currentY)
  if (booking.booking_number) {
    doc.text(`Booking Ref: #${booking.booking_number}`, 115, currentY)
  } else if (invoice.quotation_number || invoice.quotation_id) {
    doc.text(`Quotation Ref: #${invoice.quotation_number || 'N/A'}`, 115, currentY)
  }

  // Optional Vehicle / Rental Info Section if present
  if (invoice.vehicle_name || invoice.vehicle_registration || booking.booking_vehicles?.length) {
    currentY += 4
    const vehicleStr = invoice.vehicle_name
      ? `${invoice.vehicle_name} (${invoice.vehicle_registration || 'N/A'})`
      : 'Vehicle Rental Service'
    doc.text(`Vehicle: ${vehicleStr}`, 115, currentY)
  }

  if (invoice.rental_start_date || invoice.rental_end_date) {
    currentY += 4
    const daysStr = invoice.rental_days ? ` (${invoice.rental_days} Days)` : ''
    doc.text(`Rental Period: ${formatDateSafe(invoice.rental_start_date)} to ${formatDateSafe(invoice.rental_end_date)}${daysStr}`, 115, currentY)
  }

  currentY += 8

  // STEP 3: Structured Line Items Table Header
  doc.setFillColor(15, 23, 42) // Black/Dark Header
  doc.rect(15, currentY, 180, 7, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(255, 255, 255)

  doc.text('#', 18, currentY + 4.5)
  doc.text('DESCRIPTION', 28, currentY + 4.5)
  doc.text('QTY / DAYS', 125, currentY + 4.5, { align: 'right' })
  doc.text('UNIT PRICE (LKR)', 158, currentY + 4.5, { align: 'right' })
  doc.text('LINE TOTAL (LKR)', 192, currentY + 4.5, { align: 'right' })

  currentY += 7

  const items = invoice.items || []
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(30, 41, 59)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  items.forEach((it: any, idx: number) => {
    if (currentY > 245) {
      doc.addPage()
      currentY = 20
    }

    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252)
      doc.rect(15, currentY, 180, 6.5, 'F')
    }

    doc.text(String(idx + 1), 18, currentY + 4.5)
    const rawDesc = String(it.description || 'Service Line Item')
    const desc = rawDesc.length > 55 ? rawDesc.slice(0, 53) + '...' : rawDesc
    doc.text(desc, 28, currentY + 4.5)
    doc.text(String(it.quantity || 1), 125, currentY + 4.5, { align: 'right' })
    doc.text(formatNumberSafe(it.unit_price), 158, currentY + 4.5, { align: 'right' })
    doc.text(formatNumberSafe(it.line_total || (Number(it.quantity || 1) * Number(it.unit_price || 0))), 192, currentY + 4.5, { align: 'right' })

    currentY += 6.5
  })

  currentY += 3
  doc.setLineWidth(0.2)
  doc.setDrawColor(226, 232, 240)
  doc.line(15, currentY, 195, currentY)
  currentY += 5

  // STEP 4: Financial Summary Box (Right Aligned) & Bank Details (Left Aligned)
  const leftX = 15
  const rightX = 115

  // Bank Payment Details Box (Left)
  const bankY = currentY
  doc.setFillColor(248, 250, 252)
  doc.setDrawColor(226, 232, 240)
  doc.roundedRect(leftX, bankY, 92, 36, 1.5, 1.5, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(217, 119, 6) // Gold Header
  doc.text('PAYMENT & BANK DETAILS:', leftX + 4, bankY + 5)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(51, 65, 85)
  doc.text(`Account Name: ${COMPANY_CONFIG.bank.accountName}`, leftX + 4, bankY + 10)
  doc.text(`Bank: ${COMPANY_CONFIG.bank.bankName}`, leftX + 4, bankY + 14)
  doc.text(`Account No: ${COMPANY_CONFIG.bank.accountNumber}`, leftX + 4, bankY + 18)
  doc.text(`Swift Code: ${COMPANY_CONFIG.bank.swiftCode}`, leftX + 4, bankY + 22)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(15, 23, 42)
  doc.text(`Reference: ${invoice.invoice_number || 'TT-IN-10001'}`, leftX + 4, bankY + 27)

  // Financial Breakdown Summary (Right)
  let sumY = currentY
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(71, 85, 105)

  const financials = calculateCommercialInvoiceFinancials({
    subtotal: Number(invoice.subtotal),
    discount_amount: Number(invoice.discount_amount),
    total_deductions: Number(invoice.total_deductions),
    additional_charges: Number(invoice.additional_charges),
    tax_rate: Number(invoice.tax_rate),
    refundable_deposit: Number(invoice.refundable_deposit),
    amount_paid: Number(invoice.amount_paid),
  })

  doc.text('Subtotal:', rightX, sumY)
  doc.text(`LKR ${formatNumberSafe(financials.subtotal)}`, 192, sumY, { align: 'right' })
  sumY += 4.5

  if (financials.discountAmount > 0) {
    const discLabel = invoice.discount_description ? `Discount (${invoice.discount_description}):` : 'Discount:'
    doc.text(discLabel, rightX, sumY)
    doc.text(`- LKR ${formatNumberSafe(financials.discountAmount)}`, 192, sumY, { align: 'right' })
    sumY += 4.5
  }

  if (financials.deductions > 0) {
    const dedLabel = invoice.deduction_description ? `Deductions (${invoice.deduction_description}):` : 'Deductions:'
    doc.text(dedLabel, rightX, sumY)
    doc.text(`- LKR ${formatNumberSafe(financials.deductions)}`, 192, sumY, { align: 'right' })
    sumY += 4.5
  }

  if (financials.additionalCharges > 0) {
    const addLabel = invoice.additional_charge_description ? `Add. Charges (${invoice.additional_charge_description}):` : 'Additional Charges:'
    doc.text(addLabel, rightX, sumY)
    doc.text(`+ LKR ${formatNumberSafe(financials.additionalCharges)}`, 192, sumY, { align: 'right' })
    sumY += 4.5
  }

  if (financials.taxAmount > 0) {
    doc.text(`Tax (${financials.taxRate}%):`, rightX, sumY)
    doc.text(`LKR ${formatNumberSafe(financials.taxAmount)}`, 192, sumY, { align: 'right' })
    sumY += 4.5
  }

  if (financials.refundableDeposit > 0) {
    doc.text('Refundable Deposit (Separate):', rightX, sumY)
    doc.text(`LKR ${formatNumberSafe(financials.refundableDeposit)}`, 192, sumY, { align: 'right' })
    sumY += 4.5
  }

  doc.setLineWidth(0.3)
  doc.setDrawColor(203, 213, 225)
  doc.line(rightX, sumY, 195, sumY)
  sumY += 4

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(15, 23, 42)
  doc.text('Net Amount:', rightX, sumY)
  doc.text(`LKR ${formatNumberSafe(financials.netAmount)}`, 192, sumY, { align: 'right' })
  sumY += 4.5

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(71, 85, 105)
  doc.text('Amount Paid:', rightX, sumY)
  doc.text(`LKR ${formatNumberSafe(financials.amountPaid)}`, 192, sumY, { align: 'right' })
  sumY += 5.5

  // BALANCE DUE Highlight Bar
  doc.setFillColor(15, 23, 42) // Black Bar
  doc.rect(rightX, sumY - 4, 80, 8, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(245, 158, 11) // Yellow/Gold Text
  doc.text('BALANCE DUE:', rightX + 3, sumY + 1.5)
  doc.text(`LKR ${formatNumberSafe(financials.balanceDue)}`, 192, sumY + 1.5, { align: 'right' })

  currentY = Math.max(bankY + 38, sumY + 10)

  // STEP 5: Special Notes & Important Terms (Gold Headings)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(217, 119, 6) // Yellow/Gold
  doc.text('SPECIAL NOTES:', 15, currentY)
  currentY += 4

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(71, 85, 105)
  const specialNotesText = String(invoice.special_notes || COMPANY_CONFIG.defaultInvoiceSpecialNotes)
  const specialLines = doc.splitTextToSize(specialNotesText, 180)
  doc.text(specialLines, 15, currentY)
  currentY += specialLines.length * 3.5 + 4

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(217, 119, 6) // Yellow/Gold
  doc.text('IMPORTANT TERMS & CONDITIONS:', 15, currentY)
  currentY += 4

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(71, 85, 105)
  const termsText = String(invoice.terms_and_conditions || invoice.important_message || COMPANY_CONFIG.defaultInvoiceImportantTerms)
  const termsLines = doc.splitTextToSize(termsText, 180)
  doc.text(termsLines, 15, currentY)
  currentY += termsLines.length * 3.5 + 6

  // STEP 6: Prepared By Snapshot Section
  const prepY = Math.max(currentY, 252)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(15, 23, 42)
  doc.text('PREPARED BY:', 15, prepY)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(71, 85, 105)
  const staffName = invoice.prepared_by_name_snapshot || invoice.prepared_by_profile?.full_name || 'Accounts Officer'
  const staffDesignation = invoice.prepared_by_designation_snapshot || 'Finance & Operations'
  doc.text(`${staffName} (${staffDesignation})`, 15, prepY + 4)
  doc.text(COMPANY_CONFIG.name, 15, prepY + 8)

  // Signature Block Right
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(15, 23, 42)
  doc.line(135, prepY + 4, 195, prepY + 4)
  doc.text(`For ${COMPANY_CONFIG.name}`, 135, prepY + 8)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(100, 116, 139)
  doc.text('Authorized Signatory & Official Stamp', 135, prepY + 12)

  // STEP 7: Official Footer & Page Numbers
  const totalPages = (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)

    // Bottom yellow & black geometric accent line
    doc.setFillColor(245, 158, 11) // Yellow
    doc.rect(15, 285, 180, 1, 'F')
    doc.setFillColor(15, 23, 42) // Black
    doc.rect(15, 286, 180, 4, 'F')

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(255, 255, 255)
    doc.text(COMPANY_CONFIG.slogan, 20, 289)
    doc.text(`Commercial Invoice #${invoice.invoice_number || 'TT-IN-10001'} | Page ${i} of ${totalPages}`, 190, 289, { align: 'right' })
  }

  return doc
}
