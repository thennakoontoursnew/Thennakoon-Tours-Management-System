import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Car, User, FileText, CheckCircle2, ArrowRight, ShieldCheck, DollarSign } from 'lucide-react'
import { updateBookingStatus, assignBookingVehicleDriver } from '../booking-actions'
import { createInvoiceFromBooking } from '../../invoices/invoice-actions'
import { createAgreementFromBooking } from '../../agreements/agreement-actions'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function BookingDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: booking } = await supabase
    .from('bookings')
    .select('*, customer:customers(*), vehicles:booking_vehicles(*, vehicle:vehicles(*), driver:drivers(*))')
    .eq('id', id)
    .single()

  if (!booking) {
    notFound()
  }

  const { data: drivers } = await supabase
    .from('drivers')
    .select('id, driver_code, full_name, mobile')
    .eq('is_archived', false)
    .order('full_name')

  const { data: linkedInvoices } = await supabase
    .from('invoices')
    .select('id, invoice_number, grand_total, balance_due, status')
    .eq('booking_id', id)

  const { data: linkedAgreements } = await supabase
    .from('rental_agreements')
    .select('id, agreement_number, status')
    .eq('booking_id', id)

  const handleGenerateInvoice = async () => {
    'use server'
    await createInvoiceFromBooking(id)
  }

  const handleGenerateAgreement = async () => {
    'use server'
    await createAgreementFromBooking(id)
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/bookings"
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 dark:text-white">{booking.booking_number}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20">
                {booking.status}
              </span>
            </div>
            <p className="text-xs text-slate-500">Booked on {booking.booking_date}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <form action={handleGenerateInvoice}>
            <button
              type="submit"
              className="px-3.5 py-2 bg-slate-900 text-white dark:bg-slate-800 rounded-xl text-xs font-bold hover:bg-slate-800 flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <DollarSign size={15} />
              <span>Generate Invoice</span>
            </button>
          </form>

          <form action={handleGenerateAgreement}>
            <button
              type="submit"
              className="px-3.5 py-2 bg-amber-400 text-slate-950 rounded-xl text-xs font-bold hover:bg-amber-300 flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <FileText size={15} />
              <span>Generate Agreement</span>
            </button>
          </form>
        </div>
      </div>

      {/* Linked Documents Bar */}
      {((linkedInvoices?.length || 0) > 0 || (linkedAgreements?.length || 0) > 0) && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex flex-wrap items-center gap-4 text-xs">
          <span className="font-bold text-amber-700 dark:text-amber-400">Linked Documents:</span>
          {linkedInvoices?.map((inv: any) => (
            <Link
              key={inv.id}
              href={`/dashboard/invoices/${inv.id}`}
              className="px-2.5 py-1 bg-white dark:bg-slate-800 rounded-lg border border-amber-500/30 text-amber-600 dark:text-amber-300 font-mono font-bold hover:underline"
            >
              Invoice: {inv.invoice_number} ({inv.status})
            </Link>
          ))}
          {linkedAgreements?.map((agr: any) => (
            <Link
              key={agr.id}
              href={`/dashboard/agreements/${agr.id}/preview`}
              className="px-2.5 py-1 bg-white dark:bg-slate-800 rounded-lg border border-amber-500/30 text-amber-600 dark:text-amber-300 font-mono font-bold hover:underline"
            >
              Agreement: {agr.agreement_number}
            </Link>
          ))}
        </div>
      )}

      {/* Customer & Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-amber-500 border-b border-slate-100 dark:border-slate-800 pb-2">
            Customer Information
          </h2>
          <div className="space-y-2 text-xs">
            <div className="font-bold text-sm text-slate-900 dark:text-white">{booking.customer?.full_name}</div>
            <div className="text-slate-500">Mobile: {booking.customer?.mobile}</div>
            <div className="text-slate-500">NIC/Passport: {booking.customer?.nic || booking.customer?.passport_number || 'N/A'}</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-amber-500 border-b border-slate-100 dark:border-slate-800 pb-2">
            Rental Schedule & Payment Summary
          </h2>
          <div className="space-y-2 text-xs">
            <div><span className="font-bold text-slate-700 dark:text-slate-300">Schedule:</span> {new Date(booking.rental_start_at).toLocaleString()} to {new Date(booking.rental_end_at).toLocaleString()}</div>
            <div><span className="font-bold text-slate-700 dark:text-slate-300">Grand Total:</span> <span className="font-mono font-bold text-amber-500">LKR {Number(booking.grand_total).toLocaleString()}</span></div>
            <div><span className="font-bold text-slate-700 dark:text-slate-300">Advance Paid:</span> <span className="font-mono text-emerald-500">LKR {Number(booking.advance_paid).toLocaleString()}</span></div>
            <div><span className="font-bold text-slate-700 dark:text-slate-300">Balance Due:</span> <span className="font-mono text-rose-500 font-bold">LKR {Number(booking.balance_due).toLocaleString()}</span></div>
          </div>
        </div>
      </div>

      {/* Assigned Vehicles & Drivers */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-amber-500 border-b border-slate-100 dark:border-slate-800 pb-2">
          Assigned Fleet & Driver Allocation
        </h2>
        <div className="space-y-4">
          {(booking.vehicles || []).map((bv: any) => (
            <div key={bv.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Car size={16} className="text-amber-500" />
                  <span>{bv.vehicle?.vehicle_name} ({bv.vehicle?.registration_number})</span>
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Rate: LKR {Number(bv.vehicle_rate).toLocaleString()} | Deposit: LKR {Number(bv.deposit_amount).toLocaleString()}
                </div>
              </div>

              {/* Driver Selection */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                  <User size={14} />
                  <span>Driver:</span>
                </span>
                <form action={async (formData: FormData) => {
                  'use server'
                  const drvId = formData.get('driver_id') as string
                  await assignBookingVehicleDriver(bv.id, id, drvId || null)
                }}>
                  <select
                    name="driver_id"
                    defaultValue={bv.driver_id || ''}
                    onChange={(e) => e.target.form?.requestSubmit()}
                    className="p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
                  >
                    <option value="">-- No Driver Assigned --</option>
                    {drivers?.map((d: any) => (
                      <option key={d.id} value={d.id}>
                        {d.full_name} ({d.mobile})
                      </option>
                    ))}
                  </select>
                </form>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
