import {
  jsPDF,
  getLetterheadBase64,
  drawLetterheadOnPage,
  drawTextWithOrdinalSuperscript,
  drawAlignedKeyValueRow,
} from './pdf-engine'
import { formatDateOrdinal, normalizeNewlines } from '../utils/formatters'
import {
  PDF_COLORS,
  PDF_TYPOGRAPHY,
  setPdfBrandGoldText,
  setPdfDarkText,
  setPdfDarkFill,
  setPdfBodyText,
  setPdfMutedText,
  setPdfLightMutedText,
  setPdfWhiteText,
} from './pdf-theme'

export interface ExpenseVoucherBreakdownItem {
  description: string
  amount: number
}

export interface ExpenseVoucherData {
  id?: string
  expense_number?: string
  voucher_number?: string
  expense_date?: string
  category?: string
  description?: string
  amount?: number
  payment_method?: string
  supplier_name?: string
  reference_number?: string
  bill_name?: string
  customer_name?: string
  account_number?: string
  bank_name?: string
  branch_name?: string
  add_payments_breakdown?: ExpenseVoucherBreakdownItem[] | null
  deduction_breakdown?: ExpenseVoucherBreakdownItem[] | null
  net_balance?: number
  remark?: string
  special_notice?: string
  prepared_by?: string
  approved_by?: string
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
  return formatDateOrdinal(val)
}

