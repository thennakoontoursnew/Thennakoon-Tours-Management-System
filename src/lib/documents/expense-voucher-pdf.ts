import {
  jsPDF,
  autoTable,
  getLetterheadBase64,
  drawLetterheadOnPage,
  A4_MARGINS,
} from './pdf-engine'
import { formatDateOrdinal } from '@/lib/utils/formatters'

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

    let currentY = 48

    const isOwnerStatement = voucherData.category === 'owner_statement' || voucherData.category === 'Owner Statement'
    const docTitle = isOwnerStatement ? 'OWNER STATEMENT & PAYMENT VOUCHER' : 'OPERATING EXPENSE VOUCHER'
    const vNum = voucherData.voucher_number || voucherData.expense_number || 'VN-10001'
    const dateFormatted = voucherData.expense_date ? formatDateOrdinal(voucherData.expense_date) : formatDateOrdinal(new Date())

    // 2. Executive Corporate Banner Header
    doc.setFillColor(30, 41, 59) // Slate-800 (#1e293b)
    doc.roundedRect(A4_MARGINS.left, currentY, 180, 16, 2, 2, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(255, 255, 255)
    doc.text(docTitle, A4_MARGINS.left + 5, currentY + 10.5)

    doc.setFontSize(9)
    doc.setTextColor(245, 158, 11) // Warm Amber (#f59e0b)
    doc.text(`Voucher: ${vNum}`, A4_MARGINS.left + 175, currentY + 6.5, { align: 'right' })

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(203, 213, 225) // Slate-300
    doc.text(`Date: ${dateFormatted}`, A4_MARGINS.left + 175, currentY + 11.5, { align: 'right' })

    currentY += 21

    // 3. Voucher Info Grid Card (Executive Muted Palette)
    doc.setDrawColor(226, 232, 240) // slate-200
    doc.setFillColor(248, 250, 252) // slate-50
    doc.roundedRect(A4_MARGINS.left, currentY, 180, 20, 2, 2, 'FD')

    let boxY = currentY + 5.5
    doc.setFontSize(8.5)

    // Line 1: Bill Name & Payee
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(100, 116, 139) // Slate-500
    doc.text('PARTICULAR / BILL:', A4_MARGINS.left + 4, boxY)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(15, 23, 42) // Slate-900
    doc.text(voucherData.bill_name || voucherData.description || 'N/A', A4_MARGINS.left + 38, boxY)

    doc.setFont('helvetica', 'bold')
    doc.setTextColor(100, 116, 139)
    doc.text('PAYEE / BENEFICIARY:', A4_MARGINS.left + 105, boxY)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(15, 23, 42)
    doc.text(voucherData.customer_name || voucherData.supplier_name || 'N/A', A4_MARGINS.left + 142, boxY)

    boxY += 6

    // Line 2: Category & Method
    const catDisplay = (voucherData.category || 'General').replace('_', ' ').toUpperCase()
    const methodDisplay = (voucherData.payment_method || 'cash').replace('_', ' ').toUpperCase()

    doc.setFont('helvetica', 'bold')
    doc.setTextColor(100, 116, 139)
    doc.text('CATEGORY:', A4_MARGINS.left + 4, boxY)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(30, 41, 59)
    doc.text(catDisplay, A4_MARGINS.left + 38, boxY)

    doc.setFont('helvetica', 'bold')
    doc.setTextColor(100, 116, 139)
    doc.text('PAYMENT METHOD:', A4_MARGINS.left + 105, boxY)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(30, 41, 59)
    doc.text(methodDisplay, A4_MARGINS.left + 142, boxY)

    currentY += 24

    // 4. Banking Details Card (If provided)
    if (voucherData.account_number || voucherData.bank_name) {
      doc.setDrawColor(203, 213, 225)
      doc.setFillColor(241, 245, 249) // Slate-100
      doc.roundedRect(A4_MARGINS.left, currentY, 180, 13, 2, 2, 'FD')

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(71, 85, 105) // Slate-600
      doc.text('BANKING DISBURSEMENT ACCOUNT:', A4_MARGINS.left + 4, currentY + 4.5)

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8.5)
      doc.setTextColor(15, 23, 42)
      const bName = voucherData.bank_name || 'N/A'
      const bBranch = voucherData.branch_name ? ` (${voucherData.branch_name})` : ''
      const accNum = voucherData.account_number || 'N/A'
      doc.text(`Bank: ${bName}${bBranch}    |    A/C No: ${accNum}`, A4_MARGINS.left + 4, currentY + 9.5)

      currentY += 17
    }

    // 5. Additions & Deductions Breakdown Tables
    const rawAdditions = voucherData.add_payments_breakdown && Array.isArray(voucherData.add_payments_breakdown)
      ? voucherData.add_payments_breakdown
      : []

    const rawDeductions = voucherData.deduction_breakdown && Array.isArray(voucherData.deduction_breakdown)
      ? voucherData.deduction_breakdown
      : []

    const additionsData = rawAdditions.length > 0
      ? rawAdditions.map((item, idx) => [String(idx + 1), item.description || 'Addition Particular', formatCurrency(item.amount)])
      : [['1', voucherData.description || 'Base Earnings / Gross Hire Charge', formatCurrency(voucherData.amount || 0)]]

    const totalAdditions = rawAdditions.length > 0
      ? rawAdditions.reduce((acc, curr) => acc + Number(curr.amount || 0), 0)
      : Number(voucherData.amount || 0)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(30, 41, 59)
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
        fillColor: [30, 41, 59], // Slate-800
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8.5,
      },
      columnStyles: {
        0: { cellWidth: 15, halign: 'center' },
        1: { cellWidth: 125, halign: 'left' },
        2: { cellWidth: 40, halign: 'right', fontStyle: 'bold' },
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [30, 41, 59],
      },
      theme: 'grid',
      didParseCell: (data) => {
        if (data.row.index === additionsData.length) {
          data.cell.styles.fontStyle = 'bold'
          data.cell.styles.fillColor = [241, 245, 249]
        }
      },
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    currentY = (doc as any).lastAutoTable.finalY + 6

    // Deductions Table (If present)
    const deductionsData = rawDeductions.map((item, idx) => [
      String(idx + 1),
      item.description || 'Deduction Particular',
      formatCurrency(item.amount),
    ])

    const totalDeductions = rawDeductions.reduce((acc, curr) => acc + Number(curr.amount || 0), 0)

    if (rawDeductions.length > 0) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(153, 27, 27) // Burgundy-800 (#991b1b)
      doc.text('2. DEDUCTION BREAKDOWN (-)', A4_MARGINS.left, currentY)
      currentY += 2

      autoTable(doc, {
        startY: currentY,
        margin: { left: A4_MARGINS.left, right: A4_MARGINS.right },
        head: [['#', 'Deduction Reason / Item', 'Amount (LKR)']],
        body: [
          ...deductionsData,
          ['', 'TOTAL DEDUCTIONS (-)', formatCurrency(totalDeductions)],
        ],
        headStyles: {
          fillColor: [153, 27, 27], // Burgundy-800
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8.5,
        },
        columnStyles: {
          0: { cellWidth: 15, halign: 'center' },
          1: { cellWidth: 125, halign: 'left' },
          2: { cellWidth: 40, halign: 'right', fontStyle: 'bold' },
        },
        bodyStyles: {
          fontSize: 8,
          textColor: [30, 41, 59],
        },
        theme: 'grid',
        didParseCell: (data) => {
          if (data.row.index === deductionsData.length) {
            data.cell.styles.fontStyle = 'bold'
            data.cell.styles.fillColor = [254, 242, 242]
          }
        },
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      currentY = (doc as any).lastAutoTable.finalY + 6
    }

    // 6. Executive Net Balance Card
    const calcNetBalance = voucherData.net_balance !== undefined && voucherData.net_balance !== null
      ? voucherData.net_balance
      : totalAdditions - totalDeductions

    doc.setFillColor(15, 23, 42) // Slate-900 Navy
    doc.roundedRect(A4_MARGINS.left, currentY, 180, 14, 2, 2, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9.5)
    doc.setTextColor(255, 255, 255)
    doc.text('NET BALANCE PAYABLE / DISBURSED:', A4_MARGINS.left + 5, currentY + 9)

    doc.setFontSize(11)
    doc.setTextColor(250, 204, 21) // Executive Gold (#facc15)
    doc.text(`LKR ${formatCurrency(calcNetBalance)}`, A4_MARGINS.left + 175, currentY + 9, { align: 'right' })

    currentY += 18

    // 7. Remarks & Special Notice Callout
    if (voucherData.remark || voucherData.special_notice) {
      doc.setDrawColor(226, 232, 240)
      doc.setFillColor(248, 250, 252)

      let noteHeight = 10
      if (voucherData.remark && voucherData.special_notice) noteHeight = 16

      doc.roundedRect(A4_MARGINS.left, currentY, 180, noteHeight, 2, 2, 'FD')
      let noteY = currentY + 4.5

      if (voucherData.remark) {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(8)
        doc.setTextColor(100, 116, 139)
        doc.text('Remarks:', A4_MARGINS.left + 4, noteY)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(30, 41, 59)
        doc.text(voucherData.remark, A4_MARGINS.left + 22, noteY)
        noteY += 5.5
      }

      if (voucherData.special_notice) {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(8)
        doc.setTextColor(153, 27, 27)
        doc.text('Notice:', A4_MARGINS.left + 4, noteY)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(30, 41, 59)
        doc.text(voucherData.special_notice, A4_MARGINS.left + 22, noteY)
      }

      currentY += noteHeight + 6
    } else {
      currentY += 4
    }

    // 8. Executive Left-Aligned Signature & Authorization Section
    const sigY = Math.min(Math.max(currentY + 12, 220), 228)
    const lineX = A4_MARGINS.left
    const lineWidth = 55

    // Subtle horizontal line for physical/manual signature
    doc.setDrawColor(148, 163, 184) // Slate-400
    doc.setLineWidth(0.4)
    doc.line(lineX, sigY, lineX + lineWidth, sigY)

    let blockY = sigY + 4.5

    // Prepared By Block
    const prepUser = voucherData.prepared_by || 'Finance Officer'
    let prepName = prepUser
    let prepRole = 'Finance Officer'
    if (prepUser.includes('(')) {
      const parts = prepUser.split('(')
      prepName = parts[0].trim()
      prepRole = parts[1].replace(')', '').trim()
    }

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(30, 41, 59) // Slate-800
    doc.text(`Prepared By: ${prepName}`, lineX, blockY)

    blockY += 4
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(100, 116, 139) // Slate-500
    doc.text(prepRole, lineX, blockY)

    blockY += 6.5

    // Approved By Block (Directly Underneath with 5mm gap)
    const approvedUser = voucherData.approved_by || 'Managing Director'

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(30, 41, 59) // Slate-800
    doc.text(`Approved By: ${approvedUser}`, lineX, blockY)

    blockY += 3.8
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(100, 116, 139) // Slate-500
    doc.text('Authorized Signatory • Thennakoon Tours (Pvt) Ltd', lineX, blockY)

    return doc
  } catch (err) {
    console.error('[generateExpenseVoucherPDF Error]:', err)
    throw err
  }
}

