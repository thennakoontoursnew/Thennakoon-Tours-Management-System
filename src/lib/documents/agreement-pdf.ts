import { jsPDF, getLetterheadBase64, LEGAL_MARGINS, drawLetterheadOnLegalPage } from './pdf-engine'

function formatDateSafe(val: any): string {
  if (!val) return 'N/A'
  try {
    const d = new Date(val)
    if (isNaN(d.getTime())) return 'N/A'
    return d.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  } catch {
    return 'N/A'
  }
}

function formatNumberSafe(val: any, decimals: number = 2): string {
  const num = Number(val ?? 0)
  if (isNaN(num)) return '0.00'
  return num.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

export async function generateAgreementPDF(agreement: any, companySettings: any) {
  console.log('AgreementDocument mounted')

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

  console.log('Rendering Legal Page 1')

  // STEP 1: Draw Letterhead Background Image FIRST on US Legal canvas
  const base64Letterhead = await getLetterheadBase64()
  if (base64Letterhead) {
    drawLetterheadOnLegalPage(doc, base64Letterhead)
  }

  let currentY = LEGAL_MARGINS.top

  // STEP 2: Draw Header Title & Document Number
  console.log('Rendering Header')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(15, 23, 42) // Dark Slate
  doc.text('VEHICLE RENTAL AGREEMENT', LEGAL_MARGINS.left, currentY)

  doc.setFontSize(10)
  doc.setTextColor(71, 85, 105)
  doc.text(`Agreement No: ${agreement.agreement_number || 'N/A'}`, LEGAL_MARGINS.right, currentY, { align: 'right' })

  currentY += 6

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.text(`Date: ${agreement.agreement_date || new Date().toISOString().split('T')[0]}`, LEGAL_MARGINS.left, currentY)

  currentY += 8

  // STEP 3: Customer Details Section
  console.log('Rendering Customer')
  const customer = agreement.customer || {}
  const booking = agreement.booking || {}
  const vehiclesList = agreement.vehicles || []

  doc.setFillColor(248, 250, 252)
  doc.setDrawColor(226, 232, 240)
  doc.roundedRect(LEGAL_MARGINS.left, currentY, LEGAL_MARGINS.width, 36, 2, 2, 'FD')

  let boxY = currentY + 5
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(15, 23, 42)
  doc.text(`HIRER: ${customer.full_name || 'N/A'}`, LEGAL_MARGINS.left + 4, boxY)
  doc.text(`NIC/Passport: ${customer.nic || customer.passport_number || 'N/A'}`, LEGAL_MARGINS.left + 100, boxY)

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

  // STEP 4: Vehicle Details Section
  console.log('Rendering Vehicle')
  boxY += 6
  if (vehiclesList.length > 0) {
    const firstV = vehiclesList[0]
    const vInfo = firstV.vehicle ? `${firstV.vehicle.vehicle_name} (${firstV.vehicle.registration_number})` : 'Allocated Vehicle'
    const dInfo = firstV.driver ? `Driver: ${firstV.driver.full_name} (${firstV.driver.driver_code})` : 'Driver: Self Drive / Unassigned'
    doc.setFont('helvetica', 'bold')
    doc.text(`VEHICLE: ${vInfo}`, LEGAL_MARGINS.left + 4, boxY)
    doc.setFont('helvetica', 'normal')
    doc.text(dInfo, LEGAL_MARGINS.left + 100, boxY)
  }

  currentY += 42

  // Financial Summary Box
  if (booking.grand_total) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(15, 23, 42)
    doc.text(`GRAND TOTAL: LKR ${formatNumberSafe(booking.grand_total)}`, LEGAL_MARGINS.left, currentY)
    doc.text(`ADVANCE PAID: LKR ${formatNumberSafe(booking.advance_paid)}`, LEGAL_MARGINS.left + 65, currentY)
    doc.text(`BALANCE DUE: LKR ${formatNumberSafe(booking.balance_due)}`, LEGAL_MARGINS.left + 130, currentY)
    currentY += 8
  }

  // STEP 5: Terms & Conditions Section
  console.log('Rendering Terms')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(15, 23, 42)
  doc.text('TERMS AND CONDITIONS:', LEGAL_MARGINS.left, currentY)

  currentY += 4

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(71, 85, 105)
  const terms = agreement.terms_snapshot || companySettings?.default_agreement_terms || ''
  const splitTerms = doc.splitTextToSize(terms, LEGAL_MARGINS.width)
  doc.text(splitTerms, LEGAL_MARGINS.left, currentY)

  currentY += Math.min(splitTerms.length * 3.5, 120) + 15

  // STEP 6: Footer / Signature Section
  console.log('Rendering Footer')
  const sigY = Math.max(currentY, 290)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(15, 23, 42)

  // Customer Signature
  doc.line(LEGAL_MARGINS.left, sigY, LEGAL_MARGINS.left + 65, sigY)
  doc.text('Signature of Hirer', LEGAL_MARGINS.left, sigY + 4)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.text(`Date: ${agreement.agreement_date || ''}`, LEGAL_MARGINS.left, sigY + 8)

  // Company Signature
  const compX = LEGAL_MARGINS.right - 65
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.line(compX, sigY, LEGAL_MARGINS.right, sigY)
  doc.text('For Thennakoon Tours (Pvt) Ltd', compX, sigY + 4)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.text('Authorized Signature & Stamp', compX, sigY + 8)

  return doc
}
