'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ReceiptText } from 'lucide-react'
import { NewExpenseModal } from './new-expense-modal'
import { createExpenseAction } from '@/app/(dashboard)/dashboard/invoices/finance-actions'

export function NewExpenseButton() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)

  const handleSubmit = async (expenseData: any) => {
    await createExpenseAction(expenseData)
    router.refresh()
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-rose-600 dark:text-rose-400 font-bold text-xs hover:bg-rose-500/10 transition-all flex items-center gap-1.5 cursor-pointer"
      >
        <ReceiptText size={14} />
        <span>+ New Expense</span>
      </button>

      <NewExpenseModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSubmit={handleSubmit}
      />
    </>
  )
}
