import {
  jsPDF,
  autoTable,
  getLetterheadBase64,
  drawLetterheadOnPage,
  drawTextWithOrdinalSuperscript,
  drawAlignedKeyValueRow,
  drawPreparedBySection,
  A4_MARGINS,
} from './pdf-engine'
import { formatDateOrdinal } from '@/lib/utils/formatters'
import { setPdfBrandGoldText } from './pdf-theme'

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

    const base64Letterhead = await getLetterheadBase64()

    // 1. Draw Letterhead Background FIRST on Page 1 (Layer 0)
    if (base64Letterhead) {
      drawLetterheadOnPage(doc, base64Letterhead)
    }

    let currentY = A4_MARGINS.top // 48mm top margin below letterhead

    // 2. Header Section
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)
    setPdfBrandGoldText(doc) // Brand Gold #997711
    doc.text('PAYMENT RECEIPT', A4_MARGINS.left, currentY)

    const receiptNo = String(receipt.receipt_number || 'RCPT-0000').startsWith('#')
      ? String(receipt.receipt_number || 'RCPT-0000')
      : `#${receipt.receipt_number || 'RCPT-0000'}`

    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(15, 23, 42)
    doc.text(receiptNo, A4_MARGINS.right, currentY, { align: 'right' })

    currentY += 5.5

    const dateStr = formatDateOrdinal(receipt.receipt_date || receipt.created_at || new Date().toISOString())
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(71, 85, 105)
    drawTextWithOrdinalSuperscript(doc, `Date: ${dateStr || 'N/A'}`, A4_MARGINS.left, currentY)

    currentY += 8

    // 3. Customer & Payment Details Grid Box
    const cardHeight = 36
    doc.setFillColor(248, 250, 252) // Slate-50 background
    doc.setDrawColor(226, 232, 240) // Light border
    doc.roundedRect(A4_MARGINS.left, currentY, A4_MARGINS.width, cardHeight, 3, 3, 'FD')

    const leftX = A4_MARGINS.left + 4
    const rightX = A4_MARGINS.left + 95

    let leftY = currentY + 5.5
    let rightY = currentY + 5.5

    const custName = customer.full_name || receipt.customer_name || 'Valued Customer'
    const custPhone = customer.mobile || customer.phone || 'N/A'
    const custEmail = customer.email || 'N/A'

    leftY = drawAlignedKeyValueRow(doc, 'Received From', custName, leftX, leftY, { labelWidth: 26, isBoldLabel: true, maxWidth: 60 })
    leftY = drawAlignedKeyValueRow(doc, 'Contact No', custPhone, leftX, leftY, { labelWidth: 26, maxWidth: 60 })
    leftY = drawAlignedKeyValueRow(doc, 'Email', custEmail, leftX, leftY, { labelWidth: 26, maxWidth: 60 })

    const payMethod = String(receipt.payment_method || 'Cash').toUpperCase()
    const payRef = receipt.reference_number || receipt.transaction_id || 'N/A'
    const invNo = invoice.invoice_number || receipt.invoice_number ? `#${invoice.invoice_number || receipt.invoice_number}` : 'N/A'
    const bookNo = booking.booking_number || receipt.booking_number ? `#${booking.booking_number || receipt.booking_number}` : 'N/A'

    rightY = drawAlignedKeyValueRow(doc, 'Payment Method', payMethod, rightX, rightY, { labelWidth: 26, maxWidth: 58 })
    rightY = drawAlignedKeyValueRow(doc, 'Payment Ref', payRef, rightX, rightY, { labelWidth: 26, maxWidth: 58 })
    rightY = drawAlignedKeyValueRow(doc, 'Related Invoice', invNo, rightX, rightY, { labelWidth: 26, maxWidth: 58 })
    rightY = drawAlignedKeyValueRow(doc, 'Booking Ref', bookNo, rightX, rightY, { labelWidth: 26, maxWidth: 58 })

    currentY += Math.max(leftY - currentY, rightY - currentY, cardHeight) + 6

    // 4. Payment Breakdown Table
    const amtPaid = Number(receipt.amount || 0)
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
      styles: { fontSize: 9, cellPadding: 3, textColor: [34, 34, 34], valign: 'middle' },
      headStyles: {
        fillColor: [23, 23, 26],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
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
    currentY = (doc as any).lastAutoTable.finalY + 6

    // 5. Big Highlight Box for Amount Received
    const highlightBoxHeight = 24
    doc.setFillColor(248, 250, 252) // Slate-50
    doc.setDrawColor(226, 232, 240)
    doc.roundedRect(A4_MARGINS.left, currentY, A4_MARGINS.width, highlightBoxHeight, 2.5, 2.5, 'FD')

    // Left side text inside box
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    setPdfBrandGoldText(doc) // Brand Gold #997711
    doc.text('AMOUNT RECEIVED', A4_MARGINS.left + 5, currentY + 7.5)

    const wordsText = numberToWords(amtPaid)
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(7.5)
    doc.setTextColor(100, 116, 139)
    doc.text(wordsText, A4_MARGINS.left + 5, currentY + 14.5)

    // Right side amount inside box
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.setTextColor(15, 23, 42) // Dark Slate
    doc.text(`LKR ${formatCurrency(amtPaid)}`, A4_MARGINS.right - 5, currentY + 14, { align: 'right' })

    currentY += highlightBoxHeight + 10

    // 6. Footer & Sign-off Block
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9.5)
    setPdfBrandGoldText(doc) // Brand Gold #997711
    doc.text('THANK YOU FOR YOUR BUSINESS!', A4_MARGINS.left, currentY)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(100, 116, 139)
    doc.text('This is an official receipt issued by Thennakoon Tours (Pvt) Ltd.', A4_MARGINS.left, currentY + 4.5)
    doc.text('Received with thanks and subject to realization of cheque / bank transfer.', A4_MARGINS.left, currentY + 8.5)

    const staffName = receipt.prepared_by_name_snapshot || receipt.prepared_by_profile?.full_name || 'Rashanthi Gunasekara'
    const staffDesignation = receipt.prepared_by_designation_snapshot || 'Director'
    const companyName = 'THENNAKOON TOURS (PVT) LTD'
    const signatureUrl = receipt.prepared_by_profile?.signature_url || companySettings?.signature_url

    // Standardized PREPARED BY Section
    const prepY = currentY + 14
    drawPreparedBySection(
      doc,
      'PREPARED BY:',
      staffName,
      staffDesignation,
      companyName,
      A4_MARGINS.left,
      prepY,
      signatureUrl
    )

    return doc
  } catch (err: any) {
    console.error('[generateReceiptPDF Error]:', err)
    return doc
  }
}
