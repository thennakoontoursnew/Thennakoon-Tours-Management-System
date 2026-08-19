import { jsPDF, getLetterheadBase64, drawLetterheadOnPage } from './pdf-engine'
import { COMPANY_CONFIG } from '../company-config'
import { calculateCommercialInvoiceFinancials, unwrapDeductionsRelation } from '../utils/relation-utils'

// CANONICAL BRAND ACCENT COLOR (RGB matching Thennakoon Tours letterhead gold #D97706)
const BRAND_GOLD_R = 217
const BRAND_GOLD_G = 119
const BRAND_GOLD_B = 6

function setBrandGoldText(doc: jsPDF) {
  doc.setTextColor(BRAND_GOLD_R, BRAND_GOLD_G, BRAND_GOLD_B)
}

function hasMeaningfulValue(val: unknown): boolean {
  if (val === null || val === undefined) return false
  const str = String(val).trim()
  if (!str) return false
  const lower = str.toLowerCase()
  return !['n/a', 'na', '-', 'null', 'undefined', 'none'].includes(lower)
}

function formatNumberSafe(val: unknown, decimals: number = 2): string {
  const num = Number(val ?? 0)
  if (isNaN(num)) return '0.00'
  return num.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

function formatDateSafe(val: unknown): string {
  if (!hasMeaningfulValue(val)) return ''
  try {
    const d = new Date(String(val))
    if (isNaN(d.getTime())) return ''
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return ''
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
  doc.setFontSize(21)
  doc.setTextColor(23, 23, 26) // Dark Black #17171A
  doc.text('INVOICE', CONTENT_LEFT, CONTENT_TOP)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(75, 85, 99)
  const formattedInvoiceDate = formatDateSafe(invoice.invoice_date)
  if (formattedInvoiceDate) {
    doc.text(`Invoice Date: ${formattedInvoiceDate}`, CONTENT_LEFT, CONTENT_TOP + 5.5)
  }

  // Right: Invoice Number Block
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(107, 114, 128)
  doc.text('INVOICE NO:', CONTENT_RIGHT, CONTENT_TOP, { align: 'right' })

  doc.setFontSize(13.5)
  doc.setTextColor(23, 23, 26)
  doc.text(invoice.invoice_number || 'TT-IN-10001', CONTENT_RIGHT, CONTENT_TOP + 5.5, { align: 'right' })

  // Divider Line
  doc.setLineWidth(0.2)
  doc.setDrawColor(229, 231, 235)
  doc.line(CONTENT_LEFT, CONTENT_TOP + 10, CONTENT_RIGHT, CONTENT_TOP + 10)

  let currentY = CONTENT_TOP + 15

  // STEP 2: Customer & Rental Metadata Section (2 Columns with Conditional Rendering)
  const customer = invoice.customer || invoice.lessee_snapshot || {}
  const customerSnap = invoice.customer_snapshot || {}
  const vehicleSnap = invoice.rental_vehicle_snapshot || {}
  const booking = invoice.booking || {}

  const custName = hasMeaningfulValue(customerSnap.full_name)
    ? customerSnap.full_name
    : (hasMeaningfulValue(customer.full_name) ? customer.full_name : 'Valued Customer')

  const custPhone = hasMeaningfulValue(customerSnap.mobile)
    ? customerSnap.mobile
    : (hasMeaningfulValue(customer.mobile) ? customer.mobile : null)

  const custEmail = hasMeaningfulValue(customerSnap.email)
    ? customerSnap.email
    : (hasMeaningfulValue(customer.email) ? customer.email : null)

  const custCompany = hasMeaningfulValue(customerSnap.company_name)
    ? customerSnap.company_name
    : (hasMeaningfulValue(customer.company_name) ? customer.company_name : null)

  const custAddress = hasMeaningfulValue(customerSnap.address)
    ? customerSnap.address
    : (hasMeaningfulValue(customer.address) ? customer.address : (hasMeaningfulValue(customer.address_line_1) ? customer.address_line_1 : null))

  const vehicleName = hasMeaningfulValue(vehicleSnap.vehicle_name)
    ? vehicleSnap.vehicle_name
    : (hasMeaningfulValue(invoice.vehicle_name) ? invoice.vehicle_name : null)

  const vehicleReg = hasMeaningfulValue(vehicleSnap.registration_number)
    ? vehicleSnap.registration_number
    : (hasMeaningfulValue(invoice.vehicle_registration) ? invoice.vehicle_registration : null)

  const vehicleStr = vehicleName ? `${vehicleName}${vehicleReg ? ` (${vehicleReg})` : ''}` : (vehicleReg ? `Vehicle (${vehicleReg})` : null)

  const rentalStart = hasMeaningfulValue(vehicleSnap.rental_start_date)
    ? vehicleSnap.rental_start_date
    : (hasMeaningfulValue(invoice.rental_start_date) ? invoice.rental_start_date : null)

  const rentalEnd = hasMeaningfulValue(vehicleSnap.rental_end_date)
    ? vehicleSnap.rental_end_date
    : (hasMeaningfulValue(invoice.rental_end_date) ? invoice.rental_end_date : null)

  const rentalDays = hasMeaningfulValue(vehicleSnap.rental_days)
    ? vehicleSnap.rental_days
    : (hasMeaningfulValue(invoice.rental_days) ? invoice.rental_days : null)

  // LEFT COLUMN: INVOICE TO
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  setBrandGoldText(doc) // Canonical Brand Gold #D97706
  doc.text('INVOICE TO:', CONTENT_LEFT, currentY)

  let leftY = currentY + 5
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.2)
  doc.setTextColor(23, 23, 26)
  doc.text(custName, CONTENT_LEFT, leftY)
  leftY += 4.5

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.2)
  doc.setTextColor(55, 65, 81)
  if (custPhone) {
    doc.text(`Phone     : ${custPhone}`, CONTENT_LEFT, leftY)
    leftY += 4.2
  }
  if (custEmail) {
    doc.text(`Email      : ${custEmail}`, CONTENT_LEFT, leftY)
    leftY += 4.2
  }
  if (custCompany) {
    doc.text(`Company : ${custCompany}`, CONTENT_LEFT, leftY)
    leftY += 4.2
  }
  if (custAddress) {
    const addrLines = doc.splitTextToSize(`Address  : ${custAddress}`, 82)
    doc.text(addrLines, CONTENT_LEFT, leftY)
    leftY += addrLines.length * 3.8
  }

  // RIGHT COLUMN: INVOICE METADATA & RENTAL
  const rightX = 108
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  setBrandGoldText(doc) // Canonical Brand Gold #D97706
  doc.text('INVOICE METADATA & RENTAL:', rightX, currentY)

  let rightY = currentY + 5
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.2)
  doc.setTextColor(55, 65, 81)

  const formattedDueDate = formatDateSafe(invoice.due_date || invoice.invoice_date)
  if (formattedDueDate) {
    doc.text(`Due Date  : ${formattedDueDate}`, rightX, rightY)
    rightY += 4.2
  }

  if (hasMeaningfulValue(invoice.payment_terms)) {
    doc.text(`Terms       : ${invoice.payment_terms}`, rightX, rightY)
    rightY += 4.2
  }

  if (vehicleStr) {
    doc.text(`Vehicle    : ${vehicleStr}`, rightX, rightY)
    rightY += 4.2
  }

  if (rentalStart && rentalEnd) {
    const daysStr = rentalDays ? ` (${rentalDays} Days)` : ''
    doc.text(`Rental Period : ${formatDateSafe(rentalStart)} to ${formatDateSafe(rentalEnd)}${daysStr}`, rightX, rightY)
    rightY += 4.2
  }

  if (hasMeaningfulValue(booking.booking_number)) {
    doc.text(`Booking   : #${booking.booking_number}`, rightX, rightY)
    rightY += 4.2
  } else if (hasMeaningfulValue(invoice.quotation_number) || hasMeaningfulValue(invoice.quotation_id)) {
    doc.text(`Quotation : #${invoice.quotation_number}`, rightX, rightY)
    rightY += 4.2
  }

  currentY = Math.max(leftY, rightY) + 5.5

  // STEP 3: Items Table (Explicit Non-Clipping Column Proportions & Approved Reference Scale)
  const tableHeaderY = currentY
  doc.setFillColor(23, 23, 26) // Black Header #17171A
  doc.rect(CONTENT_LEFT, tableHeaderY, CONTENT_WIDTH, 7.5, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(255, 255, 255)
  doc.text('#', 22, tableHeaderY + 4.8, { align: 'center' })
  doc.text('Description', 28, tableHeaderY + 4.8)
  doc.text('Qty', 124, tableHeaderY + 4.8, { align: 'right' })
  doc.text('Unit Price', 156, tableHeaderY + 4.8, { align: 'right' })
  doc.text('Line Total', 189, tableHeaderY + 4.8, { align: 'right' })

  currentY = tableHeaderY + 7.5

  const items = invoice.items || []
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.2)
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
      doc.rect(CONTENT_LEFT, currentY, CONTENT_WIDTH, 7, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(255, 255, 255)
      doc.text('#', 22, currentY + 4.5, { align: 'center' })
      doc.text('Description (Cont.)', 28, currentY + 4.5)
      doc.text('Qty', 124, currentY + 4.5, { align: 'right' })
      doc.text('Unit Price', 156, currentY + 4.5, { align: 'right' })
      doc.text('Line Total', 189, currentY + 4.5, { align: 'right' })
      currentY += 7
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8.2)
      doc.setTextColor(31, 41, 55)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  items.forEach((it: any, idx: number) => {
    const rawDesc = String(it.description || 'Service Line Item')
    const descLines = doc.splitTextToSize(rawDesc, 78)
    const rowHeight = Math.max(7, descLines.length * 3.8 + 2.5)

    checkPageOverflow(rowHeight)

    if (idx % 2 === 1) {
      doc.setFillColor(249, 250, 251)
      doc.rect(CONTENT_LEFT, currentY, CONTENT_WIDTH, rowHeight, 'F')
    }

    doc.text(String(idx + 1), 22, currentY + 4.5, { align: 'center' })
    doc.text(descLines, 28, currentY + 4.5)
    doc.text(String(it.quantity || 1), 124, currentY + 4.5, { align: 'right' })
    doc.text(`LKR ${formatNumberSafe(it.unit_price)}`, 156, currentY + 4.5, { align: 'right' })
    doc.text(`LKR ${formatNumberSafe(it.line_total || (Number(it.quantity || 1) * Number(it.unit_price || 0)))}`, 189, currentY + 4.5, { align: 'right' })

    currentY += rowHeight

    doc.setLineWidth(0.15)
    doc.setDrawColor(229, 231, 235)
    doc.line(CONTENT_LEFT, currentY, CONTENT_RIGHT, currentY)
  })

  currentY += 5

  // STEP 4: Financial Two-Column Block (Bank Details Left / Summary Right)
  checkPageOverflow(55)

  const summaryStartY = currentY

  // LEFT SIDE: PAYMENT & BANK DETAILS
  let bankY = summaryStartY
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  setBrandGoldText(doc) // Canonical Brand Gold #D97706
  doc.text('PAYMENT & BANK DETAILS:', CONTENT_LEFT, bankY)
  bankY += 4.8

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.2)
  doc.setTextColor(55, 65, 81)
  doc.text(`Account Name : ${COMPANY_CONFIG.bank.accountName}`, CONTENT_LEFT, bankY)
  bankY += 4.2
  doc.text(`Bank         : ${COMPANY_CONFIG.bank.bankName}`, CONTENT_LEFT, bankY)
  bankY += 4.2
  doc.text(`Account No   : ${COMPANY_CONFIG.bank.accountNumber}`, CONTENT_LEFT, bankY)
  bankY += 4.2
  doc.text(`Swift Code   : ${COMPANY_CONFIG.bank.swiftCode}`, CONTENT_LEFT, bankY)
  bankY += 4.2

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
  doc.setFontSize(8.2)
  doc.setTextColor(55, 65, 81)

  // Subtotal (Always rendered)
  doc.text('Subtotal', sumLabelX, sumY)
  doc.text(`LKR ${formatNumberSafe(financials.subtotal)}`, 189, sumY, { align: 'right' })
  sumY += 4.5

  // Discount (Render ONLY if > 0 or has description)
  if (financials.discountAmount > 0 || hasMeaningfulValue(invoice.discount_description)) {
    const discLabel = hasMeaningfulValue(invoice.discount_description) ? `Discount (${invoice.discount_description})` : 'Discount'
    doc.text(discLabel, sumLabelX, sumY)
    doc.text(`- LKR ${formatNumberSafe(financials.discountAmount)}`, 189, sumY, { align: 'right' })
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
    sumY += 4.2
    doc.setFont('helvetica', 'normal')
    for (const d of deductionList) {
      const label = d.description.length > 24 ? `${d.description.slice(0, 23)}...` : d.description
      doc.text(`  ${label}`, sumLabelX, sumY)
      doc.text(`- LKR ${formatNumberSafe(d.amount)}`, 189, sumY, { align: 'right' })
      sumY += 4.2
    }
    doc.setFont('helvetica', 'bold')
    doc.text('Total Deductions', sumLabelX, sumY)
    doc.text(`- LKR ${formatNumberSafe(financials.deductions)}`, 189, sumY, { align: 'right' })
    doc.setFont('helvetica', 'normal')
    sumY += 4.5
  } else if (financials.deductions > 0) {
    const dedLabel = hasMeaningfulValue(invoice.deduction_description) ? `Deductions (${invoice.deduction_description})` : 'Deductions'
    doc.text(dedLabel, sumLabelX, sumY)
    doc.text(`- LKR ${formatNumberSafe(financials.deductions)}`, 189, sumY, { align: 'right' })
    sumY += 4.5
  }

  // Additional Charges (Render ONLY if > 0)
  if (financials.additionalCharges > 0) {
    const addLabel = hasMeaningfulValue(invoice.additional_charge_description) ? `Additional Charges (${invoice.additional_charge_description})` : 'Additional Charges'
    doc.text(addLabel, sumLabelX, sumY)
    doc.text(`+ LKR ${formatNumberSafe(financials.additionalCharges)}`, 189, sumY, { align: 'right' })
    sumY += 4.5
  }

  // Tax (Render ONLY if > 0)
  if (financials.taxAmount > 0) {
    doc.text(`Tax (${financials.taxRate}%)`, sumLabelX, sumY)
    doc.text(`LKR ${formatNumberSafe(financials.taxAmount)}`, 189, sumY, { align: 'right' })
    sumY += 4.5
  }

  // Refundable Deposit (Render ONLY if > 0)
  if (financials.refundableDeposit > 0) {
    doc.text('Refundable Deposit (Separate)', sumLabelX, sumY)
    doc.text(`LKR ${formatNumberSafe(financials.refundableDeposit)}`, 189, sumY, { align: 'right' })
    sumY += 4.5
  }

  // Net Amount (Always rendered)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(23, 23, 26)
  doc.text('Net Amount', sumLabelX, sumY)
  doc.text(`LKR ${formatNumberSafe(financials.netAmount)}`, 189, sumY, { align: 'right' })
  sumY += 4.5

  // Amount Paid
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.2)
  doc.setTextColor(55, 65, 81)
  doc.text('Amount Paid', sumLabelX, sumY)
  doc.text(`- LKR ${formatNumberSafe(financials.amountPaid)}`, 189, sumY, { align: 'right' })
  sumY += 6

  // BALANCE DUE BAR (BELONGS STRICTLY TO FINANCIAL SUMMARY COLUMN)
  const barWidth = 192 - 105
  const barHeight = 8.5
  doc.setFillColor(23, 23, 26) // Black Bar #17171A
  doc.rect(105, sumY - 4, barWidth, barHeight, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  setBrandGoldText(doc) // Canonical Brand Gold #D97706
  doc.text('BALANCE DUE', 108, sumY + 1.8)
  doc.text(`LKR ${formatNumberSafe(financials.balanceDue)}`, 189, sumY + 1.8, { align: 'right' })
  sumY += barHeight

  // Calculate bottom Y of 2-column block (MAX height of Bank details vs Financial summary)
  const bankBlockBottom = bankY
  const summaryBlockBottom = sumY
  const financeTwoColumnBottom = Math.max(bankBlockBottom, summaryBlockBottom)

  // Next full-width section starts strictly BELOW both columns with 6.5mm gap
  currentY = financeTwoColumnBottom + 6.5

  // STEP 5: Special Notes & Terms & Conditions (Conditional Rendering)
  const specialNotesText = String(invoice.special_notes || COMPANY_CONFIG.defaultInvoiceSpecialNotes)
  const termsText = String(invoice.terms_and_conditions || invoice.important_message || COMPANY_CONFIG.defaultInvoiceImportantTerms)

  if (hasMeaningfulValue(specialNotesText)) {
    checkPageOverflow(22)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    setBrandGoldText(doc) // Canonical Brand Gold #D97706
    doc.text('SPECIAL NOTES:', CONTENT_LEFT, currentY)
    currentY += 4.5

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.8)
    doc.setTextColor(75, 85, 99)
    const specialLines = doc.splitTextToSize(specialNotesText, CONTENT_WIDTH)
    doc.text(specialLines, CONTENT_LEFT, currentY)
    currentY += specialLines.length * 3.4 + 5
  }

  if (hasMeaningfulValue(termsText)) {
    checkPageOverflow(22)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    setBrandGoldText(doc) // Canonical Brand Gold #D97706
    doc.text('IMPORTANT TERMS & CONDITIONS:', CONTENT_LEFT, currentY)
    currentY += 4.5

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.8)
    doc.setTextColor(75, 85, 99)
    const termsLines = doc.splitTextToSize(termsText, CONTENT_WIDTH)
    doc.text(termsLines, CONTENT_LEFT, currentY)
    currentY += termsLines.length * 3.4 + 6
  }

  // STEP 6: Prepared By Section
  checkPageOverflow(22)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  setBrandGoldText(doc) // Canonical Brand Gold #D97706
  doc.text('PREPARED BY:', CONTENT_LEFT, currentY)
  currentY += 4.5

  const staffName = invoice.prepared_by_name_snapshot || invoice.prepared_by_profile?.full_name || 'S Madushani'
  const staffDesignation = invoice.prepared_by_designation_snapshot || 'HR & Account Executive'

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.8)
  doc.setTextColor(23, 23, 26)
  doc.text(staffName, CONTENT_LEFT, currentY)
  currentY += 4.2

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(75, 85, 99)
  doc.text(staffDesignation, CONTENT_LEFT, currentY)
  currentY += 3.8
  doc.text(COMPANY_CONFIG.name, CONTENT_LEFT, currentY)

  // STEP 7: Page Number Overlay Across All Pages
  const totalPages = (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages()

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(107, 114, 128)
    doc.text(`Page ${i} of ${totalPages}`, CONTENT_RIGHT, 291, { align: 'right' })
  }

  return doc
}
