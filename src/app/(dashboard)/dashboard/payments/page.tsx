import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import {
  CreditCard,
  Search,
  WalletCards,
} from 'lucide-react'
import { RecordPaymentButton } from '@/components/finance/record-payment-button'

import {
  toSafeNumber,
  toSafeDateString,
  getCustomerName,
  getCustomerMobile,
  getInvoiceNumber,
  getReceiptId,
  getReceiptNumber,
} from '@/lib/utils/relation-utils'

interface PageProps {
  searchParams: Promise<{ q?: string; method?: string }>
}

export default async function PaymentsPage({ searchParams }: PageProps) {
  const { q, method } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('payments')
    .select('*, customer:customers(full_name, mobile), invoice:invoices(invoice_number), receipt:receipts(id, receipt_number)')
    .order('payment_date', { ascending: false })

  if (method && method !== 'all') {
    query = query.eq('payment_method', method)
  }

  if (q) {
    query = query.or(`reference_number.ilike.%${q}%,notes.ilike.%${q}%`)
  }

  const { data: paymentsList } = await query
  const payments = paymentsList || []

  // Summary Metrics
  const totalCount = payments.length
  let totalCompletedAmount = 0
  let cashTotal = 0
  let bankTotal = 0
  let cardOnlineTotal = 0

  payments.forEach((p) => {
    if (p.status === 'completed') {
      const amt = toSafeNumber(p.amount)
      totalCompletedAmount += amt
      if (p.payment_method === 'cash') cashTotal += amt
      else if (p.payment_method === 'bank_transfer') bankTotal += amt
      else if (['card', 'online'].includes(p.payment_method)) cardOnlineTotal += amt
    }
  })

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* HEADER & TOP ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
            <CreditCard size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Payments & Collections</h1>
            <p className="text-xs text-slate-500 mt-0.5">Record customer payments, track bank transfers, and verify transaction receipts.</p>
          </div>
        </div>

        <RecordPaymentButton />
      </div>

      {/* SUMMARY KPI CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Completed</span>
          <span className="font-mono font-black text-emerald-500 text-xl block mt-1">LKR {totalCompletedAmount.toLocaleString()}</span>
          <span className="text-[10px] text-slate-400 block mt-1">{totalCount} transaction records</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Cash Collections</span>
          <span className="font-mono font-black text-slate-900 dark:text-white text-xl block mt-1">LKR {cashTotal.toLocaleString()}</span>
          <span className="text-[10px] text-slate-400 block mt-1">Physical cash payments</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Bank Transfers</span>
          <span className="font-mono font-black text-slate-900 dark:text-white text-xl block mt-1">LKR {bankTotal.toLocaleString()}</span>
          <span className="text-[10px] text-slate-400 block mt-1">Direct deposit & wire</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Card / Online</span>
          <span className="font-mono font-black text-slate-900 dark:text-white text-xl block mt-1">LKR {cardOnlineTotal.toLocaleString()}</span>
          <span className="text-[10px] text-slate-400 block mt-1">POS card & web gateway</span>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800">
        <form method="GET" className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input
              type="text"
              name="q"
              defaultValue={q || ''}
              placeholder="Search reference number, notes..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <select
            name="method"
            defaultValue={method || 'all'}
            onChange={(e) => e.target.form?.submit()}
            className="py-2 px-3 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
          >
            <option value="all">All Payment Methods</option>
            <option value="cash">Cash</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="card">Credit / Debit Card</option>
            <option value="online">Online Payment</option>
            <option value="cheque">Cheque</option>
          </select>
        </form>
      </div>

      {/* PAYMENTS TABLE */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
        {payments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-850 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Payment Date</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Invoice Ref</th>
                  <th className="py-3.5 px-4">Method</th>
                  <th className="py-3.5 px-4">Reference #</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-slate-700 dark:text-slate-300">
                {payments.map((p) => {
                  const custName = getCustomerName(p.customer)
                  const custMobile = getCustomerMobile(p.customer)
                  const invNo = getInvoiceNumber(p.invoice)
                  const rcptId = getReceiptId(p.receipt)
                  const rcptNo = getReceiptNumber(p.receipt)
                  const methodStr = p.payment_method ? String(p.payment_method).replace('_', ' ').toUpperCase() : 'PAYMENT'

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-850/50 transition-colors">
                      <td className="py-3.5 px-4 font-mono">{toSafeDateString(p.payment_date)}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">{custName}</div>
                        {custMobile && <div className="text-[11px] text-slate-400 font-mono">{custMobile}</div>}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-amber-500">
                        {invNo && p.invoice_id ? (
                          <Link href={`/dashboard/invoices/${p.invoice_id}`} className="hover:underline">
                            {invNo}
                          </Link>
                        ) : (
                          'Direct Payment'
                        )}
                      </td>
                      <td className="py-3.5 px-4 uppercase font-bold text-[11px] text-slate-700 dark:text-slate-300">
                        {methodStr}
                      </td>
                      <td className="py-3.5 px-4 font-mono">{p.reference_number || '—'}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-500">
                        LKR {toSafeNumber(p.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 uppercase">
                          {p.status || 'COMPLETED'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {rcptId && rcptNo ? (
                          <Link
                            href={`/dashboard/receipts/${rcptId}/preview`}
                            className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 font-mono font-bold text-[11px] inline-flex items-center gap-1"
                          >
                            <WalletCards size={12} />
                            <span>{rcptNo}</span>
                          </Link>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">No receipt</span>
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
            <CreditCard size={36} className="mx-auto text-slate-400" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No Payments Found</p>
            <p className="text-xs text-slate-400">Record a payment for an invoice or booking.</p>
          </div>
        )}
      </div>
    </div>
  )
}
