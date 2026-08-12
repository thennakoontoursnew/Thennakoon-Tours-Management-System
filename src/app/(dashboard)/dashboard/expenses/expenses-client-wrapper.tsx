'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { NewExpenseModal } from '@/components/finance/new-expense-modal'
import { createExpenseAction } from '../invoices/finance-actions'

interface ExpensesClientWrapperProps {
  expenses: Record<string, unknown>[]
}

export function ExpensesClientWrapper({ expenses }: ExpensesClientWrapperProps) {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <div className="flex justify-end">
        <button
          onClick={() => setIsModalOpen(true)}
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
                  <th className="py-3 px-4">Expense No</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Supplier / Payee</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-slate-700 dark:text-slate-300">
                {expenses.map((e, idx) => {
                  const catStr = e.category ? String(e.category).replace('_', ' ') : 'General'
                  const methodStr = e.payment_method ? String(e.payment_method).replace('_', ' ') : 'Cash'
                  const amt = Number(e.amount || 0)
                  const itemKey = String(e.id || idx)

                  return (
                    <tr key={itemKey} className="hover:bg-slate-50/80 dark:hover:bg-slate-850/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">{String(e.expense_number || 'EXP')}</td>
                      <td className="py-3 px-4 font-mono">{e.expense_date ? String(e.expense_date).slice(0, 10) : 'N/A'}</td>
                      <td className="py-3 px-4 font-bold capitalize text-rose-500">{catStr}</td>
                      <td className="py-3 px-4 font-medium">{String(e.description || '—')}</td>
                      <td className="py-3 px-4">{String(e.supplier_name || 'N/A')}</td>
                      <td className="py-3 px-4 font-mono font-bold text-rose-500">LKR {amt.toLocaleString()}</td>
                      <td className="py-3 px-4 capitalize">{methodStr}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-500 uppercase">
                          {String(e.status || 'APPROVED')}
                        </span>
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
        onClose={() => setIsModalOpen(false)}
        onSubmit={async (expenseData) => {
          await createExpenseAction(expenseData)
          router.refresh()
        }}
      />
    </>
  )
}
