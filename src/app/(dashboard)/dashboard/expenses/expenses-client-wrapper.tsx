'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { NewExpenseModal } from '@/components/finance/new-expense-modal'
import { createExpenseAction } from '../invoices/finance-actions'

interface ExpensesClientWrapperProps {
  expenses: any[]
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
                {expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-850/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">{e.expense_number}</td>
                    <td className="py-3 px-4 font-mono">{e.expense_date}</td>
                    <td className="py-3 px-4 font-bold capitalize text-rose-500">{e.category.replace('_', ' ')}</td>
                    <td className="py-3 px-4 font-medium">{e.description}</td>
                    <td className="py-3 px-4">{e.supplier_name || 'N/A'}</td>
                    <td className="py-3 px-4 font-mono font-bold text-rose-500">LKR {Number(e.amount).toLocaleString()}</td>
                    <td className="py-3 px-4 capitalize">{e.payment_method}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-500 uppercase">
                        {e.status}
                      </span>
                    </td>
                  </tr>
                ))}
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
