import { jsPDF, drawTextWithOrdinalSuperscript, drawAlignedKeyValueRow, LEGAL_MARGINS } from './pdf-engine'
import { USER_AGREEMENT_COMPANY_REG_NO } from '@/lib/agreements/templates/user-agreement-v1'
import { formatDateOrdinal } from '@/lib/utils/formatters'
import { setPdfBrandGoldText } from './pdf-theme'

function formatDateSafe(val: unknown): string {
  if (!val) return 'N/A'
  return formatDateOrdinal(val) || 'N/A'
}

function formatNumberSafe(val: unknown, decimals: number = 2): string {
  const num = Number(val ?? 0)
  if (isNaN(num)) return '0.00'
  return num.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
export async function generateAgreementPDF(agreement: any, companySettings?: any) {
  console.log('AgreementDocument mounted (Clean White US Legal Paper — NO APPLICATION UI — NO LETTERHEAD)')

  // US LEGAL Paper: 215.9 x 355.6 mm (8.5 x 14 in)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [215.9, 355.6],
  })

  let currentY = LEGAL_MARGINS.top

  // STEP 1: Agreement Header & Company Information Box
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  setPdfBrandGoldText(doc) // Brand Gold #997711
  doc.text('VEHICLE RENTAL AGREEMENT', LEGAL_MARGINS.left, currentY)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(15, 23, 42)
  doc.text(`Agreement No: #${agreement.agreement_number}`, LEGAL_MARGINS.right, currentY, { align: 'right' })

  currentY += 5

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(71, 85, 105)
  doc.text('THENNAKOON TOURS (PVT) LTD | Reg No. PV 00312253 | 39A, 1st cross street, Pagoda Road, Nugegoda', LEGAL_MARGINS.left, currentY)
  drawTextWithOrdinalSuperscript(doc, `Date: ${formatDateSafe(agreement.agreement_date || agreement.created_at)}`, LEGAL_MARGINS.right, currentY, { align: 'right' })

  currentY += 8

  // STEP 2: Customer Details Section
  const customer = agreement.lessee_snapshot || agreement.customer || {}
  const booking = agreement.booking || {}
  const vehicleObj = agreement.vehicle_snapshot || {}
  const rentalObj = agreement.rental_snapshot || {}

  doc.setFillColor(248, 250, 252)
  doc.setDrawColor(226, 232, 240)
  doc.roundedRect(LEGAL_MARGINS.left, currentY, LEGAL_MARGINS.width, 36, 2, 2, 'FD')

  const leftX = LEGAL_MARGINS.left + 4
  const rightX = LEGAL_MARGINS.left + 95

  let leftY = currentY + 5
  let rightY = currentY + 5

  leftY = drawAlignedKeyValueRow(doc, 'HIRER', customer.full_name || 'N/A', leftX, leftY, { labelWidth: 26, isBoldLabel: true, maxWidth: 60 })
  leftY = drawAlignedKeyValueRow(doc, 'Phone', customer.mobile || customer.phone || 'N/A', leftX, leftY, { labelWidth: 26, maxWidth: 60 })
  const startStr = formatDateSafe(agreement.rental_start_at || booking.rental_start_at)
  const endStr = formatDateSafe(agreement.rental_end_at || booking.rental_end_at)
  leftY = drawAlignedKeyValueRow(doc, 'Rental Period', `${startStr} to ${endStr}`, leftX, leftY, { labelWidth: 26, maxWidth: 60 })

  const vReg = vehicleObj.registration_number || ''
  const vMakeModel = [vehicleObj.make, vehicleObj.model].filter(Boolean).join(' ')
  const vDisplay = vReg && vMakeModel ? `${vReg} (${vMakeModel})` : (vReg || vMakeModel || 'N/A')
  leftY = drawAlignedKeyValueRow(doc, 'Vehicle', vDisplay, leftX, leftY, { labelWidth: 26, maxWidth: 60 })
  leftY = drawAlignedKeyValueRow(doc, 'Daily Rate', `LKR ${formatNumberSafe(rentalObj.daily_rate)} | Total: LKR ${formatNumberSafe(rentalObj.total_amount)}`, leftX, leftY, { labelWidth: 26, maxWidth: 60 })

  rightY = drawAlignedKeyValueRow(doc, 'NIC / Passport', customer.identifier_no || customer.nic || customer.passport_number || 'N/A', rightX, rightY, { labelWidth: 26, maxWidth: 60 })
  rightY = drawAlignedKeyValueRow(doc, 'Address', customer.address || customer.address_line_1 || 'Sri Lanka', rightX, rightY, { labelWidth: 26, maxWidth: 60 })
  rightY = drawAlignedKeyValueRow(doc, 'Deposit', `LKR ${formatNumberSafe(rentalObj.refundable_deposit)}`, rightX, rightY, { labelWidth: 26, maxWidth: 60 })

  currentY += 42

  // STEP 3: Legal Terms & Conditions Clauses
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(15, 23, 42)
  doc.text('TERMS AND CONDITIONS', LEGAL_MARGINS.left, currentY)
  currentY += 5

  const terms = [
    '1. The Hirer agrees to return the vehicle in the same condition as received, ordinary wear and tear excepted.',
    '2. The Hirer shall be fully responsible for any loss, damage, or legal liabilities arising from reckless driving or breach of Sri Lankan traffic laws.',
    '3. The vehicle shall not be sub-rented, driven by unauthorized third parties, or used for illegal activities.',
    '4. The refundable deposit will be returned upon vehicle inspection and clearance of any outstanding tolls, fines, or fuel shortages.',
    '5. In case of mechanical breakdown, the Owner must be immediately notified before undertaking any third-party repairs.',
  ]

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(51, 65, 85)

  for (const clause of terms) {
    const splitClause = doc.splitTextToSize(clause, LEGAL_MARGINS.width)
    doc.text(splitClause, LEGAL_MARGINS.left, currentY)
    currentY += splitClause.length * 4 + 2
  }

  currentY += 10

  // STEP 4: Signatures Block
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(15, 23, 42)

  doc.text('HIRER SIGNATURE', LEGAL_MARGINS.left + 10, currentY)
  doc.text('AUTHORIZED SIGNATURE', LEGAL_MARGINS.right - 55, currentY)

  const signatureUrl = agreement.prepared_by_profile?.signature_url || companySettings?.signature_url
  if (signatureUrl && typeof signatureUrl === 'string') {
    try {
      const isJpg = signatureUrl.includes('image/jpeg') || signatureUrl.includes('image/jpg')
      doc.addImage(signatureUrl, isJpg ? 'JPEG' : 'PNG', LEGAL_MARGINS.right - 55, currentY + 2, 32, 12)
    } catch (e) {
      console.warn('[Agreement PDF] Could not embed signature:', e)
    }
  }

  currentY += 15
  doc.setLineWidth(0.3)
  doc.setDrawColor(148, 163, 184)
  doc.line(LEGAL_MARGINS.left + 5, currentY, LEGAL_MARGINS.left + 65, currentY)
  doc.line(LEGAL_MARGINS.right - 55, currentY, LEGAL_MARGINS.right - 5, currentY)

  currentY += 4
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(100, 116, 139)
  doc.text(`Date: ____________________`, LEGAL_MARGINS.left + 5, currentY)
  doc.text(`Date: ____________________`, LEGAL_MARGINS.right - 55, currentY)

  return doc
}
