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
import { updateBookingStatus, assignBookingVehicleDriver } from '../booking-actions'
import { createInvoiceFromBooking } from '../../invoices/invoice-actions'
import { createAgreementFromBooking } from '../../agreements/agreement-actions'
import { calculateRentalDays } from '@/lib/utils/formatters'

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
  const num = Number(val)
  if (isNaN(num)) return '0.00'
  return num.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

// Module-level Server Action Handlers (OUTSIDE Component Body)
async function handleGenerateInvoiceAction(bookingId: string) {
  'use server'
  await createInvoiceFromBooking(bookingId)
}

async function handleGenerateAgreementAction(bookingId: string) {
  'use server'
  await createAgreementFromBooking(bookingId)
}

async function handleStatusChangeAction(bookingId: string, formData: FormData) {
  'use server'
  const newStatus = formData.get('status') as string
  if (newStatus) {
    await updateBookingStatus(bookingId, newStatus)
  }
}

async function handleAssignDriverAction(bookingVehicleId: string, bookingId: string, formData: FormData) {
  'use server'
  const drvId = formData.get('driver_id') as string
  await assignBookingVehicleDriver(bookingVehicleId, bookingId, drvId || null)
}

export default async function BookingDetailPage({ params }: PageProps) {
  const { id } = await params

  // 1. Validate UUID parameter format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (!id || typeof id !== 'string' || !uuidRegex.test(id)) {
    notFound()
  }

  const supabase = await createClient()

  // 2. STEP 1: Fetch Base Booking Record
  let booking: any = null
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) {
      console.error('Base booking fetch error:', error)
      throw new Error(`Booking query failed: ${error.message}`)
    }
    booking = data
  } catch (err) {
    console.error('Error fetching base booking:', err)
    throw err
  }

  if (!booking) {
    notFound()
  }

  // 3. STEP 2: Fetch Customer Record Safely
  let customer: any = null
  if (booking.customer_id) {
    try {
      const { data } = await supabase
        .from('customers')
        .select('*')
        .eq('id', booking.customer_id)
        .maybeSingle()
      customer = data
    } catch (err) {
      console.error('Customer fetch error:', err)
    }
  }

  // 4. STEP 3: Fetch Booking Vehicles & Fleet Details
  let bookingVehicles: any[] = []
  try {
    const { data } = await supabase
      .from('booking_vehicles')
      .select('*')
      .eq('booking_id', id)
    bookingVehicles = data || []
  } catch (err) {
    console.error('Booking vehicles fetch error:', err)
  }

  // 5. STEP 4: Fetch Fleet Vehicles & Driver Maps
  let vehicleMap = new Map()
  let driverMap = new Map()
  try {
    const vehicleIds = bookingVehicles.map((bv: any) => bv.vehicle_id).filter(Boolean)
    const assignedDriverIds = bookingVehicles.map((bv: any) => bv.driver_id).filter(Boolean)

    if (vehicleIds.length > 0) {
      const { data: vData } = await supabase.from('vehicles').select('*').in('id', vehicleIds)
      vehicleMap = new Map((vData || []).map((v: any) => [v.id, v]))
    }

    if (assignedDriverIds.length > 0) {
      const { data: dData } = await supabase.from('drivers').select('*').in('id', assignedDriverIds)
      driverMap = new Map((dData || []).map((d: any) => [d.id, d]))
    }
  } catch (err) {
    console.error('Fleet maps fetch error:', err)
  }

  // 6. STEP 5: Fetch Active Drivers for Assignment Dropdown
  let drivers: any[] = []
  try {
    const { data } = await supabase
      .from('drivers')
      .select('id, driver_code, full_name, mobile')
      .eq('is_archived', false)
      .order('full_name')
    drivers = data || []
  } catch (err) {
    console.error('Active drivers fetch error:', err)
  }

  // 7. STEP 6: Fetch Linked Quotation
  let linkedQuotation: any = null
  if (booking.quotation_id) {
    try {
      const { data } = await supabase
        .from('quotations')
        .select('id, quotation_number, status, grand_total')
        .eq('id', booking.quotation_id)
        .maybeSingle()
      linkedQuotation = data
    } catch (err) {
      console.error('Linked quotation fetch error:', err)
    }
  }

  // 8. STEP 7: Fetch Linked Invoices, Payments, Receipts & Agreements
  let linkedInvoices: any[] = []
  let linkedPayments: any[] = []
  let linkedReceipts: any[] = []
  let linkedAgreements: any[] = []
  try {
    const { data: invData } = await supabase
      .from('invoices')
      .select('id, invoice_number, grand_total, balance_due, status')
      .eq('booking_id', id)
    linkedInvoices = invData || []

    const { data: pmtData } = await supabase
      .from('payments')
      .select('id, payment_number, amount, payment_date, payment_method, status')
      .eq('booking_id', id)
    linkedPayments = pmtData || []

    const { data: rcptData } = await supabase
      .from('receipts')
      .select('id, receipt_number, amount_paid, issued_at')
      .eq('booking_id', id)
    linkedReceipts = rcptData || []

    const { data: agrData } = await supabase
      .from('rental_agreements')
      .select('id, agreement_number, status')
      .eq('booking_id', id)
    linkedAgreements = agrData || []
  } catch (err) {
    console.error('Linked financial documents fetch error:', err)
  }

  // 9. STEP 8: Fetch Document Activity Logs
  let activityLogs: any[] = []
  try {
    const { data } = await supabase
      .from('document_activity_logs')
      .select('*')
      .eq('document_id', id)
      .order('created_at', { ascending: false })
    activityLogs = data || []
  } catch (err) {
    console.error('Activity logs fetch error:', err)
  }

  // 10. Calculate Rental Days
  let rentalDays = 1
  try {
    rentalDays = calculateRentalDays(booking.rental_start_at, booking.rental_end_at)
  } catch (err) {
    console.error('calculateRentalDays error:', err)
  }

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
              <h1 className="text-2xl font-black text-slate-900 dark:text-white">{booking.booking_number || 'N/A'}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20">
                {booking.status || 'Confirmed'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Booked on {formatDateSafe(booking.booking_date)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Change Action */}
          <form action={handleStatusChangeAction.bind(null, id)} className="flex items-center gap-1">
            <select
              name="status"
              defaultValue={booking.status || 'confirmed'}
              onChange={(e) => e.target.form?.requestSubmit()}
              className="px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-xs border border-slate-200 dark:border-slate-700 font-bold focus:outline-none cursor-pointer"
            >
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="vehicle_assigned">Vehicle Assigned</option>
              <option value="driver_assigned">Driver Assigned</option>
              <option value="ready">Ready for Trip</option>
              <option value="on_trip">On Trip</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </form>

          {/* Invoice Generation */}
          <form action={handleGenerateInvoiceAction.bind(null, id)}>
            <button
              type="submit"
              className="px-3.5 py-2 bg-slate-900 text-white dark:bg-slate-800 rounded-xl text-xs font-bold hover:bg-slate-800 dark:hover:bg-slate-700 flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <DollarSign size={15} />
              <span>Generate Invoice</span>
            </button>
          </form>

          {/* Rental Agreement Generation */}
          <form action={handleGenerateAgreementAction.bind(null, id)}>
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
              <span>Quotation: {linkedQuotation.quotation_number}</span>
            </Link>
          )}
          {linkedInvoices?.map((inv: any) => (
            <Link
              key={inv.id}
              href={`/dashboard/invoices/${inv.id}`}
              className="px-2.5 py-1 bg-white dark:bg-slate-800 rounded-lg border border-amber-500/30 text-amber-700 dark:text-amber-300 font-mono font-bold hover:underline flex items-center gap-1"
            >
              <DollarSign size={13} />
              <span>Invoice: {inv.invoice_number} ({inv.status})</span>
            </Link>
          ))}
          {linkedAgreements?.map((agr: any) => (
            <Link
              key={agr.id}
              href={`/dashboard/agreements/${agr.id}/preview`}
              className="px-2.5 py-1 bg-white dark:bg-slate-800 rounded-lg border border-amber-500/30 text-amber-700 dark:text-amber-300 font-mono font-bold hover:underline flex items-center gap-1"
            >
              <FileText size={13} />
              <span>Agreement: {agr.agreement_number}</span>
            </Link>
          ))}
          {linkedPayments?.map((pmt: any) => (
            <span
              key={pmt.id}
              className="px-2.5 py-1 bg-emerald-500/10 rounded-lg border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-mono font-bold flex items-center gap-1"
            >
              <Receipt size={13} />
              <span>Payment: {pmt.payment_number} (LKR {formatNumberSafe(pmt.amount)})</span>
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
              <div className="font-bold text-sm text-slate-900 dark:text-white">{customer.full_name || 'N/A'}</div>
              {customer.customer_code && <div className="text-slate-500">Code: <span className="font-mono">{customer.customer_code}</span></div>}
              <div className="text-slate-500">Mobile Phone: {customer.mobile || customer.phone || 'N/A'}</div>
              {customer.whatsapp && <div className="text-slate-500">WhatsApp: {customer.whatsapp}</div>}
              <div className="text-slate-500">NIC / Passport: {customer.nic || customer.passport_number || 'N/A'}</div>
              <div className="text-slate-500">Address: {customer.address || customer.address_line_1 || 'Not provided'}</div>
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
              <span className="font-bold text-slate-700 dark:text-slate-300">Pickup Location:</span> {booking.pickup_location || 'Not specified'}
            </div>
            <div>
              <span className="font-bold text-slate-700 dark:text-slate-300">Drop-off Location:</span> {booking.dropoff_location || 'Not specified'}
            </div>
            <div>
              <span className="font-bold text-slate-700 dark:text-slate-300">Destination:</span> {booking.destination || 'Standard Route'}
            </div>
            {booking.purpose && (
              <div>
                <span className="font-bold text-slate-700 dark:text-slate-300">Purpose:</span> {booking.purpose}
              </div>
            )}
            {(booking.special_requests || booking.notes) && (
              <div>
                <span className="font-bold text-slate-700 dark:text-slate-300">Notes / Requests:</span> {booking.special_requests || booking.notes}
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
                <div key={bv.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <Car size={16} className="text-amber-500" />
                      <span>
                        {veh ? `${veh.vehicle_name} (${veh.registration_number})` : `Vehicle ID: ${bv.vehicle_id}`}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1 space-x-3">
                      <span>Rate: <strong className="font-mono">LKR {formatNumberSafe(bv.vehicle_rate)}</strong></span>
                      <span>Deposit: <strong className="font-mono">LKR {formatNumberSafe(bv.deposit_amount)}</strong></span>
                      {bv.allowed_km && <span>Allowed: <strong>{bv.allowed_km} KM/day</strong></span>}
                      {bv.extra_km_charge && <span>Extra KM: <strong>LKR {bv.extra_km_charge}/KM</strong></span>}
                    </div>
                  </div>

                  {/* Driver Assignment Select */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                      <User size={14} />
                      <span>Driver:</span>
                    </span>
                    <form action={handleAssignDriverAction.bind(null, bv.id, id)}>
                      <select
                        name="driver_id"
                        defaultValue={bv.driver_id || ''}
                        onChange={(e) => e.target.form?.requestSubmit()}
                        className="p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none cursor-pointer font-medium"
                      >
                        <option value="">-- No Driver Assigned --</option>
                        {drivers?.map((d: any) => (
                          <option key={d.id} value={d.id}>
                            {d.full_name} ({d.mobile || 'No Mobile'})
                          </option>
                        ))}
                      </select>
                    </form>
                  </div>
                </div>
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
              <div key={log.id} className="text-xs border-b border-slate-100 dark:border-slate-850 pb-2 flex items-start justify-between">
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-200">{log.change_summary || log.action}</div>
                  <div className="text-[11px] text-slate-400">{log.action}</div>
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
