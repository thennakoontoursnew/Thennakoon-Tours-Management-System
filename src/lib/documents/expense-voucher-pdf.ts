import {
  jsPDF,
  autoTable,
  getLetterheadBase64,
  drawLetterheadOnPage,
  A4_MARGINS,
} from './pdf-engine'
import { formatDateOrdinal } from '@/lib/utils/formatters'
import { setPdfBrandGoldText } from './pdf-theme'

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

function formatCurrency(val: unknown): string {
  const num = Number(val ?? 0)
  if (isNaN(num)) return '0.00'
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function generateExpenseVoucherPDF(voucherData: ExpenseVoucherData, companySettings?: any) {
  const doc = new jsPDF('p', 'mm', 'a4')

  try {
    const base64Letterhead = await getLetterheadBase64(companySettings)

    // 1. Draw Letterhead Background FIRST on Page 1
    if (base64Letterhead) {
      drawLetterheadOnPage(doc, base64Letterhead)
    }

    let currentY = 50

    // Title Section
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.setTextColor(15, 23, 42) // slate-900
    
    const isOwnerStatement = voucherData.category === 'owner_statement' || voucherData.category === 'Owner Statement'
    const docTitle = isOwnerStatement ? 'OWNER STATEMENT & PAYMENT VOUCHER' : 'OPERATING EXPENSE VOUCHER'
    
    doc.text(docTitle, A4_MARGINS.left, currentY)
    currentY += 6

    // Subtitle / Voucher No & Date
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    setPdfBrandGoldText(doc)
    
    const vNum = voucherData.voucher_number || voucherData.expense_number || 'VOUCH-PENDING'
    const dateFormatted = voucherData.expense_date ? formatDateOrdinal(voucherData.expense_date) : formatDateOrdinal(new Date())
    
    doc.text(`Voucher No: ${vNum}`, A4_MARGINS.left, currentY)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 116, 139) // slate-500
    doc.text(`Date: ${dateFormatted}`, A4_MARGINS.left + 110, currentY, { align: 'left' })

    currentY += 8

    // Voucher Info Grid Box
    doc.setDrawColor(226, 232, 240) // slate-200
    doc.setFillColor(248, 250, 252) // slate-50
    doc.roundedRect(A4_MARGINS.left, currentY, 180, 22, 2, 2, 'FD')

    let boxY = currentY + 5
    doc.setFontSize(9)
    
    // Line 1: Bill Name & Payee / Customer
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(51, 65, 85) // slate-700
    doc.text('Bill Name / Particular:', A4_MARGINS.left + 4, boxY)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(15, 23, 42)
    doc.text(voucherData.bill_name || voucherData.description || 'N/A', A4_MARGINS.left + 42, boxY)

    doc.setFont('helvetica', 'bold')
    doc.setTextColor(51, 65, 85)
    doc.text('Payee / Beneficiary:', A4_MARGINS.left + 105, boxY)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(15, 23, 42)
    doc.text(voucherData.customer_name || voucherData.supplier_name || 'N/A', A4_MARGINS.left + 140, boxY)

    boxY += 6

    // Line 2: Category & Payment Method
    const catDisplay = (voucherData.category || 'General').replace('_', ' ').toUpperCase()
    const methodDisplay = (voucherData.payment_method || 'cash').replace('_', ' ').toUpperCase()

    doc.setFont('helvetica', 'bold')
    doc.setTextColor(51, 65, 85)
    doc.text('Category:', A4_MARGINS.left + 4, boxY)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(15, 23, 42)
    doc.text(catDisplay, A4_MARGINS.left + 42, boxY)

    doc.setFont('helvetica', 'bold')
    doc.setTextColor(51, 65, 85)
    doc.text('Payment Method:', A4_MARGINS.left + 105, boxY)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(15, 23, 42)
    doc.text(methodDisplay, A4_MARGINS.left + 140, boxY)

    boxY += 6
    if (voucherData.reference_number) {
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(51, 65, 85)
      doc.text('Ref / Check No:', A4_MARGINS.left + 4, boxY)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(15, 23, 42)
      doc.text(voucherData.reference_number, A4_MARGINS.left + 42, boxY)
    }

    currentY += 28

    // Bank Account Details Box (If provided)
    if (voucherData.account_number || voucherData.bank_name) {
      doc.setDrawColor(217, 119, 6) // amber-600
      doc.setFillColor(254, 243, 199) // amber-100/50
      doc.roundedRect(A4_MARGINS.left, currentY, 180, 14, 2, 2, 'FD')

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(180, 83, 9) // amber-700
      doc.text('BANKING DISBURSEMENT DETAILS', A4_MARGINS.left + 4, currentY + 5)

      doc.setFont('helvetica', 'normal')
      doc.setTextColor(30, 41, 59)
      const bName = voucherData.bank_name || 'N/A'
      const bBranch = voucherData.branch_name ? ` (${voucherData.branch_name})` : ''
      const accNum = voucherData.account_number || 'N/A'
      doc.text(`Bank: ${bName}${bBranch}   |   Account No: ${accNum}`, A4_MARGINS.left + 4, currentY + 10)

      currentY += 18
    }

    // Prepare Tables for Additions & Deductions
    const rawAdditions = voucherData.add_payments_breakdown && Array.isArray(voucherData.add_payments_breakdown)
      ? voucherData.add_payments_breakdown
      : []
    
    const rawDeductions = voucherData.deduction_breakdown && Array.isArray(voucherData.deduction_breakdown)
      ? voucherData.deduction_breakdown
      : []

    // Additions Table
    const additionsData = rawAdditions.length > 0
      ? rawAdditions.map((item, idx) => [String(idx + 1), item.description || 'Addition Particular', formatCurrency(item.amount)])
      : [['1', voucherData.description || 'Base Payment / Earnings', formatCurrency(voucherData.amount || 0)]]

    const totalAdditions = rawAdditions.length > 0
      ? rawAdditions.reduce((acc, curr) => acc + Number(curr.amount || 0), 0)
      : Number(voucherData.amount || 0)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(16, 185, 129) // emerald-500
    doc.text('1. ADD PAYMENTS / EARNINGS (+)', A4_MARGINS.left, currentY)
    currentY += 2

    autoTable(doc, {
      startY: currentY,
      margin: { left: A4_MARGINS.left, right: A4_MARGINS.right },
      head: [['#', 'Description / Particulars', 'Amount (LKR)']],
      body: [
        ...additionsData,
        ['', 'TOTAL ADDITIONS (+)', formatCurrency(totalAdditions)],
      ],
      headStyles: {
        fillColor: [16, 185, 129],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
      },
      columnStyles: {
        0: { cellWidth: 15, halign: 'center' },
        1: { cellWidth: 125, halign: 'left' },
        2: { cellWidth: 40, halign: 'right', fontStyle: 'bold' },
      },
      bodyStyles: {
        fontSize: 8.5,
        textColor: [30, 41, 59],
      },
      theme: 'grid',
      didParseCell: (data) => {
        if (data.row.index === additionsData.length) {
          data.cell.styles.fontStyle = 'bold'
          data.cell.styles.fillColor = [240, 253, 244]
        }
      },
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    currentY = (doc as any).lastAutoTable.finalY + 8

    // Deductions Table (If any)
    const deductionsData = rawDeductions.map((item, idx) => [
      String(idx + 1),
      item.description || 'Deduction Item',
      formatCurrency(item.amount),
    ])

    const totalDeductions = rawDeductions.reduce((acc, curr) => acc + Number(curr.amount || 0), 0)

    if (rawDeductions.length > 0) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(239, 68, 68) // rose-500
      doc.text('2. DEDUCTION BREAKDOWN (-)', A4_MARGINS.left, currentY)
      currentY += 2

      autoTable(doc, {
        startY: currentY,
        margin: { left: A4_MARGINS.left, right: A4_MARGINS.right },
        head: [['#', 'Description / Deduction Reason', 'Amount (LKR)']],
        body: [
          ...deductionsData,
          ['', 'TOTAL DEDUCTIONS (-)', formatCurrency(totalDeductions)],
        ],
        headStyles: {
          fillColor: [225, 29, 72], // rose-600
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9,
        },
        columnStyles: {
          0: { cellWidth: 15, halign: 'center' },
          1: { cellWidth: 125, halign: 'left' },
          2: { cellWidth: 40, halign: 'right', fontStyle: 'bold' },
        },
        bodyStyles: {
          fontSize: 8.5,
          textColor: [30, 41, 59],
        },
        theme: 'grid',
        didParseCell: (data) => {
          if (data.row.index === deductionsData.length) {
            data.cell.styles.fontStyle = 'bold'
            data.cell.styles.fillColor = [255, 241, 242]
          }
        },
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      currentY = (doc as any).lastAutoTable.finalY + 8
    }

    // Net Balance Summary Box
    const calcNetBalance = voucherData.net_balance !== undefined && voucherData.net_balance !== null
      ? voucherData.net_balance
      : totalAdditions - totalDeductions

    doc.setDrawColor(15, 23, 42) // slate-900
    doc.setFillColor(15, 23, 42) // dark slate background
    doc.roundedRect(A4_MARGINS.left, currentY, 180, 16, 2, 2, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(255, 255, 255)
    doc.text('NET BALANCE PAYABLE / DISBURSED:', A4_MARGINS.left + 6, currentY + 10.5)

    doc.setFontSize(13)
    doc.setTextColor(250, 204, 21) // yellow-400 gold
    doc.text(`LKR ${formatCurrency(calcNetBalance)}`, A4_MARGINS.left + 174, currentY + 10.5, { align: 'right' })

    currentY += 22

    // Remarks & Special Notice Box (if any)
    if (voucherData.remark || voucherData.special_notice) {
      doc.setDrawColor(226, 232, 240)
      doc.setFillColor(248, 250, 252)
      
      let noteHeight = 12
      if (voucherData.remark && voucherData.special_notice) noteHeight = 20
      
      doc.roundedRect(A4_MARGINS.left, currentY, 180, noteHeight, 2, 2, 'FD')
      let noteY = currentY + 5

      if (voucherData.remark) {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(8.5)
        doc.setTextColor(71, 85, 105)
        doc.text('Remarks:', A4_MARGINS.left + 4, noteY)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(15, 23, 42)
        doc.text(voucherData.remark, A4_MARGINS.left + 24, noteY)
        noteY += 6
      }

      if (voucherData.special_notice) {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(8.5)
        doc.setTextColor(225, 29, 72)
        doc.text('Special Notice:', A4_MARGINS.left + 4, noteY)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(15, 23, 42)
        doc.text(voucherData.special_notice, A4_MARGINS.left + 30, noteY)
      }

      currentY += noteHeight + 10
    } else {
      currentY += 6
    }

    // Signatures Section (Positioned safely above bottom margin)
    const sigY = Math.max(currentY + 10, 245)

    doc.setDrawColor(203, 213, 225) // slate-300
    
    // Prepared By
    doc.line(A4_MARGINS.left, sigY, A4_MARGINS.left + 50, sigY)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(51, 65, 85)
    doc.text('Prepared By', A4_MARGINS.left, sigY + 4)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 116, 139)
    doc.text(voucherData.prepared_by || 'Finance Officer', A4_MARGINS.left, sigY + 8)

    // Received By / Payee
    doc.line(A4_MARGINS.left + 65, sigY, A4_MARGINS.left + 115, sigY)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(51, 65, 85)
    doc.text('Received By / Payee', A4_MARGINS.left + 65, sigY + 4)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 116, 139)
    doc.text(voucherData.customer_name || voucherData.supplier_name || 'Signature & Stamp', A4_MARGINS.left + 65, sigY + 8)

    // Approved By
    doc.line(A4_MARGINS.left + 130, sigY, A4_MARGINS.left + 180, sigY)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(51, 65, 85)
    doc.text('Approved By', A4_MARGINS.left + 130, sigY + 4)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 116, 139)
    doc.text(voucherData.approved_by || 'Managing Director', A4_MARGINS.left + 130, sigY + 8)

    return doc
  } catch (err) {
    console.error('[generateExpenseVoucherPDF Error]:', err)
    throw err
  }
}
