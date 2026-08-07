import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Filter, Search, Plus, DollarSign } from 'lucide-react'
import { getFinanceSummaryKPIs } from '@/lib/finance/finance-service'
import { ExpensesClientWrapper } from './expenses-client-wrapper'

export const metadata = {
  title: 'Operating Expenses — Thennakoon Tours Management System',
}

interface PageProps {
  searchParams: Promise<{
    search?: string
    category?: string
  }>
}

export default async function ExpensesPage({ searchParams }: PageProps) {
  const params = await searchParams
  const search = params.search || ''
  const categoryFilter = params.category || 'all'

  const supabase = await createClient()

  // Fetch Finance Summary KPIs
  const kpis = await getFinanceSummaryKPIs(supabase, 'this_month')

  // Build query
  let query = supabase.from('expenses').select('*').order('expense_date', { ascending: false })

  if (search) {
    query = query.or(`description.ilike.%${search}%,expense_number.ilike.%${search}%,supplier_name.ilike.%${search}%`)
  }

  if (categoryFilter !== 'all') query = query.eq('category', categoryFilter)

  const { data: expenses } = await query

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Operating Expense Management</h1>
          <p className="text-slate-500 text-xs mt-1">Operational expense logging, vehicle cost attribution, and cash outflow ledger.</p>
        </div>
      </div>

      {/* Expense KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-rose-500 block">Total Expenses (Month)</span>
          <span className="font-mono font-black text-rose-500 text-xl">LKR {kpis.totalExpenses.toLocaleString()}</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-emerald-500 block">Total Revenue Collected</span>
          <span className="font-mono font-black text-emerald-500 text-xl">LKR {kpis.totalCollected.toLocaleString()}</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-purple-500 block">Net Cash Flow</span>
          <span className="font-mono font-black text-purple-500 text-xl">LKR {kpis.netCashFlow.toLocaleString()}</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3">
        <form method="GET" className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input
              type="text"
              name="search"
              defaultValue={search}
              placeholder="Search expense number, description, supplier..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <select
            name="category"
            defaultValue={categoryFilter}
            className="py-2 px-3 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
          >
            <option value="all">All Expense Categories</option>
            <option value="fuel">Fuel</option>
            <option value="maintenance">Maintenance</option>
            <option value="repair">Repair</option>
            <option value="driver_allowance">Driver Allowance</option>
            <option value="accommodation">Accommodation</option>
            <option value="toll_parking">Toll & Parking</option>
            <option value="office">Office & Admin</option>
            <option value="marketing">Marketing</option>
            <option value="utilities">Utilities</option>
            <option value="insurance">Insurance</option>
          </select>
        </form>
      </div>

      {/* Expenses Table Client Wrapper */}
      <ExpensesClientWrapper expenses={expenses || []} />
    </div>
  )
}
