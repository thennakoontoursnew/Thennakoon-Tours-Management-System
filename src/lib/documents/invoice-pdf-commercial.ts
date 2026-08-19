import { jsPDF, getLetterheadBase64, drawLetterheadOnPage } from './pdf-engine'
import { COMPANY_CONFIG } from '../company-config'
import { calculateCommercialInvoiceFinancials, unwrapDeductionsRelation } from '../utils/relation-utils'
import {
  PDF_COLORS,
  PDF_TYPOGRAPHY,
  PDF_SPACING,
  setPdfBrandGoldText,
  setPdfDarkText,
  setPdfDarkFill,
  setPdfBodyText,
  setPdfMutedText,
  setPdfLightMutedText,
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
  doc.setFontSize(PDF_TYPOGRAPHY.documentTitle)
  setPdfDarkText(doc)
  doc.text('INVOICE', CONTENT_LEFT, CONTENT_TOP)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.2)
  setPdfMutedText(doc)
  const formattedInvoiceDate = formatDateSafe(invoice.invoice_date)
  if (formattedInvoiceDate) {
    doc.text(`Invoice Date: ${formattedInvoiceDate}`, CONTENT_LEFT, CONTENT_TOP + 6.5)
  }

  // Right: Invoice Number Block
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  setPdfLightMutedText(doc)
  doc.text('INVOICE NO:', CONTENT_RIGHT, CONTENT_TOP, { align: 'right' })

  doc.setFontSize(PDF_TYPOGRAPHY.invoiceNumber)
  setPdfDarkText(doc)
  doc.text(invoice.invoice_number || 'TT-IN-10001', CONTENT_RIGHT, CONTENT_TOP + 6.5, { align: 'right' })

  // Divider Line
  doc.setLineWidth(0.25)
  doc.setDrawColor(PDF_COLORS.border.rgb[0], PDF_COLORS.border.rgb[1], PDF_COLORS.border.rgb[2])
  doc.line(CONTENT_LEFT, CONTENT_TOP + 11.5, CONTENT_RIGHT, CONTENT_TOP + 11.5)

  let currentY = CONTENT_TOP + 11.5 + PDF_SPACING.headerToMetadataGap

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
  doc.setFontSize(PDF_TYPOGRAPHY.sectionHeading)
  setPdfBrandGoldText(doc) // Canonical Brand Gold #D97706
  doc.text('INVOICE TO:', CONTENT_LEFT, currentY)

  let leftY = currentY + 5.5
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(PDF_TYPOGRAPHY.customerName)
  setPdfDarkText(doc)
  doc.text(custName, CONTENT_LEFT, leftY)
  leftY += 5

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(PDF_TYPOGRAPHY.metadata)
  setPdfBodyText(doc)
  if (custPhone) {
    doc.text(`Phone     : ${custPhone}`, CONTENT_LEFT, leftY)
    leftY += PDF_SPACING.metaRowHeight
  }
  if (custEmail) {
    doc.text(`Email      : ${custEmail}`, CONTENT_LEFT, leftY)
    leftY += PDF_SPACING.metaRowHeight
  }
  if (custCompany) {
    doc.text(`Company : ${custCompany}`, CONTENT_LEFT, leftY)
    leftY += PDF_SPACING.metaRowHeight
  }
  if (custAddress) {
    const addrLines = doc.splitTextToSize(`Address  : ${custAddress}`, 82)
    doc.text(addrLines, CONTENT_LEFT, leftY)
    leftY += addrLines.length * 4.5
  }

  // RIGHT COLUMN: INVOICE METADATA & RENTAL
  const rightX = 108
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(PDF_TYPOGRAPHY.sectionHeading)
  setPdfBrandGoldText(doc) // Canonical Brand Gold #D97706
  doc.text('INVOICE METADATA & RENTAL:', rightX, currentY)

  let rightY = currentY + 5.5
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(PDF_TYPOGRAPHY.metadata)
  setPdfBodyText(doc)

  const formattedDueDate = formatDateSafe(invoice.due_date || invoice.invoice_date)
  if (formattedDueDate) {
    doc.text(`Due Date  : ${formattedDueDate}`, rightX, rightY)
    rightY += PDF_SPACING.metaRowHeight
  }

  if (hasMeaningfulValue(invoice.payment_terms)) {
    doc.text(`Terms       : ${invoice.payment_terms}`, rightX, rightY)
    rightY += PDF_SPACING.metaRowHeight
  }

  if (vehicleStr) {
    doc.text(`Vehicle    : ${vehicleStr}`, rightX, rightY)
    rightY += PDF_SPACING.metaRowHeight
  }

  if (rentalStart && rentalEnd) {
    const daysStr = rentalDays ? ` (${rentalDays} Days)` : ''
    doc.text(`Rental Period : ${formatDateSafe(rentalStart)} to ${formatDateSafe(rentalEnd)}${daysStr}`, rightX, rightY)
    rightY += PDF_SPACING.metaRowHeight
  }

  if (hasMeaningfulValue(booking.booking_number)) {
    doc.text(`Booking   : #${booking.booking_number}`, rightX, rightY)
    rightY += PDF_SPACING.metaRowHeight
  } else if (hasMeaningfulValue(invoice.quotation_number) || hasMeaningfulValue(invoice.quotation_id)) {
    doc.text(`Quotation : #${invoice.quotation_number}`, rightX, rightY)
    rightY += PDF_SPACING.metaRowHeight
  }

  currentY = Math.max(leftY, rightY) + PDF_SPACING.metadataToTableGap

  // STEP 3: Items Table (Explicit Non-Clipping Column Proportions & Approved Reference Scale)
  const tableHeaderY = currentY
  const headerHeight = PDF_SPACING.tableHeaderHeight
  setPdfDarkFill(doc) // Black Header #17171A
  doc.rect(CONTENT_LEFT, tableHeaderY, CONTENT_WIDTH, headerHeight, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(PDF_TYPOGRAPHY.tableHeader)
  setPdfWhiteText(doc)
  doc.text('#', 22, tableHeaderY + 6.2, { align: 'center' })
  doc.text('Description', 28, tableHeaderY + 6.2)
  doc.text('Qty', 124, tableHeaderY + 6.2, { align: 'right' })
  doc.text('Unit Price', 156, tableHeaderY + 6.2, { align: 'right' })
  doc.text('Line Total', 189, tableHeaderY + 6.2, { align: 'right' })

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
        // Draw table header continuation on new page ONLY when inside table rendering
        setPdfDarkFill(doc)
        doc.rect(CONTENT_LEFT, currentY, CONTENT_WIDTH, headerHeight, 'F')
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(PDF_TYPOGRAPHY.tableHeader)
        setPdfWhiteText(doc)
        doc.text('#', 22, currentY + 6.2, { align: 'center' })
        doc.text('Description (Cont.)', 28, currentY + 6.2)
        doc.text('Qty', 124, currentY + 6.2, { align: 'right' })
        doc.text('Unit Price', 156, currentY + 6.2, { align: 'right' })
        doc.text('Line Total', 189, currentY + 6.2, { align: 'right' })
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
    const rowHeight = Math.max(PDF_SPACING.tableRowHeight, descLines.length * 4.2 + 3)

    checkPageOverflow(rowHeight, true)

    if (idx % 2 === 1) {
      doc.setFillColor(PDF_COLORS.alternateRow.rgb[0], PDF_COLORS.alternateRow.rgb[1], PDF_COLORS.alternateRow.rgb[2])
      doc.rect(CONTENT_LEFT, currentY, CONTENT_WIDTH, rowHeight, 'F')
    }

    doc.text(String(idx + 1), 22, currentY + 5.8, { align: 'center' })
    doc.text(descLines, 28, currentY + 5.8)
    doc.text(String(it.quantity || 1), 124, currentY + 5.8, { align: 'right' })
    doc.text(`LKR ${formatNumberSafe(it.unit_price)}`, 156, currentY + 5.8, { align: 'right' })
    doc.text(`LKR ${formatNumberSafe(it.line_total || (Number(it.quantity || 1) * Number(it.unit_price || 0)))}`, 189, currentY + 5.8, { align: 'right' })

    currentY += rowHeight

    doc.setLineWidth(0.15)
    doc.setDrawColor(PDF_COLORS.border.rgb[0], PDF_COLORS.border.rgb[1], PDF_COLORS.border.rgb[2])
    doc.line(CONTENT_LEFT, currentY, CONTENT_RIGHT, currentY)
  })

  // STEP 4: Financial Two-Column Block (Bank Details Left / Summary Right)
  // Clear 10mm vertical gap after items table
  currentY += PDF_SPACING.tableToFinanceGap

  checkPageOverflow(60, false)

  const summaryStartY = currentY

  // LEFT SIDE: PAYMENT & BANK DETAILS (Clean label/value alignment)
  let bankY = summaryStartY
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(PDF_TYPOGRAPHY.sectionHeading)
  setPdfBrandGoldText(doc) // Canonical Brand Gold #D97706
  doc.text('PAYMENT & BANK DETAILS:', CONTENT_LEFT, bankY)
  bankY += 5.5

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
    doc.text(b.label, CONTENT_LEFT, bankY)
    doc.text(':', CONTENT_LEFT + 25, bankY)
    doc.text(b.val, CONTENT_LEFT + 28, bankY)
    bankY += PDF_SPACING.metaRowHeight
  }

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
  doc.setFontSize(PDF_TYPOGRAPHY.financialRow)
  setPdfBodyText(doc)

  const finRowHeight = PDF_SPACING.financialRowHeight

  // Subtotal (Always rendered)
  doc.text('Subtotal', sumLabelX, sumY)
  doc.text(`LKR ${formatNumberSafe(financials.subtotal)}`, 189, sumY, { align: 'right' })
  sumY += finRowHeight

  // Discount (Render ONLY if > 0 or has description)
  if (financials.discountAmount > 0 || hasMeaningfulValue(invoice.discount_description)) {
    const discLabel = hasMeaningfulValue(invoice.discount_description) ? `Discount (${invoice.discount_description})` : 'Discount'
    const discLabelClean = discLabel.length > 30 ? `${discLabel.slice(0, 29)}...` : discLabel
    doc.text(discLabelClean, sumLabelX, sumY)
    doc.text(`- LKR ${formatNumberSafe(financials.discountAmount)}`, 189, sumY, { align: 'right' })
    sumY += finRowHeight
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
    sumY += 4.8
    doc.setFont('helvetica', 'normal')
    for (const d of deductionList) {
      const label = d.description.length > 24 ? `${d.description.slice(0, 23)}...` : d.description
      doc.text(`  ${label}`, sumLabelX, sumY)
      doc.text(`- LKR ${formatNumberSafe(d.amount)}`, 189, sumY, { align: 'right' })
      sumY += 4.8
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
  sumY += 6.5

  // BALANCE DUE BAR (BELONGS STRICTLY TO FINANCIAL SUMMARY COLUMN)
  const barWidth = 192 - 105
  const barHeight = PDF_SPACING.balanceDueBarHeight
  setPdfDarkFill(doc) // Black Bar #17171A
  doc.rect(105, sumY - 4.5, barWidth, barHeight, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(PDF_TYPOGRAPHY.balanceDue)
  setPdfBrandGoldText(doc) // Canonical Brand Gold #D97706
  doc.text('BALANCE DUE', 108, sumY + 2.5)
  doc.text(`LKR ${formatNumberSafe(financials.balanceDue)}`, 189, sumY + 2.5, { align: 'right' })
  sumY += barHeight

  // Calculate bottom Y of 2-column block (MAX height of Bank details vs Financial summary)
  const bankBlockBottom = bankY
  const summaryBlockBottom = sumY
  const financeTwoColumnBottom = Math.max(bankBlockBottom, summaryBlockBottom)

  // Next full-width section starts strictly BELOW both columns with 11mm gap
  currentY = financeTwoColumnBottom + PDF_SPACING.financeToNotesGap

  // STEP 5: Special Notes & Terms & Conditions (Conditional Rendering)
  const specialNotesText = String(invoice.special_notes || COMPANY_CONFIG.defaultInvoiceSpecialNotes)
  const termsText = String(invoice.terms_and_conditions || invoice.important_message || COMPANY_CONFIG.defaultInvoiceImportantTerms)

  if (hasMeaningfulValue(specialNotesText)) {
    checkPageOverflow(24, false)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(PDF_TYPOGRAPHY.sectionHeading)
    setPdfBrandGoldText(doc) // Canonical Brand Gold #D97706
    doc.text('SPECIAL NOTES:', CONTENT_LEFT, currentY)
    currentY += 5

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(PDF_TYPOGRAPHY.notes)
    setPdfMutedText(doc)
    const specialLines = doc.splitTextToSize(specialNotesText, CONTENT_WIDTH)
    doc.text(specialLines, CONTENT_LEFT, currentY)
    currentY += specialLines.length * PDF_SPACING.notesLineHeight + PDF_SPACING.notesToTermsGap // 9mm gap to Terms
  }

  if (hasMeaningfulValue(termsText)) {
    checkPageOverflow(24, false)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(PDF_TYPOGRAPHY.sectionHeading)
    setPdfBrandGoldText(doc) // Canonical Brand Gold #D97706
    doc.text('IMPORTANT TERMS & CONDITIONS:', CONTENT_LEFT, currentY)
    currentY += 5

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(PDF_TYPOGRAPHY.notes)
    setPdfMutedText(doc)
    const termsLines = doc.splitTextToSize(termsText, CONTENT_WIDTH)
    doc.text(termsLines, CONTENT_LEFT, currentY)
    currentY += termsLines.length * PDF_SPACING.notesLineHeight + PDF_SPACING.termsToPreparedByGap // 13mm gap to Prepared By
  }

  // STEP 6: Prepared By Section
  checkPageOverflow(24, false)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(PDF_TYPOGRAPHY.sectionHeading)
  setPdfBrandGoldText(doc) // Canonical Brand Gold #D97706
  doc.text('PREPARED BY:', CONTENT_LEFT, currentY)
  currentY += 5

  const staffName = invoice.prepared_by_name_snapshot || invoice.prepared_by_profile?.full_name || 'S Madushani'
  const staffDesignation = invoice.prepared_by_designation_snapshot || 'HR & Account Executive'

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(PDF_TYPOGRAPHY.preparedByName)
  setPdfDarkText(doc)
  doc.text(staffName, CONTENT_LEFT, currentY)
  currentY += 4.5

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(PDF_TYPOGRAPHY.preparedByDetails)
  setPdfMutedText(doc)
  doc.text(staffDesignation, CONTENT_LEFT, currentY)
  currentY += 4.2
  doc.text(COMPANY_CONFIG.name, CONTENT_LEFT, currentY)

  // STEP 7: Page Number Overlay Across All Pages
  const totalPages = (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages()

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    setPdfLightMutedText(doc)
    doc.text(`Page ${i} of ${totalPages}`, CONTENT_RIGHT, 291, { align: 'right' })
  }

  return doc
}
