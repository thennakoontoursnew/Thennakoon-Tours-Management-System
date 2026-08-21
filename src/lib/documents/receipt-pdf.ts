import {
  jsPDF,
  autoTable,
  getLetterheadBase64,
  drawLetterheadOnPage,
  drawTextWithOrdinalSuperscript,
  drawAlignedKeyValueRow,
  A4_MARGINS,
} from './pdf-engine'
import { formatDateOrdinal } from '@/lib/utils/formatters'
import { setPdfBrandGoldText } from './pdf-theme'
import { COMPANY_CONFIG } from '../company-config'

function formatCurrency(val: unknown): string {
  const num = Number(val ?? 0)
  if (isNaN(num)) return '0.00'
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function numberToWords(amount: number): string {
  if (!amount || amount <= 0 || isNaN(amount)) return 'ZERO LANKAN RUPEES ONLY'

  const ones = [
    '',
    'ONE',
    'TWO',
    'THREE',
    'FOUR',
    'FIVE',
    'SIX',
    'SEVEN',
    'EIGHT',
    'NINE',
    'TEN',
    'ELEVEN',
    'TWELVE',
    'THIRTEEN',
    'FOURTEEN',
    'FIFTEEN',
    'SIXTEEN',
    'SEVENTEEN',
    'EIGHTEEN',
    'NINETEEN',
  ]
  const tens = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY']

  function convertGroup(n: number): string {
    let str = ''
    if (n >= 100) {
      str += ones[Math.floor(n / 100)] + ' HUNDRED '
      n %= 100
    }
    if (n >= 20) {
      str += tens[Math.floor(n / 10)] + ' '
      n %= 10
    }
    if (n > 0) {
      str += ones[n] + ' '
    }
    return str
  }

  let num = Math.floor(amount)
  let result = ''

  if (num >= 1000000) {
    result += convertGroup(Math.floor(num / 1000000)) + 'MILLION '
    num %= 1000000
  }
  if (num >= 1000) {
    result += convertGroup(Math.floor(num / 1000)) + 'THOUSAND '
    num %= 1000
  }
  if (num > 0) {
    result += convertGroup(num)
  }

  const cents = Math.round((amount - Math.floor(amount)) * 100)
  let centsStr = ''
  if (cents > 0) {
    centsStr = ` AND CENTS ${convertGroup(cents).trim()}`
  }

  return `${result.trim()}${centsStr} LANKAN RUPEES ONLY`.toUpperCase()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function generateReceiptPDF(receiptData: any, companySettings?: any) {
  const doc = new jsPDF('p', 'mm', 'a4')

  try {
    const receipt = receiptData || {}
    const customer = receipt.customer || receipt.customer_snapshot || {}
    const invoice = receipt.invoice || {}
    const booking = receipt.booking || {}
    const vehicleObj = receipt.vehicle || booking.vehicle || invoice.vehicle || {}

    const base64Letterhead = await getLetterheadBase64()

    // 1. Draw Letterhead Background FIRST on Page 1 (Layer 0)
    if (base64Letterhead) {
      drawLetterheadOnPage(doc, base64Letterhead)
    }

    let currentY = A4_MARGINS.top // 48mm top margin below letterhead

    // 1. Centered Document Header Title: "CASH RECEIPT"
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    setPdfBrandGoldText(doc) // Brand Gold #997711
    doc.text('CASH RECEIPT', 105, currentY, { align: 'center' })

    currentY += 7

    // Company Address & Date (Left-aligned) and Receipt Number (Right-aligned)
    const leftX = A4_MARGINS.left
    const rightX = A4_MARGINS.right
    let metaY = currentY

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9.5)
    doc.setTextColor(15, 23, 42)
    doc.text(COMPANY_CONFIG.name, leftX, metaY)

    const receiptNoStr = receipt.receipt_number
      ? String(receipt.receipt_number).startsWith('#')
        ? String(receipt.receipt_number)
        : `#${receipt.receipt_number}`
      : '#CR8076'

    doc.setFontSize(10)
    doc.text(`Receipt No.: ${receiptNoStr}`, rightX, metaY, { align: 'right' })

    metaY += 4.2
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(71, 85, 105)
    doc.text(COMPANY_CONFIG.address, leftX, metaY)

    metaY += 4.0
    const receiptDateStr = formatDateOrdinal(receipt.receipt_date || receipt.created_at || new Date())
    drawTextWithOrdinalSuperscript(doc, `Date: ${receiptDateStr || 'N/A'}`, leftX, metaY)

    currentY = metaY + 7

    // 2. Customer, Payment & Vehicle Key-Value Grid Box
    const gridCardHeight = 44
    doc.setFillColor(248, 250, 252) // Slate-50 background
    doc.setDrawColor(226, 232, 240) // Light border
    doc.roundedRect(A4_MARGINS.left, currentY, A4_MARGINS.width, gridCardHeight, 2.5, 2.5, 'FD')

    const gridLeftX = A4_MARGINS.left + 4
    const gridRightX = A4_MARGINS.left + 95

    let rowLeftY = currentY + 5.5
    let rowRightY = currentY + 5.5

    const custName = customer.full_name || receipt.customer_name || 'Valued Customer'
    const amtPaid = Number(receipt.amount || 0)
    const formattedAmountStr = `LKR ${amtPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}/=`

    const reasonForPayment =
      receipt.payment_reason ||
      receipt.reason ||
      (receipt.payment_method ? `${String(receipt.payment_method).toUpperCase()} Payment` : 'Advance Payment')

    const vehicleReg = vehicleObj.registration_number || invoice.vehicle_registration || receipt.vehicle_registration || 'N/A'
    const vehicleModel =
      [vehicleObj.make, vehicleObj.model].filter(Boolean).join(' ') || invoice.vehicle_name || receipt.vehicle_name || 'N/A'
    const vehicleUserName = custName

    // Left Column Key-Values
    rowLeftY = drawAlignedKeyValueRow(doc, 'Received From', custName, gridLeftX, rowLeftY, { labelWidth: 32, isBoldLabel: true, maxWidth: 58 })
    rowLeftY = drawAlignedKeyValueRow(doc, 'Amount', formattedAmountStr, gridLeftX, rowLeftY, { labelWidth: 32, isBoldValue: true, maxWidth: 58 })
    rowLeftY = drawAlignedKeyValueRow(doc, 'Reason for Payment', reasonForPayment, gridLeftX, rowLeftY, { labelWidth: 32, maxWidth: 58 })

    // Right Column Key-Values
    rowRightY = drawAlignedKeyValueRow(doc, 'Vehicle Number', vehicleReg, gridRightX, rowRightY, { labelWidth: 32, isBoldValue: true, maxWidth: 58 })
    rowRightY = drawAlignedKeyValueRow(doc, 'Vehicle Model', vehicleModel, gridRightX, rowRightY, { labelWidth: 32, maxWidth: 58 })
    rowRightY = drawAlignedKeyValueRow(doc, 'Vehicle User’s Name', vehicleUserName, gridRightX, rowRightY, { labelWidth: 32, maxWidth: 58 })

    // Payment Method Checkboxes Row
    const checkY = currentY + 36.5
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(15, 23, 42)
    doc.text('Payment Method:', gridLeftX, checkY)

    const payMethodLower = String(receipt.payment_method || '').toLowerCase()
    const isCash = payMethodLower.includes('cash') || payMethodLower === ''
    const isBank = payMethodLower.includes('bank') || payMethodLower.includes('transfer')
    const isCheque = payMethodLower.includes('cheque') || payMethodLower.includes('check')
    const isCard = payMethodLower.includes('card')

    const chkX1 = A4_MARGINS.left + 35
    const chkX2 = A4_MARGINS.left + 58
    const chkX3 = A4_MARGINS.left + 96
    const chkX4 = A4_MARGINS.left + 150

    doc.setLineWidth(0.3)
    doc.setDrawColor(71, 85, 105)

    // Cash Checkbox
    doc.rect(chkX1, checkY - 3, 3.2, 3.2)
    if (isCash) {
      doc.setFont('helvetica', 'bold')
      doc.text('X', chkX1 + 0.6, checkY - 0.5)
    }
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text('Cash', chkX1 + 5, checkY)

    // Bank Transfer Checkbox
    doc.rect(chkX2, checkY - 3, 3.2, 3.2)
    if (isBank) {
      doc.setFont('helvetica', 'bold')
      doc.text('X', chkX2 + 0.6, checkY - 0.5)
    }
    doc.setFont('helvetica', 'normal')
    doc.text('Bank Transfer', chkX2 + 5, checkY)

    // Cheque Checkbox
    doc.rect(chkX3, checkY - 3, 3.2, 3.2)
    if (isCheque) {
      doc.setFont('helvetica', 'bold')
      doc.text('X', chkX3 + 0.6, checkY - 0.5)
    }
    doc.setFont('helvetica', 'normal')
    const chequeNoDisplay = isCheque && receipt.reference_number ? receipt.reference_number : '________'
    doc.text(`Cheque No: ${chequeNoDisplay}`, chkX3 + 5, checkY)

    // Card Checkbox
    if (isCard || (!isCash && !isBank && !isCheque)) {
      doc.rect(chkX4, checkY - 3, 3.2, 3.2)
      if (isCard) {
        doc.setFont('helvetica', 'bold')
        doc.text('X', chkX4 + 0.6, checkY - 0.5)
      }
      doc.setFont('helvetica', 'normal')
      doc.text('Card', chkX4 + 5, checkY)
    }

    currentY += gridCardHeight + 6

    // 3. Payment Breakdown Table
    const invTotal = Number(invoice.grand_total || invoice.subtotal || booking.grand_total || amtPaid)
    const balDue = Math.max(0, invTotal - amtPaid)

    let desc = 'Vehicle Rental Service Payment'
    if (invoice.invoice_number || receipt.invoice_number) {
      desc = `Payment received for Invoice #${invoice.invoice_number || receipt.invoice_number}`
    } else if (booking.booking_number || receipt.booking_number) {
      desc = `Payment received for Booking #${booking.booking_number || receipt.booking_number}`
    }

    const tableHead = [['Payment Description', 'Total Due (LKR)', 'Amount Paid (LKR)', 'Balance Due (LKR)']]
    const tableRows = [[desc, formatCurrency(invTotal), formatCurrency(amtPaid), formatCurrency(balDue)]]

    autoTable(doc, {
      startY: currentY,
      head: tableHead,
      body: tableRows,
      margin: { left: A4_MARGINS.left, right: 210 - A4_MARGINS.right },
      styles: { fontSize: 8.5, cellPadding: 2.8, textColor: [34, 34, 34], valign: 'middle' },
      headStyles: {
        fillColor: [23, 23, 26],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8.5,
        halign: 'center',
        valign: 'middle',
      },
      columnStyles: {
        0: { halign: 'left', valign: 'middle' },
        1: { halign: 'center', valign: 'middle' },
        2: { halign: 'center', valign: 'middle', fontStyle: 'bold' },
        3: { halign: 'center', valign: 'middle' },
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    currentY = (doc as any).lastAutoTable.finalY + 5

    // 4. Amount Received Highlight Box
    const highlightBoxHeight = 18
    doc.setFillColor(248, 250, 252)
    doc.setDrawColor(226, 232, 240)
    doc.roundedRect(A4_MARGINS.left, currentY, A4_MARGINS.width, highlightBoxHeight, 2, 2, 'FD')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    setPdfBrandGoldText(doc) // Brand Gold #997711
    doc.text('AMOUNT RECEIVED IN WORDS', A4_MARGINS.left + 4, currentY + 6.5)

    const wordsText = numberToWords(amtPaid)
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(7.5)
    doc.setTextColor(100, 116, 139)
    doc.text(wordsText, A4_MARGINS.left + 4, currentY + 12.5)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.setTextColor(15, 23, 42)
    doc.text(formattedAmountStr, A4_MARGINS.right - 4, currentY + 11.5, { align: 'right' })

    currentY += highlightBoxHeight + 6

    // 5. Terms & Conditions Section
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    setPdfBrandGoldText(doc) // Brand Gold #997711
    doc.text('Terms & Conditions', A4_MARGINS.left, currentY)
    currentY += 4.5

    const defaultTerms = [
      '1. The Advance payment made is non-refundable, even if the vehicle is not collected.',
      '2. The full balance payment must be settled on the date of vehicle collection.',
    ]

    const termsLines = companySettings?.receipt_terms
      ? String(companySettings.receipt_terms).split('\n').filter((t) => t.trim())
      : defaultTerms

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(71, 85, 105)

    for (const term of termsLines) {
      const splitTerm = doc.splitTextToSize(term, A4_MARGINS.width)
      doc.text(splitTerm, A4_MARGINS.left, currentY)
      currentY += splitTerm.length * 3.5 + 1.0
    }

    currentY += 5

    // 6. Signatures Section & Bank Details Box
    const staffName = receipt.prepared_by_name_snapshot || receipt.prepared_by_profile?.full_name || 'Rashanthi Gunasekara'
    const staffDesignation = receipt.prepared_by_designation_snapshot || 'Director'
    const signatureUrl = receipt.prepared_by_profile?.signature_url || companySettings?.signature_url

    // Left Column: Authorized Signature with Dotted Underline & Details
    const sigLeftX = A4_MARGINS.left + 5
    const sigRightX = A4_MARGINS.right - 65
    const sigY = currentY + 12

    // E-Signature image rendering above left dotted line
    if (signatureUrl && typeof signatureUrl === 'string') {
      try {
        const isJpg = signatureUrl.includes('image/jpeg') || signatureUrl.includes('image/jpg')
        doc.addImage(signatureUrl, isJpg ? 'JPEG' : 'PNG', sigLeftX, sigY - 11, 30, 11)
      } catch (e) {
        console.warn('[Receipt PDF] Could not embed signature image:', e)
      }
    }

    // Dotted Lines for Signatures
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(148, 163, 184)
    doc.text('...............................................................................', sigLeftX, sigY)
    doc.text('...............................................................................', sigRightX, sigY)

    // Left Signature Details (Authorized Signature)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(15, 23, 42)
    doc.text('Authorized Signature', sigLeftX, sigY + 4)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(71, 85, 105)
    doc.text(`Name: ${staffName}`, sigLeftX, sigY + 8)
    doc.text(`Designation: ${staffDesignation}`, sigLeftX, sigY + 11.5)

    // Right Signature Details (Payee's Signature)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(15, 23, 42)
    doc.text("Payee's Signature", sigRightX, sigY + 4)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(71, 85, 105)
    doc.text('(Customer / Hirer Signature)', sigRightX, sigY + 8)

    // 7. Bank Details Box (Bottom Left)
    const bankBoxY = sigY + 17
    const bankBoxWidth = 85
    const bankBoxHeight = 22

    doc.setFillColor(248, 250, 252)
    doc.setDrawColor(226, 232, 240)
    doc.roundedRect(A4_MARGINS.left, bankBoxY, bankBoxWidth, bankBoxHeight, 2, 2, 'FD')

    const bankAccName = companySettings?.bank_account_name || COMPANY_CONFIG.bank.accountName
    const bankAccNum = companySettings?.bank_account_number || COMPANY_CONFIG.bank.accountNumber
    const bankName = companySettings?.bank_name || COMPANY_CONFIG.bank.bankName
    const bankSwift = companySettings?.bank_swift_code || COMPANY_CONFIG.bank.swiftCode

    let bY = bankBoxY + 4.5
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    setPdfBrandGoldText(doc) // Brand Gold #997711
    doc.text('BANK DETAILS', A4_MARGINS.left + 4, bY)

    bY += 4.0
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(15, 23, 42)
    doc.text(bankAccName, A4_MARGINS.left + 4, bY)

    bY += 3.8
    doc.setFont('helvetica', 'bold')
    doc.text(`Account # ${bankAccNum}`, A4_MARGINS.left + 4, bY)

    bY += 3.8
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(71, 85, 105)
    doc.text(`${bankName} | Swift: ${bankSwift}`, A4_MARGINS.left + 4, bY)

    return doc
  } catch (err: any) {
    console.error('[generateReceiptPDF Error]:', err)
    return doc
  }
}
