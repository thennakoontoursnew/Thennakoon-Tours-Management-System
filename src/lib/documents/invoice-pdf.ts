import { jsPDF, autoTable, getLetterheadBase64, A4_MARGINS } from './pdf-engine'

export async function generateInvoicePDF(invoice: any, companySettings: any) {
  console.log('InvoiceDocument mounted')

  if (!invoice) {
    console.error('Invoice data missing in generateInvoicePDF')
    throw new Error('Invoice data missing')
  }

  const doc = new jsPDF('p', 'mm', 'a4')

  console.log('Rendering Page 1')

  // STEP 1: Draw Letterhead Background Image FIRST before any content
  const base64Letterhead = await getLetterheadBase64()
  if (base64Letterhead) {
    doc.addImage(base64Letterhead, 'PNG', 0, 0, 210, 297)
  }

  let currentY = A4_MARGINS.top

  // STEP 2: Header Title & Document Number
  console.log('Rendering Header')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(30, 41, 59) // Slate-800
  doc.text('INVOICE', A4_MARGINS.left, currentY)

  doc.setFontSize(10)
  doc.setTextColor(71, 85, 105)
  doc.text(`Invoice No: ${invoice.invoice_number || 'N/A'}`, A4_MARGINS.right, currentY, { align: 'right' })

  currentY += 6

  // Date & Status
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(`Invoice Date: ${invoice.invoice_date || new Date().toISOString().split('T')[0]}`, A4_MARGINS.left, currentY)
  doc.text(`Due Date: ${invoice.due_date || 'Upon Receipt'}`, A4_MARGINS.right, currentY, { align: 'right' })

  currentY += 8

  // STEP 3: Customer Box
  console.log('Rendering Customer')
  const customer = invoice.customer || {}
  doc.setFillColor(248, 250, 252)
  doc.setDrawColor(226, 232, 240)
  doc.roundedRect(A4_MARGINS.left, currentY, A4_MARGINS.width, 22, 2, 2, 'FD')

  let boxY = currentY + 5
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(15, 23, 42)
  doc.text(`BILLED TO: ${customer.full_name || 'Valued Customer'}`, A4_MARGINS.left + 4, boxY)

  boxY += 5
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(71, 85, 105)
  doc.text(`Mobile: ${customer.mobile || 'N/A'}  |  Address: ${customer.city || customer.address_line_1 || 'Sri Lanka'}`, A4_MARGINS.left + 4, boxY)

  boxY += 5
  doc.text(`Status: ${String(invoice.status || 'draft').toUpperCase()}`, A4_MARGINS.left + 4, boxY)

  currentY += 26

  // STEP 4: Items Table
  console.log('Rendering Table')
  const itemsList = invoice.items || []
  const tableHead = [['#', 'Description', 'Qty', 'Unit Price (LKR)', 'Amount (LKR)']]
  const tableRows = itemsList.length > 0
    ? itemsList.map((item: any, idx: number) => [
        idx + 1,
        item.description || 'Rental Charges',
        item.quantity || 1,
        Number(item.unit_price || 0).toLocaleString('en-US', { minimumFractionDigits: 2 }),
        Number(item.line_total || 0).toLocaleString('en-US', { minimumFractionDigits: 2 }),
      ])
    : [[1, 'Vehicle Rental Service', 1, Number(invoice.subtotal || 0).toLocaleString('en-US', { minimumFractionDigits: 2 }), Number(invoice.subtotal || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })]]

  autoTable(doc, {
    startY: currentY,
    head: tableHead,
    body: tableRows,
    margin: { left: A4_MARGINS.left, right: 210 - A4_MARGINS.right },
    styles: { fontSize: 8, cellPadding: 2.5, textColor: [15, 23, 42] },
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  })

  currentY = (doc as any).lastAutoTable.finalY + 6

  // STEP 5: Totals Summary Box
  console.log('Rendering Totals')
  const totalsX = A4_MARGINS.right - 75
  doc.setFontSize(8.5)

  doc.setFont('helvetica', 'normal')
  doc.setTextColor(71, 85, 105)
  doc.text('Subtotal:', totalsX, currentY)
  doc.text(`LKR ${Number(invoice.subtotal || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, A4_MARGINS.right, currentY, { align: 'right' })
  currentY += 4.5

  if (Number(invoice.amount_paid) > 0) {
    doc.text('Amount Paid:', totalsX, currentY)
    doc.text(`- LKR ${Number(invoice.amount_paid || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, A4_MARGINS.right, currentY, { align: 'right' })
    currentY += 4.5
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(15, 23, 42)
  doc.text('BALANCE DUE:', totalsX, currentY)
  doc.text(`LKR ${Number(invoice.balance_due || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, A4_MARGINS.right, currentY, { align: 'right' })

  currentY += 10

  // Important Message
  const importantMsg = invoice.important_message || ''
  if (importantMsg.trim()) {
    doc.setFillColor(254, 243, 199)
    doc.setDrawColor(245, 158, 11)
    doc.roundedRect(A4_MARGINS.left, currentY, A4_MARGINS.width, 10, 1.5, 1.5, 'FD')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(180, 83, 9)
    doc.text(importantMsg, A4_MARGINS.left + 4, currentY + 6)
    currentY += 14
  }

  // Bank Details Box
  const bank = invoice.bank_details_snapshot || companySettings?.bank_details || {
    bank_name: companySettings?.bank_name || 'Bank of Ceylon',
    bank_branch: companySettings?.bank_branch || 'Colombo Super Grade',
    bank_account_name: companySettings?.bank_account_name || 'Thennakoon Tours (Pvt) Ltd',
    bank_account_number: companySettings?.bank_account_number || '000123456789',
    bank_swift_code: companySettings?.bank_swift_code || 'BCEYLKLX',
  }

  doc.setFillColor(241, 245, 249)
  doc.roundedRect(A4_MARGINS.left, currentY, A4_MARGINS.width, 20, 2, 2, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(15, 23, 42)
  doc.text('PAYMENT INSTRUCTIONS:', A4_MARGINS.left + 4, currentY + 5)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(51, 65, 85)
  doc.text(`Bank: ${bank.bank_name || 'Bank of Ceylon'} (${bank.bank_branch || 'Colombo Super Grade'})`, A4_MARGINS.left + 4, currentY + 10)
  doc.text(`Account No: ${bank.bank_account_number || '000123456789'}  |  Name: ${bank.bank_account_name || 'Thennakoon Tours (Pvt) Ltd'}`, A4_MARGINS.left + 4, currentY + 14)

  currentY += 26

  // STEP 6: Prepared By Signature Block
  console.log('Rendering Footer')
  const prepLabel = invoice.prepared_by_label_snapshot || 'Accounts Manager'
  const prepX = A4_MARGINS.right - 60
  doc.line(prepX, currentY, A4_MARGINS.right, currentY)
  currentY += 4
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(15, 23, 42)
  doc.text(prepLabel, prepX + 30, currentY, { align: 'center' })

  return doc
}
