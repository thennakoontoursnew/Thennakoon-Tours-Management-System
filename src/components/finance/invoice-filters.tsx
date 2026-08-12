'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'

interface InvoiceFiltersProps {
  initialSearch?: string
  initialStatus?: string
}

export function InvoiceFilters({ initialSearch = '', initialStatus = 'all' }: InvoiceFiltersProps) {
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
    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <form onSubmit={handleSearchSubmit} className="relative sm:col-span-2">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <input
            type="text"
            name="q"
            defaultValue={searchParams.get('q') || initialSearch}
            placeholder="Search invoice number, customer name, mobile..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </form>

        <select
          value={searchParams.get('status') || initialStatus}
          onChange={(e) => updateFilters('status', e.target.value)}
          className="py-2 px-3 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none cursor-pointer"
        >
          <option value="all">All Invoice Statuses</option>
          <option value="draft">Draft</option>
          <option value="issued">Issued</option>
          <option value="partially_paid">Partially Paid</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
          <option value="cancelled">Cancelled / Void</option>
        </select>
      </div>
    </div>
  )
}
