import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Search, Filter, DollarSign, Eye, Printer, FileText, ChevronRight } from 'lucide-react'
import { getFinanceSummaryKPIs } from '@/lib/finance/finance-service'

interface PageProps {
  searchParams: Promise<{ q?: string; status?: string }>
}

export default async function InvoicesPage({ searchParams }: PageProps) {
  const { q, status } = await searchParams
  const supabase = await createClient()

  // Fetch Finance Summary KPIs
  const kpis = await getFinanceSummaryKPIs(supabase, 'this_month')

  let query = supabase
    .from('invoices')
    .select('*, customer:customers(full_name, mobile, whatsapp)')
    .eq('is_archived', false)
    .order('created_at', { ascending: false })

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  if (q) {
    query = query.or(`invoice_number.ilike.%${q}%`)
  }

  const { data: invoices } = await query

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'paid':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">Paid</span>
      case 'partially_paid':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">Partial</span>
      case 'issued':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">Issued</span>
      case 'overdue':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">Overdue</span>
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/10 text-slate-500 border border-slate-500/20">{st.toUpperCase()}</span>
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Invoices & Accounts Receivable</h1>
          <p className="text-xs text-slate-500 mt-1">Billing ledger, partial payment recording, and balance collection tracking.</p>
        </div>
      </div>

      {/* Finance KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Invoiced</span>
          <span className="font-mono font-black text-slate-900 dark:text-white text-xl">LKR {kpis.totalInvoiced.toLocaleString()}</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-emerald-500 block">Total Collected</span>
          <span className="font-mono font-black text-emerald-500 text-xl">LKR {kpis.totalCollected.toLocaleString()}</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-amber-500 block">Outstanding Bal</span>
          <span className="font-mono font-black text-amber-500 text-xl">LKR {kpis.outstandingBalance.toLocaleString()}</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-rose-500 block">Overdue Balance</span>
          <span className="font-mono font-black text-rose-500 text-xl">LKR {kpis.overdueBalance.toLocaleString()}</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3">
        <form method="GET" className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input
              type="text"
              name="q"
              defaultValue={q || ''}
              placeholder="Search invoice number, customer..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <select
            name="status"
            defaultValue={status || 'all'}
            className="py-2 px-3 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
          >
            <option value="all">All Invoice Statuses</option>
            <option value="draft">Draft</option>
            <option value="issued">Issued</option>
            <option value="partially_paid">Partially Paid</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </form>
      </div>

      {/* Invoices Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
        {invoices && invoices.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-850 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Invoice No</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Grand Total</th>
                  <th className="py-3.5 px-4">Amount Paid</th>
                  <th className="py-3.5 px-4">Balance Due</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-slate-700 dark:text-slate-300">
                {invoices.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-850/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-amber-500">
                      <Link href={`/dashboard/invoices/${item.id}`} className="hover:underline">
                        {item.invoice_number}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">{item.customer?.full_name || 'N/A'}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{item.customer?.mobile}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      LKR {Number(item.grand_total).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-emerald-500">
                      LKR {Number(item.amount_paid).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-rose-500">
                      LKR {Number(item.balance_due).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4">{getStatusBadge(item.status)}</td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <Link
                        href={`/dashboard/invoices/${item.id}/preview`}
                        className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 inline-flex items-center gap-1 font-semibold text-[11px]"
                      >
                        <Printer size={13} />
                        <span>PDF</span>
                      </Link>
                      <Link
                        href={`/dashboard/invoices/${item.id}`}
                        className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 inline-flex items-center gap-1 font-semibold text-[11px]"
                      >
                        <Eye size={13} />
                        <span>Manage</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center space-y-3">
            <DollarSign size={36} className="mx-auto text-slate-400" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No Invoices Found</p>
            <p className="text-xs text-slate-400">Generate an invoice from a booking or quotation.</p>
          </div>
        )}
      </div>
    </div>
  )
}
