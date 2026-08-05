import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Car,
  User,
  FileText,
  DollarSign,
  Calendar,
  FileCheck,
  Receipt,
  History,
} from 'lucide-react'
import { updateBookingStatus } from '../booking-actions'
import { createInvoiceFromBooking } from '../../invoices/invoice-actions'
import { calculateRentalDays } from '@/lib/utils/formatters'
import VehicleDriverAssignmentRow from './vehicle-driver-assignment-row'
import GenerateAgreementButton from './generate-agreement-button'

interface PageProps {
  params: Promise<{ id: string }>
}

function formatDateSafe(val: any): string {
  if (!val) return 'N/A'
  try {
    const d = new Date(val)
    return isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString()
  } catch {
    return 'N/A'
  }
}

function formatDateTimeSafe(val: any): string {
  if (!val) return 'N/A'
  try {
    const d = new Date(val)
    return isNaN(d.getTime()) ? 'N/A' : d.toLocaleString()
  } catch {
    return 'N/A'
  }
}

function formatNumberSafe(val: any, decimals: number = 2): string {
  const num = Number(val ?? 0)
  if (isNaN(num)) return '0.00'
  return num.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

// Module-level Server Action Handlers returning Promise<void>
async function handleUpdateStatusAction(bookingId: string) {
  'use server'
  await updateBookingStatus(bookingId, 'confirmed')
}

async function handleCreateInvoiceAction(bookingId: string) {
  'use server'
  await createInvoiceFromBooking(bookingId)
}

export default async function BookingDetailPage({ params }: PageProps) {
  const { id } = await params
  console.log('BOOKING ROUTE ID:', id)

  // Validate UUID parameter format strictly
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (!id || typeof id !== 'string' || !uuidRegex.test(id)) {
    console.warn('BOOKING LOAD INVALID UUID:', id)
    notFound()
  }

  const supabase = await createClient()

  // STEP 1: Base Booking Query
  let booking: any = null
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) {
      console.error('BOOKING DETAIL STEP 1 FAILED', error.code, error.message)
      throw new Error(`Booking base query failed: ${error.code} ${error.message}`)
    }
    booking = data
    console.log('BOOKING DETAIL STEP 1 PASSED')
  } catch (err: any) {
    console.error('BOOKING DETAIL STEP 1 FAILED', err?.code || 'EXCEPTION', err?.message || String(err))
    throw err
  }

  if (!booking) {
    console.log('BOOKING DETAIL STEP 1 - RECORD NOT FOUND')
    notFound()
  }

  // STEP 2: Customer Query
  let customer: any = null
  if (booking.customer_id) {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', booking.customer_id)
        .maybeSingle()

      if (error) {
        console.error('BOOKING DETAIL STEP 2 FAILED', error.code, error.message)
      } else {
        customer = data
        console.log('BOOKING DETAIL STEP 2 PASSED')
      }
    } catch (err: any) {
      console.error('BOOKING DETAIL STEP 2 FAILED', err?.message)
    }
  } else {
    console.log('BOOKING DETAIL STEP 2 PASSED (No customer_id)')
  }

  // STEP 3: booking_vehicles Query
  let bookingVehicles: any[] = []
  try {
    const { data, error } = await supabase
      .from('booking_vehicles')
      .select('*')
      .eq('booking_id', id)

    if (error) {
      console.error('BOOKING DETAIL STEP 3 FAILED', error.code, error.message)
    } else {
      bookingVehicles = data || []
      console.log('BOOKING DETAIL STEP 3 PASSED')
    }
  } catch (err: any) {
    console.error('BOOKING DETAIL STEP 3 FAILED', err?.message)
  }

  // STEP 4: Vehicles Query
  let vehicleMap = new Map()
  try {
    const vehicleIds = bookingVehicles.map((bv: any) => bv.vehicle_id).filter(Boolean)
    if (vehicleIds.length > 0) {
      const { data, error } = await supabase.from('vehicles').select('*').in('id', vehicleIds)
      if (error) {
        console.error('BOOKING DETAIL STEP 4 FAILED', error.code, error.message)
      } else {
        vehicleMap = new Map((data || []).map((v: any) => [v.id, v]))
        console.log('BOOKING DETAIL STEP 4 PASSED')
      }
    } else {
      console.log('BOOKING DETAIL STEP 4 PASSED (No vehicle_ids)')
    }
  } catch (err: any) {
    console.error('BOOKING DETAIL STEP 4 FAILED', err?.message)
  }

  // STEP 5: Drivers Query
  let driverMap = new Map()
  let driversList: any[] = []
  try {
    const assignedDriverIds = bookingVehicles.map((bv: any) => bv.driver_id).filter(Boolean)
    if (assignedDriverIds.length > 0) {
      const { data: dData } = await supabase.from('drivers').select('*').in('id', assignedDriverIds)
      driverMap = new Map((dData || []).map((d: any) => [d.id, d]))
    }

    const { data: activeDrivers, error: drvErr } = await supabase
      .from('drivers')
      .select('id, driver_code, full_name, mobile, status, license_expiry, license_number')
      .eq('is_archived', false)
      .order('full_name')

    if (drvErr) {
      console.error('BOOKING DETAIL STEP 5 FAILED', drvErr.code, drvErr.message)
    } else {
      driversList = activeDrivers || []
      console.log('BOOKING DETAIL STEP 5 PASSED')
    }
  } catch (err: any) {
    console.error('BOOKING DETAIL STEP 5 FAILED', err?.message)
  }

  // STEP 6: Linked Quotation Query
  let linkedQuotation: any = null
  if (booking.quotation_id) {
    try {
      const { data, error } = await supabase
        .from('quotations')
        .select('id, quotation_number, status, grand_total')
        .eq('id', booking.quotation_id)
        .maybeSingle()

      if (error) {
        console.error('BOOKING DETAIL STEP 6 FAILED', error.code, error.message)
      } else {
        linkedQuotation = data
        console.log('BOOKING DETAIL STEP 6 PASSED')
      }
    } catch (err: any) {
      console.error('BOOKING DETAIL STEP 6 FAILED', err?.message)
    }
  } else {
    console.log('BOOKING DETAIL STEP 6 PASSED (No quotation_id)')
  }

  // STEP 7: Invoices Query
  let linkedInvoices: any[] = []
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select('id, invoice_number, grand_total, balance_due, status')
      .eq('booking_id', id)

    if (error) {
      console.error('BOOKING DETAIL STEP 7 FAILED', error.code, error.message)
    } else {
      linkedInvoices = data || []
      console.log('BOOKING DETAIL STEP 7 PASSED')
    }
  } catch (err: any) {
    console.error('BOOKING DETAIL STEP 7 FAILED', err?.message)
  }

  // STEP 8: Payments and Receipts Query
  let linkedPayments: any[] = []
  let linkedReceipts: any[] = []
  try {
    const { data: pData, error: pErr } = await supabase
      .from('payments')
      .select('id, payment_number, amount, payment_date, payment_method, status')
      .eq('booking_id', id)
    if (pErr) console.error('BOOKING DETAIL STEP 8 (Payments) FAILED', pErr.code, pErr.message)
    else linkedPayments = pData || []

    const { data: rData, error: rErr } = await supabase
      .from('receipts')
      .select('id, receipt_number, amount_paid, issued_at')
      .eq('booking_id', id)
    if (rErr) console.error('BOOKING DETAIL STEP 8 (Receipts) FAILED', rErr.code, rErr.message)
    else linkedReceipts = rData || []

    console.log('BOOKING DETAIL STEP 8 PASSED')
  } catch (err: any) {
    console.error('BOOKING DETAIL STEP 8 FAILED', err?.message)
  }

  // STEP 9: Rental Agreement Query
  let linkedAgreements: any[] = []
  try {
    const { data, error } = await supabase
      .from('rental_agreements')
      .select('id, agreement_number, status')
      .eq('booking_id', id)

    if (error) {
      console.error('BOOKING DETAIL STEP 9 FAILED', error.code, error.message)
    } else {
      linkedAgreements = data || []
      console.log('BOOKING DETAIL STEP 9 PASSED')
    }
  } catch (err: any) {
    console.error('BOOKING DETAIL STEP 9 FAILED', err?.message)
  }

  // STEP 10: Activity Logs Query
  let activityLogs: any[] = []
  try {
    const { data, error } = await supabase
      .from('document_activity_logs')
      .select('*')
      .eq('document_id', id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('BOOKING DETAIL STEP 10 FAILED', error.code, error.message)
    } else {
      activityLogs = data || []
      console.log('BOOKING DETAIL STEP 10 PASSED')
    }
  } catch (err: any) {
    console.error('BOOKING DETAIL STEP 10 FAILED', err?.message)
  }

  // Calculate rental days safely
  let rentalDays = 1
  try {
    rentalDays = calculateRentalDays(booking.rental_start_at, booking.rental_end_at)
  } catch {
    rentalDays = 1
  }

  const primaryAgreement = linkedAgreements && linkedAgreements.length > 0 ? linkedAgreements[0] : null

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/bookings"
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 dark:text-white">{String(booking.booking_number ?? 'N/A')}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20">
                {String(booking.status ?? 'Confirmed')}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Booked on {formatDateSafe(booking.booking_date)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Change Action */}
          <form action={handleUpdateStatusAction.bind(null, id)}>
            <button
              type="submit"
              className="px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-xs border border-slate-200 dark:border-slate-700 font-bold hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
            >
              Status: {String(booking.status ?? 'Confirmed').toUpperCase()}
            </button>
          </form>

          {/* Invoice Generation */}
          <form action={handleCreateInvoiceAction.bind(null, id)}>
            <button
              type="submit"
              className="px-3.5 py-2 bg-slate-900 text-white dark:bg-slate-800 rounded-xl text-xs font-bold hover:bg-slate-800 dark:hover:bg-slate-700 flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <DollarSign size={15} />
              <span>Generate Invoice</span>
            </button>
          </form>

          {/* Rental Agreement Action Button (Generate vs View Agreement) */}
          <GenerateAgreementButton bookingId={id} linkedAgreement={primaryAgreement} />
        </div>
      </div>

      {/* Linked Sales Documents Bar */}
      {(linkedQuotation || (linkedInvoices?.length || 0) > 0 || (linkedAgreements?.length || 0) > 0 || (linkedPayments?.length || 0) > 0) && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex flex-wrap items-center gap-3 text-xs">
          <span className="font-bold text-amber-800 dark:text-amber-300">Linked Records:</span>
          {linkedQuotation && (
            <Link
              href={`/dashboard/quotations/${linkedQuotation.id}`}
              className="px-2.5 py-1 bg-white dark:bg-slate-800 rounded-lg border border-amber-500/30 text-amber-700 dark:text-amber-300 font-mono font-bold hover:underline flex items-center gap-1"
            >
              <FileCheck size={13} />
              <span>Quotation: {String(linkedQuotation.quotation_number ?? 'N/A')}</span>
            </Link>
          )}
          {linkedInvoices?.map((inv: any) => (
            <Link
              key={String(inv.id)}
              href={`/dashboard/invoices/${inv.id}`}
              className="px-2.5 py-1 bg-white dark:bg-slate-800 rounded-lg border border-amber-500/30 text-amber-700 dark:text-amber-300 font-mono font-bold hover:underline flex items-center gap-1"
            >
              <DollarSign size={13} />
              <span>Invoice: {String(inv.invoice_number ?? 'N/A')} ({String(inv.status ?? 'draft')})</span>
            </Link>
          ))}
          {linkedAgreements?.map((agr: any) => (
            <Link
              key={String(agr.id)}
              href={`/dashboard/agreements/${agr.id}/preview`}
              className="px-2.5 py-1 bg-white dark:bg-slate-800 rounded-lg border border-amber-500/30 text-amber-700 dark:text-amber-300 font-mono font-bold hover:underline flex items-center gap-1"
            >
              <FileText size={13} />
              <span>Agreement: {String(agr.agreement_number ?? 'N/A')}</span>
            </Link>
          ))}
          {linkedPayments?.map((pmt: any) => (
            <span
              key={String(pmt.id)}
              className="px-2.5 py-1 bg-emerald-500/10 rounded-lg border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-mono font-bold flex items-center gap-1"
            >
              <Receipt size={13} />
              <span>Payment: {String(pmt.payment_number ?? 'N/A')} (LKR {formatNumberSafe(pmt.amount)})</span>
            </span>
          ))}
        </div>
      )}

      {/* Customer & Rental Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Customer Details */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 shadow-xs">
          <h2 className="text-xs font-bold uppercase tracking-wider text-amber-500 border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-1.5">
            <User size={15} />
            <span>Customer Information</span>
          </h2>
          {customer ? (
            <div className="space-y-2 text-xs">
              <div className="font-bold text-sm text-slate-900 dark:text-white">{String(customer.full_name ?? 'Unknown customer')}</div>
              {customer.customer_code && <div className="text-slate-500">Code: <span className="font-mono">{String(customer.customer_code)}</span></div>}
              <div className="text-slate-500">Mobile Phone: {String(customer.mobile ?? customer.phone ?? 'N/A')}</div>
              {customer.whatsapp && <div className="text-slate-500">WhatsApp: {String(customer.whatsapp)}</div>}
              <div className="text-slate-500">NIC / Passport: {String(customer.nic ?? customer.passport_number ?? 'N/A')}</div>
              <div className="text-slate-500">Address: {String(customer.address ?? customer.address_line_1 ?? 'Not provided')}</div>
            </div>
          ) : (
            <div className="text-xs text-slate-400 italic">No linked customer profile found for this booking.</div>
          )}
        </div>

        {/* Schedule & Financial Summary */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 shadow-xs">
          <h2 className="text-xs font-bold uppercase tracking-wider text-amber-500 border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-1.5">
            <Calendar size={15} />
            <span>Rental Schedule & Financial Overview</span>
          </h2>
          <div className="space-y-2 text-xs">
            <div>
              <span className="font-bold text-slate-700 dark:text-slate-300">Schedule:</span>{' '}
              {formatDateTimeSafe(booking.rental_start_at)} to {formatDateTimeSafe(booking.rental_end_at)}{' '}
              <span className="font-bold text-amber-500">({rentalDays} day(s))</span>
            </div>
            <div>
              <span className="font-bold text-slate-700 dark:text-slate-300">Pickup Location:</span> {String(booking.pickup_location ?? 'Not specified')}
            </div>
            <div>
              <span className="font-bold text-slate-700 dark:text-slate-300">Drop-off Location:</span> {String(booking.dropoff_location ?? 'Not specified')}
            </div>
            <div>
              <span className="font-bold text-slate-700 dark:text-slate-300">Destination:</span> {String(booking.destination ?? 'Standard Route')}
            </div>
            {booking.purpose && (
              <div>
                <span className="font-bold text-slate-700 dark:text-slate-300">Purpose:</span> {String(booking.purpose)}
              </div>
            )}
            {(booking.special_requests || booking.notes) && (
              <div>
                <span className="font-bold text-slate-700 dark:text-slate-300">Notes / Requests:</span> {String(booking.special_requests ?? booking.notes)}
              </div>
            )}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs">
              <div><span className="text-slate-500">Subtotal:</span> LKR {formatNumberSafe(booking.subtotal)}</div>
              <div><span className="text-slate-500">Deposit:</span> LKR {formatNumberSafe(booking.refundable_deposit)}</div>
              <div><span className="text-slate-500 font-bold">Grand Total:</span> <span className="font-mono font-bold text-amber-500">LKR {formatNumberSafe(booking.grand_total)}</span></div>
              <div><span className="text-slate-500 font-bold">Advance Paid:</span> <span className="font-mono text-emerald-500 font-bold">LKR {formatNumberSafe(booking.advance_paid)}</span></div>
              <div className="col-span-2"><span className="text-slate-500 font-bold">Balance Due:</span> <span className="font-mono text-rose-500 font-bold text-sm">LKR {formatNumberSafe(booking.balance_due)}</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Vehicle Allocation & Driver Assignments */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 shadow-xs">
        <h2 className="text-xs font-bold uppercase tracking-wider text-amber-500 border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-1.5">
          <Car size={15} />
          <span>Vehicle Allocation & Driver Assignment</span>
        </h2>
        {bookingVehicles.length > 0 ? (
          <div className="space-y-4">
            {bookingVehicles.map((bv: any) => {
              const veh = vehicleMap.get(bv.vehicle_id)
              const drv = driverMap.get(bv.driver_id)
              return (
                <VehicleDriverAssignmentRow
                  key={String(bv.id)}
                  bv={bv}
                  veh={veh}
                  drv={drv}
                  bookingId={id}
                  rentalStartAt={booking.rental_start_at}
                  rentalEndAt={booking.rental_end_at}
                  drivers={driversList}
                  formatNumberSafe={formatNumberSafe}
                />
              )
            })}
          </div>
        ) : (
          <div className="text-xs text-slate-400 italic py-2">No vehicle rows assigned to this booking.</div>
        )}
      </div>

      {/* Document Activity History */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 shadow-xs">
        <h2 className="text-xs font-bold uppercase tracking-wider text-amber-500 border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-1.5">
          <History size={15} />
          <span>Activity & Audit History</span>
        </h2>
        {activityLogs && activityLogs.length > 0 ? (
          <div className="space-y-3">
            {activityLogs.map((log: any) => (
              <div key={String(log.id)} className="text-xs border-b border-slate-100 dark:border-slate-850 pb-2 flex items-start justify-between">
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-200">{String(log.change_summary ?? log.action ?? 'Activity event')}</div>
                  <div className="text-[11px] text-slate-400">{String(log.action ?? 'EVENT')}</div>
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  {formatDateTimeSafe(log.created_at)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-slate-400 italic">
            Created on {formatDateTimeSafe(booking.created_at)}
          </div>
        )}
      </div>
    </div>
  )
}
