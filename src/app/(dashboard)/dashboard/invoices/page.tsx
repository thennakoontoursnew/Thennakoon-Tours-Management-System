import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import {
  FileSpreadsheet,
  Plus,
  Eye,
  Printer,
  Send,
} from 'lucide-react'
import { getFinanceSummaryKPIs } from '@/lib/finance/finance-service'
import { InvoiceFilters } from '@/components/finance/invoice-filters'

import {
  toSafeNumber,
  toSafeDateString,
  getCustomerName,
  getCustomerMobile,
} from '@/lib/utils/relation-utils'

interface PageProps {
  searchParams: Promise<{ q?: string; status?: string }>
}

export default async function InvoicesPage({ searchParams }: PageProps) {
  const { q, status } = await searchParams
  const supabase = await createClient()

  // Fetch Finance Summary KPIs
  const kpis = await getFinanceSummaryKPIs(supabase, 'all')

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
      case 'void':
      case 'cancelled':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/10 text-slate-500 border border-slate-500/20">{st.toUpperCase()}</span>
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/10 text-slate-500 border border-slate-500/20">{(st || 'UNKNOWN').toUpperCase()}</span>
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-400/10 text-amber-500 dark:text-amber-400">
            <FileSpreadsheet size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Invoices & Accounts Receivable</h1>
            <p className="text-xs text-slate-500 mt-0.5">Billing ledger, partial payment recording, and balance collection tracking.</p>
          </div>
        </div>

        <Link
          href="/dashboard/invoices/new"
          className="px-4 py-2 bg-amber-400 text-slate-950 font-bold rounded-xl text-xs hover:bg-amber-300 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
        >
          <Plus size={15} />
          <span>+ Create New Invoice</span>
        </Link>
      </div>

      {/* KPI Summary Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Invoiced</span>
          <span className="font-mono font-black text-slate-900 dark:text-white text-xl block mt-1">LKR {toSafeNumber(kpis.totalInvoiced).toLocaleString()}</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-emerald-500 block">Total Collected</span>
          <span className="font-mono font-black text-emerald-500 text-xl block mt-1">LKR {toSafeNumber(kpis.totalCollected).toLocaleString()}</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-amber-500 block">Outstanding Balance</span>
          <span className="font-mono font-black text-amber-500 text-xl block mt-1">LKR {toSafeNumber(kpis.outstandingBalance).toLocaleString()}</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-rose-500 block">Overdue Balance</span>
          <span className="font-mono font-black text-rose-500 text-xl block mt-1">LKR {toSafeNumber(kpis.overdueBalance).toLocaleString()}</span>
        </div>
      </div>

      {/* Filter Bar Client Component */}
      <InvoiceFilters initialSearch={q} initialStatus={status} />

      {/* Invoices Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
        {invoices && invoices.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-850 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Invoice No</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Invoice Date</th>
                  <th className="py-3.5 px-4">Grand Total</th>
                  <th className="py-3.5 px-4">Amount Paid</th>
                  <th className="py-3.5 px-4">Balance Due</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-slate-700 dark:text-slate-300">
                {invoices.map((item) => {
                  const custName = getCustomerName(item.customer)
                  const custMobile = getCustomerMobile(item.customer)
                  const waNumber = custMobile.replace(/[^0-9]/g, '')
                  const waText = encodeURIComponent(
                    `Dear ${custName},\nHere is your invoice ${item.invoice_number} from Thennakoon Tours.\nTotal: LKR ${toSafeNumber(item.grand_total).toLocaleString()}\nBalance Due: LKR ${toSafeNumber(item.balance_due).toLocaleString()}\nThank you!`
                  )
                  const waUrl = `https://wa.me/${waNumber}?text=${waText}`

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-850/50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-amber-500">
                        <Link href={`/dashboard/invoices/${item.id}`} className="hover:underline">
                          {item.invoice_number || 'INV'}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">{custName}</div>
                        {custMobile && <div className="text-[11px] text-slate-400 font-mono">{custMobile}</div>}
                      </td>
                      <td className="py-3.5 px-4 font-mono">{toSafeDateString(item.invoice_date)}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                        LKR {toSafeNumber(item.grand_total).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-emerald-500 font-bold">
                        LKR {toSafeNumber(item.amount_paid).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-rose-500">
                        LKR {toSafeNumber(item.balance_due).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4">{getStatusBadge(item.status)}</td>
                      <td className="py-3.5 px-4 text-right space-x-1.5">
                        <Link
                          href={`/dashboard/invoices/${item.id}/preview`}
                          className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 inline-flex items-center gap-1 font-semibold text-[11px]"
                        >
                          <Printer size={13} />
                          <span>PDF</span>
                        </Link>
                        {waNumber && (
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 inline-flex items-center gap-1 font-semibold text-[11px]"
                          >
                            <Send size={13} />
                            <span>WA</span>
                          </a>
                        )}
                        <Link
                          href={`/dashboard/invoices/${item.id}`}
                          className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 inline-flex items-center gap-1 font-semibold text-[11px]"
                        >
                          <Eye size={13} />
                          <span>Manage</span>
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center space-y-3">
            <FileSpreadsheet size={36} className="mx-auto text-slate-400" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No Invoices Found</p>
            <p className="text-xs text-slate-400">Generate an invoice from a booking or quotation.</p>
          </div>
        )}
      </div>
    </div>
  )
}
