'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { generateExpenseVoucherPDF, ExpenseVoucherData } from '@/lib/documents/expense-voucher-pdf'
import { getCompanySettingsAction } from '@/app/(dashboard)/dashboard/invoices/finance-actions'
import { ArrowLeft, Download, Loader2, AlertTriangle, FileCheck } from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function ExpenseVoucherPreviewPage({ params }: PageProps) {
  const { id } = use(params)
  const [expense, setExpense] = useState<any>(null)
  const [companySettings, setCompanySettings] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        if (!id || !uuidRegex.test(id)) {
          setErrorMsg('Invalid expense voucher ID format.')
          setLoading(false)
          return
        }

        const supabase = createClient()

        // Fetch Expense by ID
        const { data: exp, error: eErr } = await supabase
          .from('expenses')
          .select('*')
          .eq('id', id)
          .maybeSingle()

        if (eErr || !exp) {
          setErrorMsg('Expense voucher record not found.')
          setLoading(false)
          return
        }

        // Fetch Company Settings
        const settings = await getCompanySettingsAction()

        setExpense(exp)
        setCompanySettings(settings)

        // Prepare Voucher PDF Data
        const voucherData: ExpenseVoucherData = {
          id: String(exp.id || ''),
          expense_number: String(exp.expense_number || ''),
          voucher_number: exp.voucher_number ? String(exp.voucher_number) : String(exp.expense_number || ''),
          expense_date: String(exp.expense_date || ''),
          category: String(exp.category || ''),
          description: String(exp.description || ''),
          amount: Number(exp.amount || 0),
          payment_method: String(exp.payment_method || 'cash'),
          supplier_name: exp.supplier_name ? String(exp.supplier_name) : undefined,
          reference_number: exp.reference_number ? String(exp.reference_number) : undefined,
          bill_name: exp.bill_name ? String(exp.bill_name) : undefined,
          customer_name: exp.customer_name ? String(exp.customer_name) : undefined,
          account_number: exp.account_number ? String(exp.account_number) : undefined,
          bank_name: exp.bank_name ? String(exp.bank_name) : undefined,
          branch_name: exp.branch_name ? String(exp.branch_name) : undefined,
          add_payments_breakdown: Array.isArray(exp.add_payments_breakdown)
            ? (exp.add_payments_breakdown as any[])
            : null,
          deduction_breakdown: Array.isArray(exp.deduction_breakdown)
            ? (exp.deduction_breakdown as any[])
            : null,
          net_balance: exp.net_balance !== undefined && exp.net_balance !== null ? Number(exp.net_balance) : undefined,
          remark: exp.remark ? String(exp.remark) : undefined,
          special_notice: exp.special_notice ? String(exp.special_notice) : undefined,
          prepared_by: exp.prepared_by ? String(exp.prepared_by) : undefined,
          approved_by: exp.approved_by ? String(exp.approved_by) : undefined,
        }

        // Generate PDF
        const pdfDoc = await generateExpenseVoucherPDF(voucherData, settings)
        const pdfBlob = pdfDoc.output('blob')
        const blobUrl = URL.createObjectURL(pdfBlob)
        setPdfBlobUrl(blobUrl)
      } catch (err: any) {
        console.error('EXPENSE VOUCHER PREVIEW EXCEPTION', err)
        setErrorMsg(err.message || 'An unexpected error occurred while rendering expense voucher PDF.')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [id])

  const handleDownload = async () => {
    if (!expense || !pdfBlobUrl) return
    const cleanDocNum = expense.voucher_number || expense.expense_number || `EXPENSE-${expense.id.slice(0, 8)}`
    const filename = `${cleanDocNum}.pdf`
    
    const link = document.createElement('a')
    link.href = pdfBlobUrl
    link.download = filename
    link.click()
  }

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <Loader2 size={32} className="mx-auto text-amber-500 animate-spin" />
        <p className="text-xs font-bold text-slate-500">Loading Official Expense Voucher PDF...</p>
      </div>
    )
  }

  if (errorMsg || !expense) {
    return (
      <div className="max-w-md mx-auto my-16 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center space-y-4 shadow-xl">
        <AlertTriangle size={36} className="mx-auto text-rose-500" />
        <h2 className="text-base font-bold text-slate-900 dark:text-white">Expense Voucher Missing</h2>
        <p className="text-xs text-slate-500">{errorMsg || 'The requested expense voucher data is missing or invalid.'}</p>
        <Link
          href="/dashboard/expenses"
          className="inline-block px-4 py-2 bg-amber-400 text-slate-950 font-bold rounded-xl text-xs hover:bg-amber-300 transition-all shadow-xs"
        >
          Back to Expenses
        </Link>
      </div>
    )
  }

  const voucherNum = expense.voucher_number || expense.expense_number || 'VN-10001'
  const payeeName = expense.customer_name || expense.supplier_name || 'Valued Payee'

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/expenses"
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">
              Payment Voucher PDF ({voucherNum})
            </h1>
            <p className="text-xs text-slate-500">Official company letterhead preview.</p>
          </div>
        </div>
        <button
          onClick={handleDownload}
          className="px-4 py-2 bg-amber-400 text-slate-950 font-bold rounded-xl text-xs hover:bg-amber-300 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
        >
          <Download size={15} />
          <span>Download Voucher PDF</span>
        </button>
      </div>

      {/* Visible Data Summary Test Block */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-1">
        <div className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
          <FileCheck size={14} />
          <span>OFFICIAL PAYMENT VOUCHER PREVIEW</span>
        </div>
        <div className="text-slate-700 dark:text-slate-300 space-x-4">
          <span>Voucher No: <strong className="font-mono">{voucherNum}</strong></span>
          <span>Payee / Customer: <strong>{payeeName}</strong></span>
          <span>Net Amount: <strong className="font-mono text-amber-500 font-bold">LKR {Number(expense.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></span>
        </div>
      </div>

      {/* PDF Viewer Container */}
      <div className="bg-slate-800 p-2 rounded-2xl border border-slate-700 shadow-xl overflow-hidden min-h-[700px]">
        {pdfBlobUrl ? (
          <iframe src={pdfBlobUrl} className="w-full h-[750px] rounded-xl bg-white" title="Expense Voucher PDF Viewer" />
        ) : (
          <div className="p-12 text-center text-white text-xs">Failed to render PDF preview blob.</div>
        )}
      </div>
    </div>
  )
}