// SAFE CONTENT BOUNDARIES WITHIN OFFICIAL LETTERHEAD
const CONTENT_TOP = 38
const CONTENT_BOTTOM = 245
const CONTENT_LEFT = 18
const CONTENT_RIGHT = 192
const CONTENT_WIDTH = CONTENT_RIGHT - CONTENT_LEFT // 174 mm

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function generateExpenseVoucherPDF(voucherData: ExpenseVoucherData, companySettings?: Record<string, any>) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  // Load canonical letterhead asset
  const base64Letterhead = await getLetterheadBase64(companySettings)

  // 1. Draw Official Letterhead Background FIRST on Page 1 (Layer 0)
  if (base64Letterhead) {
    drawLetterheadOnPage(doc, base64Letterhead)
  }

  // STEP 1: SPLIT HEADER (Left: VOUCHER Title & Date | Right: VOUCHER NO Label & Number)
  const isOwnerStatement = voucherData.category === 'owner_statement' || voucherData.category === 'Owner Statement'
  const docTitle = isOwnerStatement ? 'OWNER STATEMENT & PAYMENT VOUCHER' : 'PAYMENT VOUCHER'
  const vNum = voucherData.voucher_number || voucherData.expense_number || 'VN-10001'

  // LEFT SIDE: VOUCHER Title & Date
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(isOwnerStatement ? 13 : PDF_TYPOGRAPHY.documentTitle)
  setPdfBrandGoldText(doc) // Brand Gold #997711
  doc.text(docTitle, CONTENT_LEFT, CONTENT_TOP)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(PDF_TYPOGRAPHY.metadata)
  setPdfMutedText(doc)
  const formattedVoucherDate = formatDateSafe(voucherData.expense_date || new Date().toISOString().slice(0, 10))
  if (formattedVoucherDate) {
    drawTextWithOrdinalSuperscript(doc, `Date: ${formattedVoucherDate}`, CONTENT_LEFT, CONTENT_TOP + 6.2)
  }

  // RIGHT SIDE: VOUCHER NO Label & Number
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  setPdfLightMutedText(doc)
  doc.text('VOUCHER NO:', CONTENT_RIGHT, CONTENT_TOP, { align: 'right' })

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(PDF_TYPOGRAPHY.invoiceNumber)
  setPdfDarkText(doc)
  doc.text(vNum, CONTENT_RIGHT, CONTENT_TOP + 6.2, { align: 'right' })

  // Divider Line below Header
  doc.setLineWidth(0.25)
  doc.setDrawColor(PDF_COLORS.border.rgb[0], PDF_COLORS.border.rgb[1], PDF_COLORS.border.rgb[2])
  doc.line(CONTENT_LEFT, CONTENT_TOP + 11.5, CONTENT_RIGHT, CONTENT_TOP + 11.5)

  let currentY = CONTENT_TOP + 17.0

  // STEP 2: 2-Column Metadata Block
  const payeeName = hasMeaningfulValue(voucherData.customer_name)
    ? voucherData.customer_name!
    : (hasMeaningfulValue(voucherData.supplier_name) ? voucherData.supplier_name! : 'Valued Payee / Beneficiary')

  const billParticular = hasMeaningfulValue(voucherData.bill_name)
    ? voucherData.bill_name!
    : (hasMeaningfulValue(voucherData.description) ? voucherData.description! : 'Payment Settlement')

  const catDisplay = (voucherData.category || 'General').replace(/_/g, ' ').toUpperCase()
  const methodDisplay = (voucherData.payment_method || 'cash').replace(/_/g, ' ').toUpperCase()

  // LEFT COLUMN: DISBURSEMENT TO / BENEFICIARY
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(PDF_TYPOGRAPHY.sectionHeading)
  setPdfBrandGoldText(doc) // Brand Gold #997711
  doc.text('DISBURSEMENT TO / BENEFICIARY:', CONTENT_LEFT, currentY)

  let leftY = currentY + 4.8
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(PDF_TYPOGRAPHY.customerName)
  setPdfDarkText(doc)
  doc.text(payeeName, CONTENT_LEFT, leftY)
  leftY += 4.5

  if (hasMeaningfulValue(billParticular)) {
    leftY = drawAlignedKeyValueRow(doc, 'Particulars', billParticular, CONTENT_LEFT, leftY, { labelWidth: 24, maxWidth: 60 })
  }
  if (hasMeaningfulValue(voucherData.customer_name) && hasMeaningfulValue(voucherData.supplier_name)) {
    leftY = drawAlignedKeyValueRow(doc, 'Customer / Ref', voucherData.customer_name!, CONTENT_LEFT, leftY, { labelWidth: 24, maxWidth: 60 })
  }
  leftY = drawAlignedKeyValueRow(doc, 'Disbursed Via', methodDisplay, CONTENT_LEFT, leftY, { labelWidth: 24, maxWidth: 60 })

  // RIGHT COLUMN: VOUCHER METADATA
  const rightX = 108
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(PDF_TYPOGRAPHY.sectionHeading)
  setPdfBrandGoldText(doc) // Brand Gold #997711
  doc.text('VOUCHER METADATA:', rightX, currentY)

  let rightY = currentY + 4.8

  rightY = drawAlignedKeyValueRow(doc, 'Category', catDisplay, rightX, rightY, { labelWidth: 26, maxWidth: 58 })
  rightY = drawAlignedKeyValueRow(doc, 'Payment Method', methodDisplay, rightX, rightY, { labelWidth: 26, maxWidth: 58 })

  if (hasMeaningfulValue(voucherData.reference_number)) {
    rightY = drawAlignedKeyValueRow(doc, 'Ref / Check No', voucherData.reference_number!, rightX, rightY, { labelWidth: 26, maxWidth: 58 })
  }

  currentY = Math.max(leftY, rightY) + 5.0

  // STEP 3: Items & Breakdown Tables (Solid Dark Header Bar)
  const headerHeight = 7.2

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
        doc.text('#', 22, currentY + 5.0, { align: 'center' })
        doc.text('Description / Particulars (Cont.)', 28, currentY + 5.0)
        doc.text('Amount (LKR)', 189, currentY + 5.0, { align: 'right' })
        currentY += headerHeight
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(PDF_TYPOGRAPHY.tableBody)
        setPdfBodyText(doc)
      }
    }
  }

  // Draw Additions / Earnings Table Header
  const tableHeaderY = currentY
  setPdfDarkFill(doc) // Black Header #17171A
  doc.rect(CONTENT_LEFT, tableHeaderY, CONTENT_WIDTH, headerHeight, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(PDF_TYPOGRAPHY.tableHeader)
  setPdfWhiteText(doc)
  doc.text('#', 22, tableHeaderY + 5.0, { align: 'center' })
  doc.text('Description / Particulars', 28, tableHeaderY + 5.0)
  doc.text('Line Total (LKR)', 189, tableHeaderY + 5.0, { align: 'right' })

  currentY = tableHeaderY + headerHeight

  const rawAdditions = voucherData.add_payments_breakdown && Array.isArray(voucherData.add_payments_breakdown)
    ? voucherData.add_payments_breakdown
    : []

  const additionsData = rawAdditions.length > 0
    ? rawAdditions
    : [{ description: voucherData.description || 'Base Earnings / Gross Hire Charge', amount: Number(voucherData.amount || 0) }]

  const totalAdditions = rawAdditions.length > 0
    ? rawAdditions.reduce((acc, curr) => acc + Number(curr.amount || 0), 0)
    : Number(voucherData.amount || 0)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(PDF_TYPOGRAPHY.tableBody)
  setPdfBodyText(doc)

  additionsData.forEach((it, idx) => {
    const rawDesc = String(it.description || 'Addition Line Item')
    const descLines = doc.splitTextToSize(rawDesc, 120)
    const rowHeight = Math.max(6.8, descLines.length * 3.6 + 2.2)

    checkPageOverflow(rowHeight, true)

    if (idx % 2 === 1) {
      doc.setFillColor(PDF_COLORS.alternateRow.rgb[0], PDF_COLORS.alternateRow.rgb[1], PDF_COLORS.alternateRow.rgb[2])
      doc.rect(CONTENT_LEFT, currentY, CONTENT_WIDTH, rowHeight, 'F')
    }

    doc.text(String(idx + 1), 22, currentY + 4.5, { align: 'center' })
    doc.text(descLines, 28, currentY + 4.5)
    doc.text(`LKR ${formatNumberSafe(it.amount)}`, 189, currentY + 4.5, { align: 'right' })

    currentY += rowHeight

    doc.setLineWidth(0.15)
    doc.setDrawColor(PDF_COLORS.border.rgb[0], PDF_COLORS.border.rgb[1], PDF_COLORS.border.rgb[2])
    doc.line(CONTENT_LEFT, currentY, CONTENT_RIGHT, currentY)
  })

  // Deductions Table Section (If present)
  const rawDeductions = voucherData.deduction_breakdown && Array.isArray(voucherData.deduction_breakdown)
    ? voucherData.deduction_breakdown
    : []

  const totalDeductions = rawDeductions.reduce((acc, curr) => acc + Number(curr.amount || 0), 0)

  if (rawDeductions.length > 0) {
    currentY += 4.0
    checkPageOverflow(15, true)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(PDF_TYPOGRAPHY.sectionHeading)
    doc.setTextColor(153, 27, 27) // Burgundy #991b1b
    doc.text('DEDUCTIONS & ADJUSTMENTS (-):', CONTENT_LEFT, currentY)
    currentY += 4.5

    rawDeductions.forEach((it, idx) => {
      const rawDesc = String(it.description || 'Deduction Line Item')
      const descLines = doc.splitTextToSize(rawDesc, 120)
      const rowHeight = Math.max(6.8, descLines.length * 3.6 + 2.2)

      checkPageOverflow(rowHeight, true)

      if (idx % 2 === 1) {
        doc.setFillColor(254, 242, 242) // subtle crimson tint
        doc.rect(CONTENT_LEFT, currentY, CONTENT_WIDTH, rowHeight, 'F')
      }

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(PDF_TYPOGRAPHY.tableBody)
      doc.setTextColor(153, 27, 27)
      doc.text(String(idx + 1), 22, currentY + 4.5, { align: 'center' })
      doc.text(descLines, 28, currentY + 4.5)
      doc.text(`- LKR ${formatNumberSafe(it.amount)}`, 189, currentY + 4.5, { align: 'right' })

      currentY += rowHeight

      doc.setLineWidth(0.15)
      doc.setDrawColor(PDF_COLORS.border.rgb[0], PDF_COLORS.border.rgb[1], PDF_COLORS.border.rgb[2])
      doc.line(CONTENT_LEFT, currentY, CONTENT_RIGHT, currentY)
    })
  }

  // STEP 4: TOTALS SUMMARY CARD (Right-Aligned, Matching Commercial Invoice)
  currentY += 4.5
  checkPageOverflow(35, false)

  let sumY = currentY
  const sumLabelX = 108

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(PDF_TYPOGRAPHY.financialRow)
  setPdfBodyText(doc)

  const finRowHeight = 4.2

  // Total Additions / Gross Earnings
  doc.text('Gross Earnings / Additions', sumLabelX, sumY)
  doc.text(`LKR ${formatNumberSafe(totalAdditions)}`, 189, sumY, { align: 'right' })
  sumY += finRowHeight

  // Total Deductions (Render ONLY if > 0)
  if (totalDeductions > 0) {
    doc.setTextColor(153, 27, 27)
    doc.text('Total Deductions', sumLabelX, sumY)
    doc.text(`- LKR ${formatNumberSafe(totalDeductions)}`, 189, sumY, { align: 'right' })
    setPdfBodyText(doc)
    sumY += finRowHeight
  }

  const calcNetBalance = voucherData.net_balance !== undefined && voucherData.net_balance !== null
    ? voucherData.net_balance
    : totalAdditions - totalDeductions

  // NET BALANCE PAYABLE HIGHLIGHT BAR (Matching Balance Due Bar)
  const barWidth = 192 - 105
  const barHeight = 8.2
  setPdfDarkFill(doc) // Black Bar #17171A
  doc.rect(105, sumY - 3.2, barWidth, barHeight, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(PDF_TYPOGRAPHY.balanceDue)
  setPdfBrandGoldText(doc) // Brand Gold #997711
  doc.text('NET BALANCE PAYABLE', 108, sumY + 2.3)
  doc.text(`LKR ${formatNumberSafe(calcNetBalance)}`, 189, sumY + 2.3, { align: 'right' })
  sumY += barHeight

  currentY = sumY

  // STEP 5: FULL-WIDTH HORIZONTAL DIVIDER LINE DIRECTLY UNDERNEATH TOTALS CARD
  currentY += 3.5
  doc.setLineWidth(0.2)
  doc.setDrawColor(PDF_COLORS.border.rgb[0], PDF_COLORS.border.rgb[1], PDF_COLORS.border.rgb[2])
  doc.line(CONTENT_LEFT, currentY, CONTENT_RIGHT, currentY)

  currentY += 4.5

  // STEP 6: BANKING & DISBURSEMENT DETAILS
  if (voucherData.account_number || voucherData.bank_name) {
    checkPageOverflow(25, false)
    let bankY = currentY
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(PDF_TYPOGRAPHY.sectionHeading)
    setPdfBrandGoldText(doc) // Brand Gold #997711
    doc.text('BANKING & DISBURSEMENT DETAILS:', CONTENT_LEFT, bankY)
    bankY += 4.4

    doc.setFontSize(PDF_TYPOGRAPHY.body)
    const bName = voucherData.bank_name || 'N/A'
    const bBranch = voucherData.branch_name ? ` (${voucherData.branch_name})` : ''

    const bankLabels = [
      { label: 'Account Name', val: payeeName, boldVal: false },
      { label: 'Bank', val: `${bName}${bBranch}`, boldVal: false },
      { label: 'Account No', val: voucherData.account_number || 'N/A', boldVal: true },
    ]

    for (const b of bankLabels) {
      doc.setFont('helvetica', 'normal')
      setPdfBodyText(doc)
      doc.text(b.label, CONTENT_LEFT, bankY)
      doc.text(':', CONTENT_LEFT + 25, bankY)

      if (b.boldVal) {
        doc.setFont('helvetica', 'bold')
        setPdfDarkText(doc)
      } else {
        doc.setFont('helvetica', 'normal')
        setPdfBodyText(doc)
      }
      doc.text(b.val, CONTENT_LEFT + 28, bankY)
      bankY += 4.0
    }

    currentY = bankY + 3.5
  }

  // STEP 7: REMARKS & SPECIAL NOTICE (RESTYLED MATCHING COMMERCIAL INVOICE SPECIAL NOTES)
  const remarksText = normalizeNewlines(String(voucherData.remark || ''))
  const noticeText = normalizeNewlines(String(voucherData.special_notice || ''))

  if (hasMeaningfulValue(remarksText)) {
    checkPageOverflow(15, false)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(PDF_TYPOGRAPHY.sectionHeading)
    setPdfBrandGoldText(doc) // Brand Gold #997711
    doc.text('SPECIAL REMARKS:', CONTENT_LEFT, currentY)
    currentY += 4.4

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(PDF_TYPOGRAPHY.notes)
    setPdfMutedText(doc)
    const rLines = doc.splitTextToSize(remarksText, CONTENT_WIDTH)
    doc.text(rLines, CONTENT_LEFT, currentY)
    currentY += rLines.length * 3.8 + 3.5
  }

  if (hasMeaningfulValue(noticeText)) {
    checkPageOverflow(15, false)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(PDF_TYPOGRAPHY.sectionHeading)
    setPdfBrandGoldText(doc) // Brand Gold #997711
    doc.text('IMPORTANT NOTICE:', CONTENT_LEFT, currentY)
    currentY += 4.4

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(PDF_TYPOGRAPHY.notes)
    setPdfMutedText(doc)
    const nLines = doc.splitTextToSize(noticeText, CONTENT_WIDTH)
    doc.text(nLines, CONTENT_LEFT, currentY)
    currentY += nLines.length * 3.8 + 3.5
  }

  // STEP 8: STREAMLINED STACKED AUTHORIZATION (PREPARED BY & APPROVED BY ON LEFT)
  checkPageOverflow(40, false)

  let authY = currentY

  // 1. PREPARED BY BLOCK (Top)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(PDF_TYPOGRAPHY.sectionHeading)
  setPdfBrandGoldText(doc) // Brand Gold #997711
  doc.text('PREPARED BY:', CONTENT_LEFT, authY)

  authY += 4.5

  // Embed Digital Signature Image if available
  const signatureUrl = companySettings?.signature_url || null
  if (signatureUrl && typeof signatureUrl === 'string' && signatureUrl.trim()) {
    try {
      const imgWidth = 32
      const imgHeight = 12
      const isJpg = signatureUrl.includes('image/jpeg') || signatureUrl.includes('image/jpg')
      doc.addImage(signatureUrl, isJpg ? 'JPEG' : 'PNG', CONTENT_LEFT, authY, imgWidth, imgHeight)
      authY += imgHeight + 2
    } catch (err) {
      console.warn('[Expense Voucher PDF] Could not embed digital signature:', err)
    }
  }

  const prepUser = voucherData.prepared_by || 'Finance Officer'
  let prepName = prepUser
  let prepRole = 'Finance Officer'
  if (prepUser.includes('(')) {
    const parts = prepUser.split('(')
    prepName = parts[0].trim()
    prepRole = parts[1].replace(')', '').trim()
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  setPdfDarkText(doc)
  doc.text(prepName, CONTENT_LEFT, authY)
  authY += 4.0

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  setPdfMutedText(doc)
  doc.text(prepRole, CONTENT_LEFT, authY)
  authY += 6.5 // 6.5mm clean gap before APPROVED BY

  // 2. APPROVED BY BLOCK (Stacked Directly Below)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(PDF_TYPOGRAPHY.sectionHeading)
  setPdfBrandGoldText(doc) // Brand Gold #997711
  doc.text('APPROVED BY:', CONTENT_LEFT, authY)

  authY += 4.5

  const rawApproved = voucherData.approved_by || ''
  const isUnapproved = !rawApproved || rawApproved.toLowerCase().includes('pending') || rawApproved.toLowerCase().includes('unapproved')

  if (isUnapproved) {
    doc.setFont('helvetica', 'bolditalic')
    doc.setFontSize(8.5)
    setPdfMutedText(doc)
    doc.text('[ Pending Final Management Approval ]', CONTENT_LEFT, authY)
  } else {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9.5)
    setPdfDarkText(doc)
    doc.text(rawApproved, CONTENT_LEFT, authY)
    authY += 4.0

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    setPdfMutedText(doc)
    doc.text('Thennakoon Tours (Pvt) Ltd', CONTENT_LEFT, authY)
  }

  return doc
}

