'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'

interface PaymentFiltersProps {
  initialSearch?: string
  initialMethod?: string
}

export function PaymentFilters({ initialSearch = '', initialMethod = 'all' }: PaymentFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const updateFilters = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== 'all') {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const q = String(formData.get('q') || '').trim()
    updateFilters('q', q)
  }

  return (
    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <form onSubmit={handleSearchSubmit} className="relative sm:col-span-2">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <input
            type="text"
            name="q"
            defaultValue={searchParams.get('q') || initialSearch}
            placeholder="Search reference number, notes..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </form>

        <select
          value={searchParams.get('method') || initialMethod}
          onChange={(e) => updateFilters('method', e.target.value)}
          className="py-2 px-3 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none cursor-pointer"
        >
          <option value="all">All Payment Methods</option>
          <option value="cash">Cash</option>
          <option value="bank_transfer">Bank Transfer</option>
          <option value="card">Credit / Debit Card</option>
          <option value="online">Online Payment</option>
          <option value="cheque">Cheque</option>
        </select>
      </div>
    </div>
  )
}
