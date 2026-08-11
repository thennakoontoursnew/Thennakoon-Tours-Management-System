'use client'

import { useState } from 'react'
import { DollarSign, Plus } from 'lucide-react'
import Link from 'next/link'

export function RecordPaymentButton() {
  return (
    <Link
      href="/dashboard/payments"
      className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 font-bold text-xs hover:bg-emerald-500/10 transition-all flex items-center gap-1.5"
    >
      <DollarSign size={14} />
      <span>+ Record Payment</span>
    </Link>
  )
}
