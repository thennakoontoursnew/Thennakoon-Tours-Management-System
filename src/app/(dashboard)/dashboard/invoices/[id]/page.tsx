import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Printer, DollarSign, CheckCircle2 } from 'lucide-react'
import { issueInvoice } from '../invoice-actions'
import { recordPayment } from '../../payments/payment-actions'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function InvoiceDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: invoice } = await supabase
    .from('invoices')
    .select('*, customer:customers(*), items:invoice_items(*)')
    .eq('id', id)
    .single()

  if (!invoice) {
    notFound()
  }

  const { data: payments } = await supabase
    .from('payments')
    .select('*, receipt:receipts(*)')
    .eq('invoice_id', id)
    .order('payment_date', { ascending: false })

  const handleIssue = async () => {
    'use server'
    await issueInvoice(id)
  }

  const handlePayment = async (formData: FormData) => {
    'use server'
    const amount = Number(formData.get('amount'))
    const method = formData.get('payment_method') as any
    const ref = formData.get('reference_number') as string

    await recordPayment({
      invoice_id: id,
      booking_id: invoice.booking_id,
      customer_id: invoice.customer_id,
      payment_date: new Date().toISOString(),
      amount,
      payment_method: method,
      reference_number: ref,
      status: 'completed',
    })
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/invoices"
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 dark:text-white">{invoice.invoice_number}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20">
                {invoice.status}
              </span>
            </div>
            <p className="text-xs text-slate-500">Issued on {invoice.invoice_date}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {invoice.status === 'draft' && (
            <form action={handleIssue}>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-500 flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <CheckCircle2 size={15} />
                <span>Issue Invoice</span>
              </button>
            </form>
          )}
          <Link
            href={`/dashboard/invoices/${invoice.id}/preview`}
            className="px-4 py-2 bg-amber-400 text-slate-950 rounded-xl text-xs font-bold hover:bg-amber-300 flex items-center gap-1.5 shadow-sm"
          >
            <Printer size={15} />
            <span>PDF Preview</span>
          </Link>
        </div>
      </div>

      {/* Customer & Invoice Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-amber-500 border-b border-slate-100 dark:border-slate-800 pb-2">
            Billed To
          </h2>
          <div className="space-y-2 text-xs">
            <div className="font-bold text-sm text-slate-900 dark:text-white">{invoice.customer?.full_name}</div>
            <div className="text-slate-500">Mobile: {invoice.customer?.mobile}</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-amber-500 border-b border-slate-100 dark:border-slate-800 pb-2">
            Balance Summary
          </h2>
          <div className="space-y-2 text-xs">
            <div><span className="font-bold text-slate-700 dark:text-slate-300">Grand Total:</span> <span className="font-mono font-bold text-slate-900 dark:text-white">LKR {Number(invoice.grand_total).toLocaleString()}</span></div>
            <div><span className="font-bold text-slate-700 dark:text-slate-300">Amount Paid:</span> <span className="font-mono text-emerald-500 font-bold">LKR {Number(invoice.amount_paid).toLocaleString()}</span></div>
            <div><span className="font-bold text-slate-700 dark:text-slate-300">Balance Due:</span> <span className="font-mono text-rose-500 font-bold text-sm">LKR {Number(invoice.balance_due).toLocaleString()}</span></div>
          </div>
        </div>
      </div>

      {/* Record Payment Form */}
      {Number(invoice.balance_due) > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 shadow-sm">
          <h2 className="text-xs font-bold uppercase tracking-wider text-amber-500 border-b border-slate-100 dark:border-slate-800 pb-2">
            Record New Payment
          </h2>
          <form action={handlePayment} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Amount (LKR) *</label>
              <input
                type="number"
                step="0.01"
                name="amount"
                required
                defaultValue={Number(invoice.balance_due)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Payment Method *</label>
              <select
                name="payment_method"
                required
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
              >
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="online">Online</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Reference / Slip No</label>
              <input
                type="text"
                name="reference_number"
                placeholder="TXN-12345"
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none font-mono"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-500 text-white font-bold text-xs rounded-lg hover:bg-emerald-600 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <DollarSign size={14} />
              <span>Record Payment</span>
            </button>
          </form>
        </div>
      )}

      {/* Payment History & Receipts */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-amber-500 border-b border-slate-100 dark:border-slate-800 pb-2">
          Payment History & Receipts
        </h2>
        {payments && payments.length > 0 ? (
          <div className="space-y-3">
            {payments.map((p) => (
              <div key={p.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">
                    LKR {Number(p.amount).toLocaleString()} via {p.payment_method?.toUpperCase()}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {new Date(p.payment_date).toLocaleString()} {p.reference_number ? `| Ref: ${p.reference_number}` : ''}
                  </div>
                </div>
                {p.receipt && p.receipt.length > 0 && (
                  <Link
                    href={`/dashboard/receipts/${p.receipt[0].id}/preview`}
                    className="px-2.5 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono font-bold rounded text-[11px] hover:underline"
                  >
                    Receipt: {p.receipt[0].receipt_number}
                  </Link>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-slate-400 py-4 text-center">No payment transactions recorded yet.</div>
        )}
      </div>
    </div>
  )
}
