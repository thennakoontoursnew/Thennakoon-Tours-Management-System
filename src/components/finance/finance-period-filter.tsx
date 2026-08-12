'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Calendar } from 'lucide-react'

interface FinancePeriodFilterProps {
  initialPeriod?: string
}

export function FinancePeriodFilter({ initialPeriod = 'this_month' }: FinancePeriodFilterProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handlePeriodChange = (newPeriod: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (newPeriod) {
      params.set('period', newPeriod)
    } else {
      params.delete('period')
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-2">
      <Calendar size={14} className="text-slate-400" />
      <select
        value={searchParams.get('period') || initialPeriod}
        onChange={(e) => handlePeriodChange(e.target.value)}
        className="py-2 px-3 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 shadow-xs focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
      >
        <option value="today">Today</option>
        <option value="7d">Last 7 Days</option>
        <option value="30d">Last 30 Days</option>
        <option value="this_month">This Month</option>
        <option value="last_month">Last Month</option>
        <option value="ytd">Year to Date (YTD)</option>
        <option value="all">All Time</option>
      </select>
    </div>
  )
}
