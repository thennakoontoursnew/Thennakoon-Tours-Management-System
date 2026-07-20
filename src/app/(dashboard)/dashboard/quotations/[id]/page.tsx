import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Printer, Copy, CheckCircle, Clock, XCircle, ArrowRightLeft, Building2, User } from 'lucide-react'
import { changeQuotationStatus, convertQuotationToBooking, duplicateQuotation } from '../quotation-actions'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function QuotationDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: quotation } = await supabase
    .from('quotations')
    .select('*, customer:customers(*), items:quotation_items(*)')
    .eq('id', id)
    .single()

  if (!quotation) {
    notFound()
  }

  const handleStatusUpdate = async (status: string) => {
    'use server'
    await changeQuotationStatus(id, status)
  }

  const handleConversion = async () => {
    'use server'
    await convertQuotationToBooking(id)
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/quotations"
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 dark:text-white">{quotation.quotation_number}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20">
                {quotation.status}
              </span>
            </div>
            <p className="text-xs text-slate-500">Created on {new Date(quotation.created_at).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {quotation.status !== 'accepted' && (
            <Link
              href={`/dashboard/quotations/${quotation.id}/edit`}
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5"
            >
              <span>Edit Quote</span>
            </Link>
          )}

          <Link
            href={`/dashboard/quotations/${quotation.id}/preview`}
            className="px-3.5 py-2 rounded-xl bg-amber-400 text-slate-950 text-xs font-bold hover:bg-amber-300 transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Printer size={15} />
            <span>PDF Preview</span>
          </Link>

          {quotation.status === 'accepted' && (
            <form action={handleConversion}>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <ArrowRightLeft size={15} />
                <span>Convert to Booking</span>
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs font-bold text-slate-500">Change Status:</span>
        <div className="flex flex-wrap items-center gap-2">
          <form action={async () => { 'use server'; await changeQuotationStatus(id, 'sent') }}>
            <button className="px-3 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded text-xs font-semibold hover:bg-blue-500/20">Mark Sent</button>
          </form>
          <form action={async () => { 'use server'; await changeQuotationStatus(id, 'accepted') }}>
            <button className="px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded text-xs font-semibold hover:bg-emerald-500/20">Mark Accepted</button>
          </form>
          <form action={async () => { 'use server'; await changeQuotationStatus(id, 'rejected') }}>
            <button className="px-3 py-1 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded text-xs font-semibold hover:bg-rose-500/20">Mark Rejected</button>
          </form>
        </div>
      </div>

      {/* Customer & Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-amber-500 border-b border-slate-100 dark:border-slate-800 pb-2">
            Customer Profile
          </h2>
          <div className="space-y-2 text-xs">
            <div className="font-bold text-sm text-slate-900 dark:text-white">{quotation.customer?.full_name}</div>
            <div className="text-slate-500">Mobile: {quotation.customer?.mobile}</div>
            <div className="text-slate-500">Email: {quotation.customer?.email || 'N/A'}</div>
            <div className="text-slate-500">NIC/Passport: {quotation.customer?.nic || quotation.customer?.passport_number || 'N/A'}</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-amber-500 border-b border-slate-100 dark:border-slate-800 pb-2">
            Rental Schedule & Route
          </h2>
          <div className="space-y-2 text-xs">
            <div><span className="font-bold text-slate-700 dark:text-slate-300">Rental Dates:</span> {quotation.rental_start_date} to {quotation.rental_end_date}</div>
            <div><span className="font-bold text-slate-700 dark:text-slate-300">Pickup Location:</span> {quotation.pickup_location || 'N/A'}</div>
            <div><span className="font-bold text-slate-700 dark:text-slate-300">Destination:</span> {quotation.destination || 'N/A'}</div>
            <div><span className="font-bold text-slate-700 dark:text-slate-300">Passengers:</span> {quotation.passenger_count || 1}</div>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden p-6 space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-amber-500 border-b border-slate-100 dark:border-slate-800 pb-2">
          Quotation Vehicle Line Items
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-850 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider">
                <th className="py-2.5 px-3">Item Description</th>
                <th className="py-2.5 px-3">Days</th>
                <th className="py-2.5 px-3">Daily Rate</th>
                <th className="py-2.5 px-3">Driver Charge</th>
                <th className="py-2.5 px-3 text-right">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
              {(quotation.items || []).map((it: any) => (
                <tr key={it.id}>
                  <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">{it.description}</td>
                  <td className="py-3 px-3">{it.number_of_days}</td>
                  <td className="py-3 px-3 font-mono">LKR {Number(it.unit_rate).toLocaleString()}</td>
                  <td className="py-3 px-3 font-mono">LKR {Number(it.driver_charge).toLocaleString()}</td>
                  <td className="py-3 px-3 font-mono font-bold text-right text-slate-900 dark:text-white">LKR {Number(it.line_total).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pricing Summary */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <div className="w-64 space-y-2 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal:</span>
              <span className="font-mono font-bold">LKR {Number(quotation.subtotal).toLocaleString()}</span>
            </div>
            {Number(quotation.discount_amount) > 0 && (
              <div className="flex justify-between text-slate-500">
                <span>Discount:</span>
                <span className="font-mono text-emerald-500">- LKR {Number(quotation.discount_amount).toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-500">
              <span>Refundable Deposit:</span>
              <span className="font-mono font-bold">LKR {Number(quotation.refundable_deposit).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-base font-black text-amber-500 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span>Grand Total:</span>
              <span className="font-mono">LKR {Number(quotation.grand_total).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
