import { jsPDF } from 'jspdf'
import { CustomerStatementItem } from '@/lib/finance/finance-service'
import { setPdfBrandGoldText } from './pdf-theme'

export async function generateCustomerStatementPDF(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  customer: any,
  items: CustomerStatementItem[],
  totalInvoiced: number,
  totalCollected: number,
  outstandingBalance: number
) {
  // A4 Portrait: 210 x 297 mm
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  let currentY = 15

  // Header
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(15, 23, 42)
  doc.text('THENNAKOON TOURS (PVT) LTD', 15, currentY)

  doc.setFontSize(8.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(71, 85, 105)
  doc.text('39A, 1st cross street, Pagoda Road, Nugegoda, Sri Lanka | Reg No. PV 00312253', 15, currentY + 4.5)
  doc.text('Phone: +94 112 823 723 / +94 77 727 3820 | Email: info@thennakoontours.lk', 15, currentY + 8.5)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(15, 23, 42)
  doc.text('CUSTOMER STATEMENT OF ACCOUNT', 195, currentY, { align: 'right' })

  doc.setFontSize(8.5)
  doc.setFont('helvetica', 'normal')
  setPdfBrandGoldText(doc) // Canonical Brand Gold #D97706
  const todayStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  doc.text(`Statement Date: ${todayStr}`, 195, currentY + 5, { align: 'right' })

  currentY += 16
  doc.setLineWidth(0.4)
  doc.setDrawColor(15, 23, 42)
  doc.line(15, currentY, 195, currentY)
  currentY += 6

  // Customer Box
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(15, 23, 42)
  doc.text('STATEMENT ISSUED TO:', 15, currentY)

  currentY += 4.5
  doc.setFontSize(9.5)
  doc.text(customer.full_name || 'Customer Name', 15, currentY)
  if (customer.company_name) {
    currentY += 4
    doc.setFontSize(8.5)
    doc.setFont('helvetica', 'normal')
    doc.text(`Company: ${customer.company_name}`, 15, currentY)
  }

  currentY += 4
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(71, 85, 105)
  doc.text(`Mobile: ${customer.mobile || 'N/A'} | NIC/Passport: ${customer.identifier_no || customer.nic || 'N/A'}`, 15, currentY)
  doc.text(`Address: ${customer.address || customer.address_line_1 || 'Sri Lanka'}`, 15, currentY + 3.5)

  // Summary Metrics Box on top right
  doc.setFillColor(248, 250, 252)
  doc.setDrawColor(226, 232, 240)
  doc.roundedRect(120, currentY - 12, 75, 20, 1.5, 1.5, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(15, 23, 42)
  doc.text(`TOTAL INVOICED: LKR ${totalInvoiced.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 124, currentY - 7)
  doc.setTextColor(16, 185, 129)
  doc.text(`TOTAL COLLECTED: LKR ${totalCollected.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 124, currentY - 3)
  doc.setTextColor(225, 29, 72)
  doc.text(`OUTSTANDING BALANCE: LKR ${outstandingBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 124, currentY + 1)

  currentY += 12

  // Ledger Table Header
  doc.setFillColor(15, 23, 42)
  doc.rect(15, currentY, 180, 6, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(255, 255, 255)

  doc.text('DATE', 17, currentY + 4)
  doc.text('TYPE', 37, currentY + 4)
  doc.text('REFERENCE', 55, currentY + 4)
  doc.text('DESCRIPTION', 85, currentY + 4)
  doc.text('DEBIT (LKR)', 140, currentY + 4, { align: 'right' })
  doc.text('CREDIT (LKR)', 165, currentY + 4, { align: 'right' })

  currentY += 6

  // Ledger Rows
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(30, 41, 59)

  items.forEach((item, idx) => {
    if (currentY > 270) {
      doc.addPage()
      currentY = 15

      doc.setFillColor(15, 23, 42)
      doc.rect(15, currentY, 180, 6, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7.5)
      doc.setTextColor(255, 255, 255)
      doc.text('DATE', 17, currentY + 4)
      doc.text('TYPE', 37, currentY + 4)
      doc.text('REFERENCE', 55, currentY + 4)
      doc.text('DESCRIPTION', 85, currentY + 4)
      doc.text('DEBIT (LKR)', 140, currentY + 4, { align: 'right' })
      doc.text('CREDIT (LKR)', 165, currentY + 4, { align: 'right' })

      currentY += 6
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      doc.setTextColor(30, 41, 59)
    }

    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252)
      doc.rect(15, currentY, 180, 5.5, 'F')
    }

    const dStr = new Date(item.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    doc.text(dStr, 17, currentY + 3.8)
    doc.text(item.type.toUpperCase(), 37, currentY + 3.8)
    doc.text(item.reference || '-', 55, currentY + 3.8)
    const descShort = item.description.length > 32 ? item.description.substring(0, 30) + '...' : item.description
    doc.text(descShort, 85, currentY + 3.8)

    const debitAmt = Number(item.debit || 0)
    const creditAmt = Number(item.credit || 0)

    if (item.type === 'invoice') {
      doc.text(debitAmt.toLocaleString('en-US', { minimumFractionDigits: 2 }), 140, currentY + 3.8, { align: 'right' })
      doc.text('-', 165, currentY + 3.8, { align: 'right' })
    } else {
      doc.text('-', 140, currentY + 3.8, { align: 'right' })
      doc.text(creditAmt.toLocaleString('en-US', { minimumFractionDigits: 2 }), 165, currentY + 3.8, { align: 'right' })
    }

    currentY += 5.5
  })

  return doc
}
