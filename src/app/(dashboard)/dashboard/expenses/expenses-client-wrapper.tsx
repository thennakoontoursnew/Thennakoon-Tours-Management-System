'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Printer, Loader2, Check, Pencil } from 'lucide-react'
import { NewExpenseModal } from '@/components/finance/new-expense-modal'
import {
  createExpenseAction,
  updateExpenseAction,
  approveExpenseVoucherAction,
  getCompanySettingsAction,
} from '../invoices/finance-actions'
import { generateExpenseVoucherPDF, ExpenseVoucherData } from '@/lib/documents/expense-voucher-pdf'

interface ExpensesClientWrapperProps {
  expenses: Record<string, unknown>[]
}

export function ExpensesClientWrapper({ expenses }: ExpensesClientWrapperProps) {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Record<string, unknown> | null>(null)
  const [generatingPdfId, setGeneratingPdfId] = useState<string | null>(null)
  const [approvingId, setApprovingId] = useState<string | null>(null)

  const handleApproveVoucher = async (expenseId: string) => {
    setApprovingId(expenseId)
    try {
      await approveExpenseVoucherAction(expenseId)
      router.refresh()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to approve voucher.'
      alert(msg)
    } finally {
      setApprovingId(null)
    }
  }

  const handleEditExpense = (expense: Record<string, unknown>) => {
    setEditingExpense(expense)
    setIsModalOpen(true)
  }

  const handlePrintVoucher = async (expense: Record<string, unknown>) => {
    const expenseId = String(expense.id || Math.random())
    setGeneratingPdfId(expenseId)
    try {
      const companySettings = await getCompanySettingsAction()

      const voucherData: ExpenseVoucherData = {
        id: String(expense.id || ''),
        expense_number: String(expense.expense_number || ''),
        voucher_number: expense.voucher_number ? String(expense.voucher_number) : String(expense.expense_number || ''),
        expense_date: String(expense.expense_date || ''),
        category: String(expense.category || ''),
        description: String(expense.description || ''),
        amount: Number(expense.amount || 0),
        payment_method: String(expense.payment_method || 'cash'),
        supplier_name: expense.supplier_name ? String(expense.supplier_name) : undefined,
        reference_number: expense.reference_number ? String(expense.reference_number) : undefined,
        bill_name: expense.bill_name ? String(expense.bill_name) : undefined,
        customer_name: expense.customer_name ? String(expense.customer_name) : undefined,
        account_number: expense.account_number ? String(expense.account_number) : undefined,
        bank_name: expense.bank_name ? String(expense.bank_name) : undefined,
        branch_name: expense.branch_name ? String(expense.branch_name) : undefined,
        add_payments_breakdown: Array.isArray(expense.add_payments_breakdown)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ? (expense.add_payments_breakdown as any[])
          : null,
        deduction_breakdown: Array.isArray(expense.deduction_breakdown)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ? (expense.deduction_breakdown as any[])
          : null,
        net_balance: expense.net_balance !== undefined && expense.net_balance !== null ? Number(expense.net_balance) : undefined,
        remark: expense.remark ? String(expense.remark) : undefined,
        special_notice: expense.special_notice ? String(expense.special_notice) : undefined,
        prepared_by: expense.prepared_by ? String(expense.prepared_by) : undefined,
        approved_by: expense.approved_by ? String(expense.approved_by) : undefined,
      }

      const pdfDoc = await generateExpenseVoucherPDF(voucherData, companySettings)
      const pdfBlob = pdfDoc.output('blob')
      const blobUrl = URL.createObjectURL(pdfBlob)
      window.open(blobUrl, '_blank')
    } catch (err) {
      console.error('Failed to generate expense voucher PDF:', err)
      alert('Failed to generate expense voucher PDF. Please try again.')
    } finally {
      setGeneratingPdfId(null)
    }
  }

  return (
    <>
      <div className="flex justify-end">
        <button
          onClick={() => {
            setEditingExpense(null)
            setIsModalOpen(true)
          }}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-500 hover:bg-rose-600 text-white transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
        >
          <Plus size={16} />
          <span>Record Expense</span>
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
        {expenses && expenses.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-850 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider">
                  <th className="py-3 px-4">Expense / Voucher No</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Description / Bill</th>
                  <th className="py-3 px-4">Payee / Supplier</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-slate-700 dark:text-slate-300">
                {expenses.map((e, idx) => {
                  const catStr = e.category ? String(e.category).replace('_', ' ') : 'General'
                  const methodStr = e.payment_method ? String(e.payment_method).replace('_', ' ') : 'Cash'
                  const amt = Number(e.amount || 0)
                  const itemKey = String(e.id || idx)
                  const isGenerating = generatingPdfId === itemKey
                  const isApproving = approvingId === itemKey
                  const displayNo = String(e.voucher_number || e.expense_number || 'EXP')

                  const isApproved = Boolean(
                    e.approved_by &&
                    String(e.approved_by).trim() !== '' &&
                    String(e.approved_by) !== 'Pending Approval'
                  )

                  return (
                    <tr key={itemKey} className="hover:bg-slate-50/80 dark:hover:bg-slate-850/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">{displayNo}</td>
                      <td className="py-3 px-4 font-mono">{e.expense_date ? String(e.expense_date).slice(0, 10) : 'N/A'}</td>
                      <td className="py-3 px-4 font-bold capitalize text-rose-500">{catStr}</td>
                      <td className="py-3 px-4 font-medium">{String(e.bill_name || e.description || '—')}</td>
                      <td className="py-3 px-4">{String(e.customer_name || e.supplier_name || 'N/A')}</td>
                      <td className="py-3 px-4 font-mono font-bold text-rose-500">LKR {amt.toLocaleString()}</td>
                      <td className="py-3 px-4 capitalize">{methodStr}</td>
                      <td className="py-3 px-4">
                        {isApproved ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-500 uppercase">
                            APPROVED
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-500 uppercase">
                            PENDING
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isApproved && (
                            <button
                              onClick={() => handleApproveVoucher(String(e.id))}
                              disabled={isApproving}
                              title="Approve Expense Voucher"
                              className="px-2 py-1.5 rounded-lg font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 transition-colors inline-flex items-center gap-1 cursor-pointer"
                            >
                              {isApproving ? (
                                <Loader2 size={13} className="animate-spin" />
                              ) : (
                                <Check size={13} />
                              )}
                              <span className="text-[11px]">Approve</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleEditExpense(e)}
                            title="Edit Expense / Voucher"
                            className="px-2 py-1.5 rounded-lg font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Pencil size={13} />
                            <span className="text-[11px]">Edit</span>
                          </button>

                          <Link
                            href={`/dashboard/expenses/${e.id}/preview`}
                            title="Print & Download Official Voucher PDF"
                            className="px-2.5 py-1.5 rounded-lg font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 transition-colors inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Printer size={13} />
                            <span className="text-[11px]">Voucher PDF</span>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-slate-400 italic">No operating expenses recorded yet.</div>
        )}
      </div>

      <NewExpenseModal
        isOpen={isModalOpen}
        initialData={editingExpense}
        onClose={() => {
          setIsModalOpen(false)
          setEditingExpense(null)
        }}
        onSubmit={async (expenseData) => {
          if (editingExpense && editingExpense.id) {
            await updateExpenseAction(String(editingExpense.id), expenseData)
          } else {
            await createExpenseAction(expenseData)
          }
          setEditingExpense(null)
          router.refresh()
        }}
      />
    </>
  )
}
