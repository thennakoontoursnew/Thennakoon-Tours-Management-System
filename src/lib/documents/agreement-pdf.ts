import { jsPDF, getLetterheadBase64, drawLetterheadBackground, A4_MARGINS } from './pdf-engine'

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
  const doc = new jsPDF('p', 'mm', 'a4')
  const base64Letterhead = await getLetterheadBase64()

  let currentY = A4_MARGINS.top

  // Header Title & Document Number
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(15, 23, 42)
  doc.text('VEHICLE RENTAL AGREEMENT', A4_MARGINS.left, currentY)

  doc.setFontSize(10)
  doc.setTextColor(71, 85, 105)
  doc.text(`Agreement No: ${agreement.agreement_number || 'N/A'}`, A4_MARGINS.right, currentY, { align: 'right' })

  currentY += 6

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.text(`Date: ${agreement.agreement_date || new Date().toISOString().split('T')[0]}`, A4_MARGINS.left, currentY)

  currentY += 8

  // Customer & Vehicle Details Box
  const customer = agreement.customer || {}
  const booking = agreement.booking || {}
  const vehiclesList = agreement.vehicles || []

  doc.setFillColor(248, 250, 252)
  doc.setDrawColor(226, 232, 240)
  doc.roundedRect(A4_MARGINS.left, currentY, A4_MARGINS.width, 36, 2, 2, 'FD')

  let boxY = currentY + 5
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(15, 23, 42)
  doc.text(`HIRER: ${customer.full_name || 'N/A'}`, A4_MARGINS.left + 4, boxY)
  doc.text(`NIC/Passport: ${customer.nic || customer.passport_number || 'N/A'}`, A4_MARGINS.left + 100, boxY)

  boxY += 5
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(71, 85, 105)
  doc.text(`Phone: ${customer.mobile || customer.phone || 'N/A'}`, A4_MARGINS.left + 4, boxY)
  doc.text(`Address: ${customer.address || customer.address_line_1 || 'Sri Lanka'}`, A4_MARGINS.left + 100, boxY)

  boxY += 5
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(15, 23, 42)
  doc.text(`RENTAL PERIOD:`, A4_MARGINS.left + 4, boxY)
  doc.setFont('helvetica', 'normal')
  const startStr = formatDateSafe(agreement.rental_start_at || booking.rental_start_at)
  const endStr = formatDateSafe(agreement.rental_end_at || booking.rental_end_at)
  doc.text(`${startStr} to ${endStr}`, A4_MARGINS.left + 35, boxY)

  boxY += 6
  if (vehiclesList.length > 0) {
    const firstV = vehiclesList[0]
    const vInfo = firstV.vehicle ? `${firstV.vehicle.vehicle_name} (${firstV.vehicle.registration_number})` : 'Allocated Vehicle'
    const dInfo = firstV.driver ? `Driver: ${firstV.driver.full_name} (${firstV.driver.driver_code})` : 'Driver: Self Drive / Unassigned'
    doc.setFont('helvetica', 'bold')
    doc.text(`VEHICLE: ${vInfo}`, A4_MARGINS.left + 4, boxY)
    doc.setFont('helvetica', 'normal')
    doc.text(dInfo, A4_MARGINS.left + 100, boxY)
  }

  currentY += 42

  // Financial Summary Box
  if (booking.grand_total) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(15, 23, 42)
    doc.text(`GRAND TOTAL: LKR ${formatNumberSafe(booking.grand_total)}`, A4_MARGINS.left, currentY)
    doc.text(`ADVANCE PAID: LKR ${formatNumberSafe(booking.advance_paid)}`, A4_MARGINS.left + 65, currentY)
    doc.text(`BALANCE DUE: LKR ${formatNumberSafe(booking.balance_due)}`, A4_MARGINS.left + 130, currentY)
    currentY += 8
  }

  // Terms & Conditions Text
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(15, 23, 42)
  doc.text('TERMS AND CONDITIONS:', A4_MARGINS.left, currentY)

  currentY += 4

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(71, 85, 105)
  const terms = agreement.terms_snapshot || companySettings?.default_agreement_terms || ''
  const splitTerms = doc.splitTextToSize(terms, A4_MARGINS.width)
  doc.text(splitTerms, A4_MARGINS.left, currentY)

  currentY += Math.min(splitTerms.length * 3.5, 80) + 15

  // Signature Block
  const sigY = Math.max(currentY, 225)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(15, 23, 42)

  // Customer Signature
  doc.line(A4_MARGINS.left, sigY, A4_MARGINS.left + 65, sigY)
  doc.text('Signature of Hirer', A4_MARGINS.left, sigY + 4)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.text(`Date: ${agreement.agreement_date || ''}`, A4_MARGINS.left, sigY + 8)

  // Company Signature
  const compX = A4_MARGINS.right - 65
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.line(compX, sigY, A4_MARGINS.right, sigY)
  doc.text('For Thennakoon Tours (Pvt) Ltd', compX, sigY + 4)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.text('Authorized Signature & Stamp', compX, sigY + 8)

  // Draw Full-Page A4 Letterhead Background Image
  drawLetterheadBackground(doc, base64Letterhead)

  return doc
}
