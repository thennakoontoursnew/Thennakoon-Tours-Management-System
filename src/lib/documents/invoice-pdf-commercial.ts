import { jsPDF, getLetterheadBase64, drawLetterheadOnPage } from './pdf-engine'
import { COMPANY_CONFIG } from '../company-config'
import { calculateCommercialInvoiceFinancials, unwrapDeductionsRelation } from '../utils/relation-utils'

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

// SAFE CONTENT BOUNDARIES WITHIN OFFICIAL LETTERHEAD
const CONTENT_TOP = 42
const CONTENT_BOTTOM = 255
const CONTENT_LEFT = 18
const CONTENT_RIGHT = 192
const CONTENT_WIDTH = CONTENT_RIGHT - CONTENT_LEFT

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function generateCommercialInvoicePDF(invoice: Record<string, any>) {
  // A4 Portrait: 210 x 297 mm
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  // Load canonical letterhead asset
  const base64Letterhead = await getLetterheadBase64()

  // 1. Draw Official Letterhead Background FIRST on Page 1 (Layer 0)
  if (base64Letterhead) {
    drawLetterheadOnPage(doc, base64Letterhead)
  }

  // STEP 1: Document Header Content Overlay (Within Safe Area)
  // Left: INVOICE Title & Date
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.setTextColor(23, 23, 26) // Dark Black #17171A
  doc.text('INVOICE', CONTENT_LEFT, CONTENT_TOP)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(75, 85, 99)
  doc.text(`Invoice Date: ${formatDateSafe(invoice.invoice_date)}`, CONTENT_LEFT, CONTENT_TOP + 5.5)

  // Right: Invoice Number Block
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(107, 114, 128)
  doc.text('INVOICE NO:', CONTENT_RIGHT, CONTENT_TOP, { align: 'right' })

  doc.setFontSize(14)
  doc.setTextColor(23, 23, 26)
  doc.text(invoice.invoice_number || 'TT-IN-10001', CONTENT_RIGHT, CONTENT_TOP + 5.5, { align: 'right' })

  // Divider Line
  doc.setLineWidth(0.2)
  doc.setDrawColor(229, 231, 235)
  doc.line(CONTENT_LEFT, CONTENT_TOP + 10.5, CONTENT_RIGHT, CONTENT_TOP + 10.5)

  let currentY = CONTENT_TOP + 15.5

  // STEP 2: Customer & Rental Metadata Section (2 Columns)
  const customer = invoice.customer || invoice.lessee_snapshot || {}
  const customerSnap = invoice.customer_snapshot || {}
  const vehicleSnap = invoice.rental_vehicle_snapshot || {}
  const booking = invoice.booking || {}

  const custName = customerSnap.full_name || customer.full_name || 'Valued Customer'
  const custPhone = customerSnap.mobile || customer.mobile || null
  const custEmail = customerSnap.email || customer.email || null
  const custCompany = customerSnap.company_name || customer.company_name || null
  const custAddress = customerSnap.address || customer.address || customer.address_line_1 || null

  const vehicleName = vehicleSnap.vehicle_name || invoice.vehicle_name || null
  const vehicleReg = vehicleSnap.registration_number || invoice.vehicle_registration || null
  const vehicleStr = vehicleName ? `${vehicleName}${vehicleReg ? ` (${vehicleReg})` : ''}` : (vehicleReg ? `Vehicle (${vehicleReg})` : null)

  const rentalStart = vehicleSnap.rental_start_date || invoice.rental_start_date || null
  const rentalEnd = vehicleSnap.rental_end_date || invoice.rental_end_date || null
  const rentalDays = vehicleSnap.rental_days || invoice.rental_days || null

  // LEFT COLUMN: INVOICE TO
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(217, 119, 6) // Amber / Gold #D97706
  doc.text('INVOICE TO:', CONTENT_LEFT, currentY)

  let leftY = currentY + 5
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  doc.setTextColor(23, 23, 26)
  doc.text(custName, CONTENT_LEFT, leftY)
  leftY += 4.5

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(55, 65, 81)
  if (custPhone) {
    doc.text(`Phone     : ${custPhone}`, CONTENT_LEFT, leftY)
    leftY += 4
  }
  if (custEmail) {
    doc.text(`Email      : ${custEmail}`, CONTENT_LEFT, leftY)
    leftY += 4
  }
  if (custCompany) {
    doc.text(`Company : ${custCompany}`, CONTENT_LEFT, leftY)
    leftY += 4
  }
  if (custAddress) {
    const addrLines = doc.splitTextToSize(`Address  : ${custAddress}`, 82)
    doc.text(addrLines, CONTENT_LEFT, leftY)
    leftY += addrLines.length * 3.5
  }

  // RIGHT COLUMN: INVOICE METADATA & RENTAL
  const rightX = 108
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(217, 119, 6) // Amber / Gold #D97706
  doc.text('INVOICE METADATA & RENTAL:', rightX, currentY)

  let rightY = currentY + 5
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(55, 65, 81)

  doc.text(`Due Date  : ${formatDateSafe(invoice.due_date || invoice.invoice_date)}`, rightX, rightY)
  rightY += 4

  if (invoice.payment_terms) {
    doc.text(`Terms       : ${invoice.payment_terms}`, rightX, rightY)
    rightY += 4
  }

  if (vehicleStr) {
    doc.text(`Vehicle    : ${vehicleStr}`, rightX, rightY)
    rightY += 4
  }

  if (rentalStart && rentalEnd) {
    const daysStr = rentalDays ? ` (${rentalDays} Days)` : ''
    doc.text(`Rental     : ${formatDateSafe(rentalStart)} to ${formatDateSafe(rentalEnd)}${daysStr}`, rightX, rightY)
    rightY += 4
  }

  if (booking.booking_number) {
    doc.text(`Booking   : #${booking.booking_number}`, rightX, rightY)
    rightY += 4
  } else if (invoice.quotation_number || invoice.quotation_id) {
    doc.text(`Quotation : #${invoice.quotation_number || 'N/A'}`, rightX, rightY)
    rightY += 4
  }

  currentY = Math.max(leftY, rightY) + 6

  // STEP 3: Items Table
  const tableHeaderY = currentY
  doc.setFillColor(23, 23, 26) // Black Header #17171A
  doc.rect(CONTENT_LEFT, tableHeaderY, CONTENT_WIDTH, 7, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(255, 255, 255)
  doc.text('#', 21, tableHeaderY + 4.5)
  doc.text('Description', 31, tableHeaderY + 4.5)
  doc.text('Qty', 118, tableHeaderY + 4.5, { align: 'right' })
  doc.text('Unit Price', 152, tableHeaderY + 4.5, { align: 'right' })
  doc.text('Line Total', CONTENT_RIGHT, tableHeaderY + 4.5, { align: 'right' })

  currentY = tableHeaderY + 7

  const items = invoice.items || []
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(31, 41, 55)

  function checkPageOverflow(neededHeight: number) {
    if (currentY + neededHeight > CONTENT_BOTTOM) {
      doc.addPage()
      if (base64Letterhead) {
        drawLetterheadOnPage(doc, base64Letterhead)
      }
      currentY = CONTENT_TOP

      // Draw table header continuation on new page
      doc.setFillColor(23, 23, 26)
      doc.rect(CONTENT_LEFT, currentY, CONTENT_WIDTH, 6, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7.5)
      doc.setTextColor(255, 255, 255)
      doc.text('#', 21, currentY + 4)
      doc.text('Description (Cont.)', 31, currentY + 4)
      doc.text('Qty', 118, currentY + 4, { align: 'right' })
      doc.text('Unit Price', 152, currentY + 4, { align: 'right' })
      doc.text('Line Total', CONTENT_RIGHT, currentY + 4, { align: 'right' })
      currentY += 6
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(31, 41, 55)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  items.forEach((it: any, idx: number) => {
    const rawDesc = String(it.description || 'Service Line Item')
    const descLines = doc.splitTextToSize(rawDesc, 82)
    const rowHeight = Math.max(6.5, descLines.length * 3.8 + 2)

    checkPageOverflow(rowHeight)

    if (idx % 2 === 1) {
      doc.setFillColor(249, 250, 251)
      doc.rect(CONTENT_LEFT, currentY, CONTENT_WIDTH, rowHeight, 'F')
    }

    doc.text(String(idx + 1), 21, currentY + 4.2)
    doc.text(descLines, 31, currentY + 4.2)
    doc.text(String(it.quantity || 1), 118, currentY + 4.2, { align: 'right' })
    doc.text(`LKR ${formatNumberSafe(it.unit_price)}`, 152, currentY + 4.2, { align: 'right' })
    doc.text(`LKR ${formatNumberSafe(it.line_total || (Number(it.quantity || 1) * Number(it.unit_price || 0)))}`, CONTENT_RIGHT, currentY + 4.2, { align: 'right' })

    currentY += rowHeight

    doc.setLineWidth(0.15)
    doc.setDrawColor(229, 231, 235)
    doc.line(CONTENT_LEFT, currentY, CONTENT_RIGHT, currentY)
  })

  currentY += 5

  // STEP 4: Financial Summary (Right) & Payment & Bank Details (Left)
  checkPageOverflow(55)

  const summaryStartY = currentY

  // LEFT SIDE: PAYMENT & BANK DETAILS
  let bankY = summaryStartY
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(217, 119, 6) // Amber / Gold #D97706
  doc.text('PAYMENT & BANK DETAILS:', CONTENT_LEFT, bankY)
  bankY += 4.5

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(55, 65, 81)
  doc.text(`Account Name : ${COMPANY_CONFIG.bank.accountName}`, CONTENT_LEFT, bankY)
  bankY += 4
  doc.text(`Bank         : ${COMPANY_CONFIG.bank.bankName}`, CONTENT_LEFT, bankY)
  bankY += 4
  doc.text(`Account No   : ${COMPANY_CONFIG.bank.accountNumber}`, CONTENT_LEFT, bankY)
  bankY += 4
  doc.text(`Swift Code   : ${COMPANY_CONFIG.bank.swiftCode}`, CONTENT_LEFT, bankY)
  bankY += 4

  // RIGHT SIDE: FINANCIAL BREAKDOWN SUMMARY
  let sumY = summaryStartY
  const sumLabelX = 108

  const financials = calculateCommercialInvoiceFinancials({
    subtotal: Number(invoice.subtotal),
    discount_amount: Number(invoice.discount_amount),
    total_deductions: Number(invoice.total_deductions),
    additional_charges: Number(invoice.additional_charges),
    tax_rate: Number(invoice.tax_rate),
    refundable_deposit: Number(invoice.refundable_deposit),
    amount_paid: Number(invoice.amount_paid),
  })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(55, 65, 81)

  doc.text('Subtotal', sumLabelX, sumY)
  doc.text(`LKR ${formatNumberSafe(financials.subtotal)}`, CONTENT_RIGHT, sumY, { align: 'right' })
  sumY += 4.5

  if (financials.discountAmount > 0) {
    const discLabel = invoice.discount_description ? `Discount (${invoice.discount_description})` : 'Discount'
    doc.text(discLabel, sumLabelX, sumY)
    doc.text(`- LKR ${formatNumberSafe(financials.discountAmount)}`, CONTENT_RIGHT, sumY, { align: 'right' })
    sumY += 4.5
  }

  // MULTIPLE DEDUCTIONS BREAKDOWN SUPPORT
  const deductionList = unwrapDeductionsRelation(
    invoice.deductions || invoice.deduction_items,
    Number(invoice.total_deductions),
    invoice.deduction_description
  )

  if (deductionList.length > 1) {
    doc.setFont('helvetica', 'bold')
    doc.text('Deductions:', sumLabelX, sumY)
    sumY += 4
    doc.setFont('helvetica', 'normal')
    for (const d of deductionList) {
      const label = d.description.length > 25 ? `${d.description.slice(0, 24)}...` : d.description
      doc.text(`  ${label}`, sumLabelX, sumY)
      doc.text(`- LKR ${formatNumberSafe(d.amount)}`, CONTENT_RIGHT, sumY, { align: 'right' })
      sumY += 4
    }
    doc.setFont('helvetica', 'bold')
    doc.text('Total Deductions', sumLabelX, sumY)
    doc.text(`- LKR ${formatNumberSafe(financials.deductions)}`, CONTENT_RIGHT, sumY, { align: 'right' })
    doc.setFont('helvetica', 'normal')
    sumY += 4.5
  } else if (financials.deductions > 0) {
    const dedLabel = invoice.deduction_description ? `Deductions (${invoice.deduction_description})` : 'Deductions'
    doc.text(dedLabel, sumLabelX, sumY)
    doc.text(`- LKR ${formatNumberSafe(financials.deductions)}`, CONTENT_RIGHT, sumY, { align: 'right' })
    sumY += 4.5
  }

  if (financials.additionalCharges > 0) {
    const addLabel = invoice.additional_charge_description ? `Additional Charges (${invoice.additional_charge_description})` : 'Additional Charges'
    doc.text(addLabel, sumLabelX, sumY)
    doc.text(`+ LKR ${formatNumberSafe(financials.additionalCharges)}`, CONTENT_RIGHT, sumY, { align: 'right' })
    sumY += 4.5
  }

  if (financials.taxAmount > 0) {
    doc.text(`Tax (${financials.taxRate}%)`, sumLabelX, sumY)
    doc.text(`LKR ${formatNumberSafe(financials.taxAmount)}`, CONTENT_RIGHT, sumY, { align: 'right' })
    sumY += 4.5
  }

  if (financials.refundableDeposit > 0) {
    doc.text('Refundable Deposit (Separate)', sumLabelX, sumY)
    doc.text(`LKR ${formatNumberSafe(financials.refundableDeposit)}`, CONTENT_RIGHT, sumY, { align: 'right' })
    sumY += 4.5
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(23, 23, 26)
  doc.text('Net Amount', sumLabelX, sumY)
  doc.text(`LKR ${formatNumberSafe(financials.netAmount)}`, CONTENT_RIGHT, sumY, { align: 'right' })
  sumY += 4.5

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(55, 65, 81)
  doc.text('Amount Paid', sumLabelX, sumY)
  doc.text(`- LKR ${formatNumberSafe(financials.amountPaid)}`, CONTENT_RIGHT, sumY, { align: 'right' })
  sumY += 5.5

  // BALANCE DUE BAR
  const barWidth = CONTENT_RIGHT - 105
  doc.setFillColor(23, 23, 26) // Black Bar #17171A
  doc.rect(105, sumY - 4, barWidth, 8, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(245, 158, 11) // Gold/Yellow Text #F59E0B
  doc.text('BALANCE DUE', 108, sumY + 1.5)
  doc.text(`LKR ${formatNumberSafe(financials.balanceDue)}`, CONTENT_RIGHT - 3, sumY + 1.5, { align: 'right' })

  currentY = Math.max(bankY, sumY + 10) + 4

  // STEP 5: Special Notes & Terms & Conditions
  checkPageOverflow(40)

  // SPECIAL NOTES
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(217, 119, 6) // Amber / Gold #D97706
  doc.text('SPECIAL NOTES:', CONTENT_LEFT, currentY)
  currentY += 4.5

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(75, 85, 99)
  const specialNotesText = String(invoice.special_notes || COMPANY_CONFIG.defaultInvoiceSpecialNotes)
  const specialLines = doc.splitTextToSize(specialNotesText, CONTENT_WIDTH)
  doc.text(specialLines, CONTENT_LEFT, currentY)
  currentY += specialLines.length * 3.5 + 4.5

  // IMPORTANT TERMS & CONDITIONS
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(217, 119, 6) // Amber / Gold #D97706
  doc.text('IMPORTANT TERMS & CONDITIONS:', CONTENT_LEFT, currentY)
  currentY += 4.5

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(75, 85, 99)
  const termsText = String(invoice.terms_and_conditions || invoice.important_message || COMPANY_CONFIG.defaultInvoiceImportantTerms)
  const termsLines = doc.splitTextToSize(termsText, CONTENT_WIDTH)
  doc.text(termsLines, CONTENT_LEFT, currentY)
  currentY += termsLines.length * 3.5 + 6

  // STEP 6: Prepared By Section
  checkPageOverflow(25)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(217, 119, 6) // Amber / Gold #D97706
  doc.text('PREPARED BY:', CONTENT_LEFT, currentY)
  currentY += 4.5

  const staffName = invoice.prepared_by_name_snapshot || invoice.prepared_by_profile?.full_name || 'S Madushani'
  const staffDesignation = invoice.prepared_by_designation_snapshot || 'HR & Account Executive'

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(23, 23, 26)
  doc.text(staffName, CONTENT_LEFT, currentY)
  currentY += 4

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(75, 85, 99)
  doc.text(staffDesignation, CONTENT_LEFT, currentY)
  currentY += 3.5
  doc.text(COMPANY_CONFIG.name, CONTENT_LEFT, currentY)

  // STEP 7: Page Number Overlay Across All Pages
  const totalPages = (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages()

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(107, 114, 128)
    doc.text(`Page ${i} of ${totalPages}`, CONTENT_RIGHT, 291, { align: 'right' })
  }

  return doc
}
