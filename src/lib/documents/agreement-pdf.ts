import { jsPDF, LEGAL_MARGINS } from './pdf-engine'
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

  if (!agreement) {
    console.error('Agreement data missing in generateAgreementPDF')
    throw new Error('Agreement data missing')
  }

  // Create US Legal Size PDF: 8.5 x 14 in (215.9 x 355.6 mm)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [215.9, 355.6],
  })

  let currentY = LEGAL_MARGINS.top

  // STEP 1: Draw Clean Formal Document Header (NO APPLICATION CHROME, NO LETTERHEAD IMAGE)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(15, 23, 42) // Dark Slate
  doc.text('THENNAKOON TOURS (PVT) LTD', LEGAL_MARGINS.left, currentY)

  doc.setFontSize(9)
  doc.setTextColor(71, 85, 105)
  doc.text(`39A, 1st cross street, Pagoda Road, Nugegoda | Reg No. ${USER_AGREEMENT_COMPANY_REG_NO}`, LEGAL_MARGINS.left, currentY + 4.5)

  doc.setFontSize(12)
  doc.setTextColor(15, 23, 42)
  doc.text('VEHICLE RENTAL AGREEMENT', LEGAL_MARGINS.right, currentY, { align: 'right' })

  doc.setFontSize(9)
  setPdfBrandGoldText(doc) // Brand Gold #997711
  doc.text(`Ref: ${agreement.agreement_number || 'N/A'}`, LEGAL_MARGINS.right, currentY + 4.5, { align: 'right' })

  currentY += 12

  doc.setLineWidth(0.5)
  doc.setDrawColor(15, 23, 42)
  doc.line(LEGAL_MARGINS.left, currentY, LEGAL_MARGINS.right, currentY)

  currentY += 8

  // STEP 2: Customer Details Section
  const customer = agreement.lessee_snapshot || agreement.customer || {}
  const booking = agreement.booking || {}
  const vehicleObj = agreement.vehicle_snapshot || {}
  const rentalObj = agreement.rental_snapshot || {}

  doc.setFillColor(248, 250, 252)
  doc.setDrawColor(226, 232, 240)
  doc.roundedRect(LEGAL_MARGINS.left, currentY, LEGAL_MARGINS.width, 36, 2, 2, 'FD')

  let boxY = currentY + 5
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(15, 23, 42)
  doc.text(`HIRER: ${customer.full_name || 'N/A'}`, LEGAL_MARGINS.left + 4, boxY)
  doc.text(`NIC/Passport: ${customer.identifier_no || customer.nic || customer.passport_number || 'N/A'}`, LEGAL_MARGINS.left + 100, boxY)

  boxY += 5
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(71, 85, 105)
  doc.text(`Phone: ${customer.mobile || customer.phone || 'N/A'}`, LEGAL_MARGINS.left + 4, boxY)
  doc.text(`Address: ${customer.address || customer.address_line_1 || 'Sri Lanka'}`, LEGAL_MARGINS.left + 100, boxY)

  boxY += 5
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(15, 23, 42)
  doc.text(`RENTAL PERIOD:`, LEGAL_MARGINS.left + 4, boxY)
  doc.setFont('helvetica', 'normal')
  const startStr = formatDateSafe(agreement.rental_start_at || booking.rental_start_at)
  const endStr = formatDateSafe(agreement.rental_end_at || booking.rental_end_at)
  doc.text(`${startStr} to ${endStr}`, LEGAL_MARGINS.left + 35, boxY)

  boxY += 5
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(15, 23, 42)
  doc.text(`VEHICLE: ${vehicleObj.registration_number || 'N/A'} (${vehicleObj.make || ''} ${vehicleObj.model || ''})`, LEGAL_MARGINS.left + 4, boxY)

  boxY += 5
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(71, 85, 105)
  doc.text(`Daily Rate: LKR ${formatNumberSafe(rentalObj.daily_rate)} | Total Charges: LKR ${formatNumberSafe(rentalObj.total_amount)}`, LEGAL_MARGINS.left + 4, boxY)
  doc.text(`Deposit: LKR ${formatNumberSafe(rentalObj.refundable_deposit)}`, LEGAL_MARGINS.left + 100, boxY)

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
  doc.text('AUTHORIZED SIGNATURE', LEGAL_MARGINS.right - 50, currentY)

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
