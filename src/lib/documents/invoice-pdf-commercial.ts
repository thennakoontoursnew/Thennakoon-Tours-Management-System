import { jsPDF, getLetterheadBase64, drawLetterheadOnPage } from './pdf-engine'
import { COMPANY_CONFIG } from '../company-config'
import { calculateCommercialInvoiceFinancials, unwrapDeductionsRelation } from '../utils/relation-utils'
import {
  PDF_COLORS,
  PDF_TYPOGRAPHY,
  setPdfBrandGoldText,
  setPdfDarkText,
  setPdfDarkFill,
  setPdfBodyText,
  setPdfMutedText,
  setPdfWhiteText,
} from './pdf-theme'

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
const CONTENT_TOP = 36
const CONTENT_BOTTOM = 245
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

  // STEP 1: Top Right Header Block (Cleanly right-aligned on Top Right; Top Left is reserved for pre-printed letterhead logo)
  let currentY = CONTENT_TOP

  // Title: INVOICE (Bold, prominent)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  setPdfDarkText(doc)
  doc.text('INVOICE', CONTENT_RIGHT, currentY, { align: 'right' })

  // Invoice Date
  currentY += 6.5
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  setPdfMutedText(doc)
  const formattedInvoiceDate = formatDateSafe(invoice.invoice_date)
  if (formattedInvoiceDate) {
    doc.text(`Invoice Date: ${formattedInvoiceDate}`, CONTENT_RIGHT, currentY, { align: 'right' })
    currentY += 5
  }

  // INVOICE NO
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  setPdfDarkText(doc)
  doc.text(`INVOICE NO: ${invoice.invoice_number || 'TT-IN-10001'}`, CONTENT_RIGHT, currentY, { align: 'right' })

  // Divider Line below Header
  currentY += 4.5
  doc.setLineWidth(0.25)
  doc.setDrawColor(PDF_COLORS.border.rgb[0], PDF_COLORS.border.rgb[1], PDF_COLORS.border.rgb[2])
  doc.line(CONTENT_LEFT, currentY, CONTENT_RIGHT, currentY)

  currentY += 5.5

  // STEP 2: 2-Column Details Block
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

  const vehicleStr = vehicleName
    ? `${vehicleName}${vehicleReg ? ` (${vehicleReg})` : ''}`
    : (vehicleReg ? `Vehicle (${vehicleReg})` : null)

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
  doc.setFontSize(PDF_TYPOGRAPHY.sectionHeading)
  setPdfBrandGoldText(doc) // Canonical Brand Gold #D97706
  doc.text('INVOICE TO:', CONTENT_LEFT, currentY)

  let leftY = currentY + 5
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(PDF_TYPOGRAPHY.customerName)
  setPdfDarkText(doc)
  doc.text(custName, CONTENT_LEFT, leftY)
  leftY += 4.5

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(PDF_TYPOGRAPHY.metadata)
  setPdfBodyText(doc)

  if (custPhone) {
    doc.text(`Phone     : ${custPhone}`, CONTENT_LEFT, leftY)
    leftY += 4.5
  }
  if (custEmail) {
    doc.text(`Email      : ${custEmail}`, CONTENT_LEFT, leftY)
    leftY += 4.5
  }
  if (custCompany) {
    doc.text(`Company : ${custCompany}`, CONTENT_LEFT, leftY)
    leftY += 4.5
  }
  if (custAddress) {
    const addrLines = doc.splitTextToSize(`Address  : ${custAddress}`, 82)
    doc.text(addrLines, CONTENT_LEFT, leftY)
    leftY += addrLines.length * 4.2
  }

  // RIGHT COLUMN: INVOICE METADATA & RENTAL
  const rightX = 108
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(PDF_TYPOGRAPHY.sectionHeading)
  setPdfBrandGoldText(doc) // Canonical Brand Gold #D97706
  doc.text('INVOICE METADATA & RENTAL:', rightX, currentY)

  let rightY = currentY + 5
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(PDF_TYPOGRAPHY.metadata)
  setPdfBodyText(doc)

  const formattedDueDate = formatDateSafe(invoice.due_date || invoice.invoice_date)
  if (formattedDueDate) {
    doc.text(`Due Date       : ${formattedDueDate}`, rightX, rightY)
    rightY += 4.5
  }

  if (hasMeaningfulValue(invoice.payment_terms)) {
    doc.text(`Terms            : ${invoice.payment_terms}`, rightX, rightY)
    rightY += 4.5
  }

  if (vehicleStr) {
    doc.text(`Vehicle         : ${vehicleStr}`, rightX, rightY)
    rightY += 4.5
  }

  if (rentalStart && rentalEnd) {
    const daysStr = rentalDays ? ` (${rentalDays} Days)` : ''
    doc.text(`Rental Period : ${formatDateSafe(rentalStart)} to ${formatDateSafe(rentalEnd)}${daysStr}`, rightX, rightY)
    rightY += 4.5
  }

  if (hasMeaningfulValue(booking.booking_number)) {
    doc.text(`Booking        : #${booking.booking_number}`, rightX, rightY)
    rightY += 4.5
  } else if (hasMeaningfulValue(invoice.quotation_number) || hasMeaningfulValue(invoice.quotation_id)) {
    doc.text(`Quotation     : #${invoice.quotation_number}`, rightX, rightY)
    rightY += 4.5
  }

  currentY = Math.max(leftY, rightY) + 6

  // STEP 3: Items Table (Solid Cell Borders & Clean Vertical Padding)
  const tableHeaderY = currentY
  const headerHeight = 8
  setPdfDarkFill(doc) // Black Header #17171A
  doc.rect(CONTENT_LEFT, tableHeaderY, CONTENT_WIDTH, headerHeight, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(PDF_TYPOGRAPHY.tableHeader)
  setPdfWhiteText(doc)
  doc.text('#', 22, tableHeaderY + 5.5, { align: 'center' })
  doc.text('Description', 28, tableHeaderY + 5.5)
  doc.text('Qty', 124, tableHeaderY + 5.5, { align: 'right' })
  doc.text('Unit Price', 156, tableHeaderY + 5.5, { align: 'right' })
  doc.text('Line Total', 189, tableHeaderY + 5.5, { align: 'right' })

  currentY = tableHeaderY + headerHeight

  const items = invoice.items || []
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(PDF_TYPOGRAPHY.tableBody)
  setPdfBodyText(doc)

  function checkPageOverflow(neededHeight: number, isTableContext: boolean = false) {
    if (currentY + neededHeight > CONTENT_BOTTOM) {
      doc.addPage()
      if (base64Letterhead) {
        drawLetterheadOnPage(doc, base64Letterhead)
      }
      currentY = CONTENT_TOP

      if (isTableContext) {
        setPdfDarkFill(doc)
        doc.rect(CONTENT_LEFT, currentY, CONTENT_WIDTH, headerHeight, 'F')
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(PDF_TYPOGRAPHY.tableHeader)
        setPdfWhiteText(doc)
        doc.text('#', 22, currentY + 5.5, { align: 'center' })
        doc.text('Description (Cont.)', 28, currentY + 5.5)
        doc.text('Qty', 124, currentY + 5.5, { align: 'right' })
        doc.text('Unit Price', 156, currentY + 5.5, { align: 'right' })
        doc.text('Line Total', 189, currentY + 5.5, { align: 'right' })
        currentY += headerHeight
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(PDF_TYPOGRAPHY.tableBody)
        setPdfBodyText(doc)
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  items.forEach((it: any, idx: number) => {
    const rawDesc = String(it.description || 'Service Line Item')
    const descLines = doc.splitTextToSize(rawDesc, 78)
    const rowHeight = Math.max(7.5, descLines.length * 4 + 2.5)

    checkPageOverflow(rowHeight, true)

    if (idx % 2 === 1) {
      doc.setFillColor(PDF_COLORS.alternateRow.rgb[0], PDF_COLORS.alternateRow.rgb[1], PDF_COLORS.alternateRow.rgb[2])
      doc.rect(CONTENT_LEFT, currentY, CONTENT_WIDTH, rowHeight, 'F')
    }

    doc.text(String(idx + 1), 22, currentY + 5, { align: 'center' })
    doc.text(descLines, 28, currentY + 5)
    doc.text(String(it.quantity || 1), 124, currentY + 5, { align: 'right' })
    doc.text(`LKR ${formatNumberSafe(it.unit_price)}`, 156, currentY + 5, { align: 'right' })
    doc.text(`LKR ${formatNumberSafe(it.line_total || (Number(it.quantity || 1) * Number(it.unit_price || 0)))}`, 189, currentY + 5, { align: 'right' })

    currentY += rowHeight

    doc.setLineWidth(0.15)
    doc.setDrawColor(PDF_COLORS.border.rgb[0], PDF_COLORS.border.rgb[1], PDF_COLORS.border.rgb[2])
    doc.line(CONTENT_LEFT, currentY, CONTENT_RIGHT, currentY)
  })

  // STEP 4: Split Bottom Section (Above the pre-printed letterhead footer)
  currentY += 6

  checkPageOverflow(55, false)

  const summaryStartY = currentY

  // LEFT SIDE: PAYMENT & BANK DETAILS, NOTES, TERMS, PREPARED BY
  let leftStackY = summaryStartY

  // 4a. PAYMENT & BANK DETAILS
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(PDF_TYPOGRAPHY.sectionHeading)
  setPdfBrandGoldText(doc)
  doc.text('PAYMENT & BANK DETAILS:', CONTENT_LEFT, leftStackY)
  leftStackY += 4.5

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(PDF_TYPOGRAPHY.body)
  setPdfBodyText(doc)

  const bankLabels = [
    { label: 'Account Name', val: COMPANY_CONFIG.bank.accountName },
    { label: 'Bank', val: COMPANY_CONFIG.bank.bankName },
    { label: 'Account No', val: COMPANY_CONFIG.bank.accountNumber },
    { label: 'Swift Code', val: COMPANY_CONFIG.bank.swiftCode },
  ]

  for (const b of bankLabels) {
    doc.text(b.label, CONTENT_LEFT, leftStackY)
    doc.text(':', CONTENT_LEFT + 25, leftStackY)
    doc.text(b.val, CONTENT_LEFT + 28, leftStackY)
    leftStackY += 4.2
  }

  leftStackY += 3.5

  // 4b. SPECIAL NOTES
  const specialNotesText = String(invoice.special_notes || COMPANY_CONFIG.defaultInvoiceSpecialNotes)
  if (hasMeaningfulValue(specialNotesText)) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(PDF_TYPOGRAPHY.sectionHeading)
    setPdfBrandGoldText(doc)
    doc.text('SPECIAL NOTES:', CONTENT_LEFT, leftStackY)
    leftStackY += 4.5

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(PDF_TYPOGRAPHY.notes)
    setPdfMutedText(doc)
    const specialLines = doc.splitTextToSize(specialNotesText, 82)
    doc.text(specialLines, CONTENT_LEFT, leftStackY)
    leftStackY += specialLines.length * 3.8 + 3.5
  }

  // 4c. IMPORTANT TERMS & CONDITIONS
  const termsText = String(invoice.terms_and_conditions || invoice.important_message || COMPANY_CONFIG.defaultInvoiceImportantTerms)
  if (hasMeaningfulValue(termsText)) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(PDF_TYPOGRAPHY.sectionHeading)
    setPdfBrandGoldText(doc)
    doc.text('IMPORTANT TERMS & CONDITIONS:', CONTENT_LEFT, leftStackY)
    leftStackY += 4.5

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(PDF_TYPOGRAPHY.notes)
    setPdfMutedText(doc)
    const termsLines = doc.splitTextToSize(termsText, 82)
    doc.text(termsLines, CONTENT_LEFT, leftStackY)
    leftStackY += termsLines.length * 3.8 + 3.5
  }

  // 4d. PREPARED BY (Positioned cleanly on left above circular stamp)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(PDF_TYPOGRAPHY.sectionHeading)
  setPdfBrandGoldText(doc)
  doc.text('PREPARED BY:', CONTENT_LEFT, leftStackY)
  leftStackY += 4.5

  const staffName = invoice.prepared_by_name_snapshot || invoice.prepared_by_profile?.full_name || 'S Madushani'
  const staffDesignation = invoice.prepared_by_designation_snapshot || 'HR & Account Executive'

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(PDF_TYPOGRAPHY.preparedByName)
  setPdfDarkText(doc)
  doc.text(staffName, CONTENT_LEFT, leftStackY)
  leftStackY += 4.2

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(PDF_TYPOGRAPHY.preparedByDetails)
  setPdfMutedText(doc)
  doc.text(staffDesignation, CONTENT_LEFT, leftStackY)
  leftStackY += 3.8
  doc.text(COMPANY_CONFIG.name, CONTENT_LEFT, leftStackY)

  // RIGHT SIDE: FINANCIAL SUMMARY BOX (Aligned with Table Right Edge at 192mm)
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
  doc.setFontSize(PDF_TYPOGRAPHY.financialRow)
  setPdfBodyText(doc)

  const finRowHeight = 4.5

  // Subtotal (Always rendered)
  doc.text('Subtotal', sumLabelX, sumY)
  doc.text(`LKR ${formatNumberSafe(financials.subtotal)}`, 189, sumY, { align: 'right' })
  sumY += finRowHeight

  // Discount (Render ONLY if > 0)
  if (financials.discountAmount > 0 || hasMeaningfulValue(invoice.discount_description)) {
    const discLabel = hasMeaningfulValue(invoice.discount_description) ? `Discount (${invoice.discount_description})` : 'Discount'
    const discLabelClean = discLabel.length > 30 ? `${discLabel.slice(0, 29)}...` : discLabel
    doc.text(discLabelClean, sumLabelX, sumY)
    doc.text(`- LKR ${formatNumberSafe(financials.discountAmount)}`, 189, sumY, { align: 'right' })
    sumY += finRowHeight
  }

  // Deductions (Render ONLY if > 0)
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
    sumY += finRowHeight
  } else if (financials.deductions > 0) {
    const dedLabel = hasMeaningfulValue(invoice.deduction_description) ? `Deductions (${invoice.deduction_description})` : 'Deductions'
    const dedLabelClean = dedLabel.length > 30 ? `${dedLabel.slice(0, 29)}...` : dedLabel
    doc.text(dedLabelClean, sumLabelX, sumY)
    doc.text(`- LKR ${formatNumberSafe(financials.deductions)}`, 189, sumY, { align: 'right' })
    sumY += finRowHeight
  }

  // Additional Charges (Render ONLY if > 0)
  if (financials.additionalCharges > 0) {
    const addLabel = hasMeaningfulValue(invoice.additional_charge_description) ? `Add. Charges (${invoice.additional_charge_description})` : 'Additional Charges'
    const addLabelClean = addLabel.length > 30 ? `${addLabel.slice(0, 29)}...` : addLabel
    doc.text(addLabelClean, sumLabelX, sumY)
    doc.text(`+ LKR ${formatNumberSafe(financials.additionalCharges)}`, 189, sumY, { align: 'right' })
    sumY += finRowHeight
  }

  // Tax (Render ONLY if > 0)
  if (financials.taxAmount > 0) {
    doc.text(`Tax (${financials.taxRate}%)`, sumLabelX, sumY)
    doc.text(`LKR ${formatNumberSafe(financials.taxAmount)}`, 189, sumY, { align: 'right' })
    sumY += finRowHeight
  }

  // Refundable Deposit (Render ONLY if > 0)
  if (financials.refundableDeposit > 0) {
    doc.text('Refundable Deposit (Separate)', sumLabelX, sumY)
    doc.text(`LKR ${formatNumberSafe(financials.refundableDeposit)}`, 189, sumY, { align: 'right' })
    sumY += finRowHeight
  }

  // Net Amount (Always rendered)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  setPdfDarkText(doc)
  doc.text('Net Amount', sumLabelX, sumY)
  doc.text(`LKR ${formatNumberSafe(financials.netAmount)}`, 189, sumY, { align: 'right' })
  sumY += finRowHeight

  // Amount Paid
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(PDF_TYPOGRAPHY.financialRow)
  setPdfBodyText(doc)
  doc.text('Amount Paid', sumLabelX, sumY)
  doc.text(`- LKR ${formatNumberSafe(financials.amountPaid)}`, 189, sumY, { align: 'right' })
  sumY += 5.5

  // BALANCE DUE HIGHLIGHT BAR
  const barWidth = 192 - 105
  const barHeight = 9.5
  setPdfDarkFill(doc) // Black Bar #17171A
  doc.rect(105, sumY - 3.5, barWidth, barHeight, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(PDF_TYPOGRAPHY.balanceDue)
  setPdfBrandGoldText(doc) // Canonical Brand Gold #D97706
  doc.text('BALANCE DUE', 108, sumY + 3)
  doc.text(`LKR ${formatNumberSafe(financials.balanceDue)}`, 189, sumY + 3, { align: 'right' })

  // STEP 5: Footer
  // Do NOT render footer text, icons, contacts, or slogans in code.
  // The pre-printed letterhead background handles all footer elements.

  return doc
}
