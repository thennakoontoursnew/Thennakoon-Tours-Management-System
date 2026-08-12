import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { WalletCards, Printer, Search, Send } from 'lucide-react'

import {
  toSafeNumber,
  toSafeDateString,
  getCustomerName,
  getCustomerMobile,
} from '@/lib/utils/relation-utils'

interface PageProps {
  searchParams: Promise<{ q?: string }>
}

export default async function ReceiptsPage({ searchParams }: PageProps) {
  const { q } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('receipts')
    .select('*, customer:customers(full_name, mobile, whatsapp)')
    .order('created_at', { ascending: false })

  if (q) {
    query = query.or(`receipt_number.ilike.%${q}%`)
  }

  const { data: receipts } = await query

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-400/10 text-amber-500 dark:text-amber-400">
            <WalletCards size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Payment Receipts</h1>
            <p className="text-xs text-slate-500 mt-0.5">Official proof-of-payment receipts generated for customer transactions.</p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800">
        <form method="GET" className="relative max-w-md">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <input
            type="text"
            name="q"
            defaultValue={q || ''}
            placeholder="Search receipt number..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </form>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
        {receipts && receipts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-850 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Receipt No</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Payment Method</th>
                  <th className="py-3.5 px-4">Amount Paid</th>
                  <th className="py-3.5 px-4">Receipt Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-slate-700 dark:text-slate-300">
                {receipts.map((item) => {
                  const custName = getCustomerName(item.customer)
                  const custMobile = getCustomerMobile(item.customer)
                  const waNumber = custMobile.replace(/[^0-9]/g, '')
                  const waText = encodeURIComponent(
                    `Dear ${custName},\nThank you for your payment of LKR ${toSafeNumber(item.amount).toLocaleString()} to Thennakoon Tours.\nReceipt No: ${item.receipt_number || 'RCPT'}`
                  )
                  const waUrl = `https://wa.me/${waNumber}?text=${waText}`
                  const methodStr = item.payment_method ? String(item.payment_method).replace('_', ' ').toUpperCase() : 'RECEIPT'

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-850/50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-amber-500">{item.receipt_number || 'RCPT'}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">{custName}</div>
                        {custMobile && <div className="text-[11px] text-slate-400 font-mono">{custMobile}</div>}
                      </td>
                      <td className="py-3.5 px-4 uppercase font-semibold text-slate-600 dark:text-slate-400">{methodStr}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-500">
                        LKR {toSafeNumber(item.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 font-mono">{toSafeDateString(item.receipt_date || item.created_at)}</td>
                      <td className="py-3.5 px-4 text-right space-x-1.5">
                        <Link
                          href={`/dashboard/receipts/${item.id}/preview`}
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
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center space-y-3">
            <WalletCards size={36} className="mx-auto text-slate-400" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No Receipts Generated</p>
            <p className="text-xs text-slate-400">Payment receipts will automatically appear here once payments are recorded.</p>
          </div>
        )}
      </div>
    </div>
  )
}
