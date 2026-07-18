import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Search, FileText, CheckCircle2, Clock, XCircle, FileSpreadsheet, Eye, Printer, Copy } from 'lucide-react'

interface PageProps {
  searchParams: Promise<{ q?: string; status?: string }>
}

export default async function QuotationsPage({ searchParams }: PageProps) {
  const { q, status } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('quotations')
    .select('*, customer:customers(full_name, mobile, company_name)')
    .eq('is_archived', false)
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  if (q) {
    query = query.or(`quotation_number.ilike.%${q}%`)
  }

  const { data: quotations } = await query

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'accepted':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">Accepted</span>
      case 'sent':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">Sent</span>
      case 'rejected':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">Rejected</span>
      case 'expired':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">Expired</span>
      default:
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-500/10 text-slate-500 border border-slate-500/20">{st.toUpperCase()}</span>
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Quotations</h1>
          <p className="text-xs text-slate-500">Manage vehicle rental price quotes, PDFs, and customer conversions.</p>
        </div>
        <Link
          href="/dashboard/quotations/new"
          className="px-4 py-2.5 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs hover:bg-amber-300 transition-all flex items-center gap-2 w-fit shadow-sm"
        >
          <Plus size={16} />
          <span>New Quotation</span>
        </Link>
      </div>

      {/* Search & Filter Bar */}
      <form method="GET" className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            name="q"
            defaultValue={q || ''}
            placeholder="Search by quote number..."
            className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-amber-400"
          />
        </div>
        <select
          name="status"
          defaultValue={status || ''}
          className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
          <option value="expired">Expired</option>
        </select>
        <button
          type="submit"
          className="px-4 py-2.5 bg-slate-900 text-white dark:bg-slate-800 rounded-xl text-xs font-semibold hover:bg-slate-800"
        >
          Apply Filters
        </button>
      </form>

      {/* Quotations Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
        {quotations && quotations.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-850 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Quote No</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Rental Period</th>
                  <th className="py-3.5 px-4">Grand Total</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Created Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-slate-700 dark:text-slate-300">
                {quotations.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-850/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-amber-500">
                      <Link href={`/dashboard/quotations/${item.id}`} className="hover:underline">
                        {item.quotation_number}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">{item.customer?.full_name || 'N/A'}</div>
                      <div className="text-[11px] text-slate-400">{item.customer?.mobile}</div>
                    </td>
                    <td className="py-3.5 px-4 text-[11px]">
                      <div>{item.rental_start_date} to {item.rental_end_date}</div>
                      <div className="text-slate-400">{item.destination || 'Standard Route'}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      LKR {Number(item.grand_total).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4">{getStatusBadge(item.status)}</td>
                    <td className="py-3.5 px-4 text-slate-400">{new Date(item.created_at).toLocaleDateString()}</td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <Link
                        href={`/dashboard/quotations/${item.id}/preview`}
                        className="p-1.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 inline-flex items-center gap-1 font-semibold text-[11px]"
                      >
                        <Printer size={13} />
                        <span>PDF</span>
                      </Link>
                      <Link
                        href={`/dashboard/quotations/${item.id}`}
                        className="p-1.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 inline-flex items-center gap-1 font-semibold text-[11px]"
                      >
                        <Eye size={13} />
                        <span>View</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center space-y-3">
            <FileSpreadsheet size={36} className="mx-auto text-slate-400" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No Quotations Found</p>
            <p className="text-xs text-slate-400">Create your first price quotation for a customer.</p>
          </div>
        )}
      </div>
    </div>
  )
}
