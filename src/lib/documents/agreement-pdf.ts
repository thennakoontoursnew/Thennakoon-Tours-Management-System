import { jsPDF, LEGAL_MARGINS } from './pdf-engine'
import { USER_AGREEMENT_COMPANY_REG_NO } from '@/lib/agreements/templates/user-agreement-v1'

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
  doc.setTextColor(180, 83, 9)
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

  // STEP 3: Vehicle Details Section
  boxY += 6
  const vInfo = vehicleObj.make_model ? `${vehicleObj.make_model} (${vehicleObj.registration_number || 'N/A'})` : 'Allocated Vehicle'
  doc.setFont('helvetica', 'bold')
  doc.text(`VEHICLE: ${vInfo}`, LEGAL_MARGINS.left + 4, boxY)
  doc.setFont('helvetica', 'normal')
  doc.text(`Fuel: ${vehicleObj.fuel_type || 'Petrol'} | Color: ${vehicleObj.color || 'White'}`, LEGAL_MARGINS.left + 100, boxY)

  currentY += 42

  // Financial Summary Box
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(15, 23, 42)
  doc.text(`DAILY TARIFF: LKR ${formatNumberSafe(rentalObj.daily_rental_rate || 7500)}`, LEGAL_MARGINS.left, currentY)
  doc.text(`SECURITY DEPOSIT: LKR ${formatNumberSafe(rentalObj.security_deposit || 50000)}`, LEGAL_MARGINS.left + 65, currentY)
  doc.text(`EXTRA KM RATE: LKR ${rentalObj.extra_km_rate || 75}/KM`, LEGAL_MARGINS.left + 130, currentY)
  currentY += 8

  // STEP 4: Terms & Conditions Section Header
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(15, 23, 42)
  doc.text('TERMS AND CONDITIONS (USER_AGREEMENT_V1):', LEGAL_MARGINS.left, currentY)

  currentY += 4

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(71, 85, 105)
  const terms = agreement.terms_snapshot || companySettings?.default_agreement_terms || 'Standard User Agreement V1 official legal terms apply.'
  const splitTerms = doc.splitTextToSize(terms, LEGAL_MARGINS.width)
  doc.text(splitTerms, LEGAL_MARGINS.left, currentY)

  currentY += Math.min(splitTerms.length * 3.5, 120) + 15

  // STEP 5: Footer / Signature Section
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

  // Add Dynamic Page X of Y Footer
  const totalPages = (doc as any).internal.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(100, 116, 139)
    doc.text(`Agreement Ref: ${agreement.agreement_number || 'N/A'}`, LEGAL_MARGINS.left, 348)
    doc.text(`Page ${i} of ${totalPages}`, LEGAL_MARGINS.right, 348, { align: 'right' })
  }

  return doc
}
