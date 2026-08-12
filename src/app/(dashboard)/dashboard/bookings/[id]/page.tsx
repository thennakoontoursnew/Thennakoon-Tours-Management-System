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
  Clock,
  UserCheck,
  MapPin,
} from 'lucide-react'
import { calculateRentalDays } from '@/lib/utils/formatters'
import VehicleDriverAssignmentRow from './vehicle-driver-assignment-row'
import BookingHeaderActions from './booking-header-actions'
import ActivityTimeline from './activity-timeline'
import { BookingLifecycleProgress } from '@/components/bookings/booking-lifecycle-progress'
import { BookingStatusActions } from '@/components/bookings/booking-status-actions'
import { ExtraChargesSection } from '@/components/bookings/extra-charges-section'
import { BookingStatus } from '@/lib/bookings/booking-workflow'

interface PageProps {
  params: Promise<{ id: string }>
}

function formatDateSafe(val: any): string {
  if (!val) return 'N/A'
  try {
    const d = new Date(val)
    if (isNaN(d.getTime())) return 'N/A'
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return 'N/A'
  }
}

function formatDateTimeSafe(val: any): string {
  if (!val) return 'N/A'
  try {
    const d = new Date(val)
    if (isNaN(d.getTime())) return 'N/A'
    return d.toLocaleString('en-GB', {
      timeZone: 'Asia/Colombo',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  } catch {
    return 'N/A'
  }
}

function formatNumberSafe(val: any, decimals: number = 2): string {
  const num = Number(val ?? 0)
  if (isNaN(num)) return '0.00'
  return num.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

export default async function BookingDetailPage({ params }: PageProps) {
  const { id } = await params

  // Validate UUID parameter format strictly
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (!id || typeof id !== 'string' || !uuidRegex.test(id)) {
    notFound()
  }

  const supabase = await createClient()

  // STEP 0: Authenticated User & Profile Role
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let userRole = 'viewer'
  if (user?.id) {
    const { data: prof } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
    if (prof?.role) userRole = prof.role
  }

  // STEP 1: Base Booking Query
  const { data: booking } = await supabase.from('bookings').select('*').eq('id', id).maybeSingle()
  if (!booking) {
    notFound()
  }

  // Fetch Created By Profile Name
  let createdByName = 'System User'
  if (booking.created_by) {
    const { data: prof } = await supabase.from('profiles').select('full_name').eq('id', booking.created_by).maybeSingle()
    if (prof?.full_name) createdByName = prof.full_name
  }

  // STEP 2: Customer Query
  let customer: any = null
  if (booking.customer_id) {
    const { data } = await supabase.from('customers').select('*').eq('id', booking.customer_id).maybeSingle()
    customer = data
  }

  // STEP 3: booking_vehicles Query
  const { data: bvData } = await supabase.from('booking_vehicles').select('*').eq('booking_id', id)
  const bookingVehicles = bvData || []

  // STEP 4: Vehicles Query
  let vehicleMap = new Map()
  const vehicleIds = bookingVehicles.map((bv: any) => bv.vehicle_id).filter(Boolean)
  if (vehicleIds.length > 0) {
    const { data: vData } = await supabase.from('vehicles').select('*').in('id', vehicleIds)
    vehicleMap = new Map((vData || []).map((v: any) => [v.id, v]))
  }

  // STEP 5: Drivers Query
  let driverMap = new Map()
  let driversList: any[] = []
  const assignedDriverIds = bookingVehicles.map((bv: any) => bv.driver_id).filter(Boolean)
  if (assignedDriverIds.length > 0) {
    const { data: dData } = await supabase.from('drivers').select('*').in('id', assignedDriverIds)
    driverMap = new Map((dData || []).map((d: any) => [d.id, d]))
  }

  const { data: activeDrivers } = await supabase
    .from('drivers')
    .select('id, driver_code, full_name, mobile, status, license_expiry, license_number')
    .eq('is_archived', false)
    .order('full_name')
  driversList = activeDrivers || []

  // STEP 6: Linked Quotation Query
  let linkedQuotation: any = null
  if (booking.quotation_id) {
    const { data } = await supabase
      .from('quotations')
      .select('id, quotation_number, status, grand_total')
      .eq('id', booking.quotation_id)
      .maybeSingle()
    linkedQuotation = data
  }

  // STEP 7: Invoices Query
  const { data: invData } = await supabase.from('invoices').select('id, invoice_number, grand_total, balance_due, status').eq('booking_id', id)
  const linkedInvoices = invData || []

  // STEP 8: Payments and Receipts Query
  const { data: pData } = await supabase.from('payments').select('id, reference_number, amount, payment_date, payment_method, status').eq('booking_id', id)
  const linkedPayments = pData || []

  const { data: rData } = await supabase.from('receipts').select('id, receipt_number, amount, created_at').eq('booking_id', id)
  const linkedReceipts = rData || []

  // STEP 9: Rental Agreement Query
  const { data: agrData } = await supabase.from('rental_agreements').select('id, agreement_number, status, created_at').eq('booking_id', id)
  const activeAgreements = (agrData || []).filter((a: any) => a.status !== 'cancelled')

  // STEP 10: Activity Logs Query
  const { data: actData } = await supabase.from('document_activity_logs').select('*').eq('document_id', id).order('created_at', { ascending: false })
  const activityLogs = actData || []

  // STEP 11: Booking Charges Query
  const { data: chargeData } = await supabase.from('booking_charges').select('*').eq('booking_id', id).order('created_at', { ascending: true })
  const bookingCharges = chargeData || []

  // Calculate rental days safely
  let rentalDays = 1
  try {
    rentalDays = calculateRentalDays(booking.rental_start_at, booking.rental_end_at)
  } catch {
    rentalDays = 1
  }

  const primaryAgreement = activeAgreements.length > 0 ? activeAgreements[0] : null
  const primaryInvoice = linkedInvoices.length > 0 ? linkedInvoices[0] : null
  const totalBalanceDue = linkedInvoices.reduce((acc: number, inv: any) => acc + Number(inv.balance_due || 0), 0)

  // Build Plain Serializable DTOs for Client Components
  const serializableDrivers = driversList.map((d: any) => ({
    id: String(d.id),
    driver_code: String(d.driver_code ?? ''),
    full_name: String(d.full_name ?? ''),
    mobile: d.mobile ? String(d.mobile) : null,
    status: d.status ? String(d.status) : null,
    license_expiry: d.license_expiry ? String(d.license_expiry) : null,
    license_number: d.license_number ? String(d.license_number) : null,
  }))

  const serializableLogs = activityLogs.map((log: any) => ({
    id: String(log.id),
    action: log.action ? String(log.action) : null,
    change_summary: log.change_summary ? String(log.change_summary) : null,
    previous_status: log.previous_status ? String(log.previous_status) : null,
    new_status: log.new_status ? String(log.new_status) : null,
    created_at: String(log.created_at),
    user_name: createdByName,
  }))

  const firstVeh = bookingVehicles.length > 0 ? vehicleMap.get(bookingVehicles[0].vehicle_id) : null
  const firstVehName = firstVeh ? `${firstVeh.vehicle_name} (${firstVeh.registration_number})` : 'Vehicle'

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header Bar */}
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
            {/* Header Metadata Summary Line */}
            <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2 mt-1">
              <span>Date: <strong className="text-slate-700 dark:text-slate-300">{formatDateSafe(booking.booking_date)}</strong></span>
              <span>&bull;</span>
              <span>By: <strong className="text-slate-700 dark:text-slate-300">{createdByName}</strong></span>
              {customer?.full_name && (
                <>
                  <span>&bull;</span>
                  <span>Customer: <strong className="text-slate-700 dark:text-slate-300">{customer.full_name}</strong></span>
                </>
              )}
              {linkedQuotation && (
                <>
                  <span>&bull;</span>
                  <Link href={`/dashboard/quotations/${linkedQuotation.id}`} className="text-amber-500 hover:underline font-mono font-bold">
                    Quotation: {linkedQuotation.quotation_number}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Workflow Lifecycle Action Bar & PDF Generators */}
        <div className="flex items-center gap-3 flex-wrap">
          <BookingStatusActions
            bookingId={String(id)}
            currentStatus={booking.status as BookingStatus}
            userRole={userRole}
            userId={user?.id}
            balanceDue={totalBalanceDue}
            pickupOdometer={50000}
            allowedKmTotal={bookingVehicles[0]?.allowed_km || 500}
            extraKmRate={bookingVehicles[0]?.extra_km_charge || 100}
          />

          <BookingHeaderActions
            bookingId={String(id)}
            bookingNumber={String(booking.booking_number ?? '')}
            currentStatus={String(booking.status ?? 'confirmed')}
            customerName={customer?.full_name || 'Customer'}
            customerPhone={customer?.whatsapp || customer?.mobile || customer?.phone || ''}
            rentalStart={formatDateSafe(booking.rental_start_at)}
            rentalEnd={formatDateSafe(booking.rental_end_at)}
            vehicleName={firstVehName}
            grandTotal={Number(booking.grand_total || 0)}
            existingInvoiceId={primaryInvoice ? String(primaryInvoice.id) : null}
            existingInvoiceNumber={primaryInvoice ? String(primaryInvoice.invoice_number) : null}
            existingAgreementId={primaryAgreement ? String(primaryAgreement.id) : null}
            existingAgreementNumber={primaryAgreement ? String(primaryAgreement.agreement_number) : null}
          />
        </div>
      </div>

      {/* Booking Lifecycle Progress Component */}
      <BookingLifecycleProgress status={booking.status as BookingStatus} />

      {/* Linked Sales Documents Bar */}
      {(linkedQuotation || linkedInvoices.length > 0 || activeAgreements.length > 0 || linkedPayments.length > 0) && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex flex-wrap items-center gap-3 text-xs">
          <span className="font-bold text-amber-800 dark:text-amber-300">Linked Documents:</span>
          {linkedQuotation && (
            <Link
              href={`/dashboard/quotations/${linkedQuotation.id}`}
              className="px-2.5 py-1 bg-white dark:bg-slate-800 rounded-lg border border-amber-500/30 text-amber-700 dark:text-amber-300 font-mono font-bold hover:underline flex items-center gap-1"
            >
              <FileCheck size={13} />
              <span>Quotation: {String(linkedQuotation.quotation_number ?? 'N/A')}</span>
            </Link>
          )}
          {linkedInvoices.map((inv: any) => (
            <Link
              key={String(inv.id)}
              href={`/dashboard/invoices/${inv.id}`}
              className="px-2.5 py-1 bg-white dark:bg-slate-800 rounded-lg border border-amber-500/30 text-amber-700 dark:text-amber-300 font-mono font-bold hover:underline flex items-center gap-1"
            >
              <DollarSign size={13} />
              <span>Invoice: {String(inv.invoice_number ?? 'N/A')}</span>
            </Link>
          ))}
          {activeAgreements.map((agr: any) => (
            <Link
              key={String(agr.id)}
              href={`/dashboard/agreements/${agr.id}/preview`}
              className="px-2.5 py-1 bg-white dark:bg-slate-800 rounded-lg border border-amber-500/30 text-amber-700 dark:text-amber-300 font-mono font-bold hover:underline flex items-center gap-1"
            >
              <FileText size={13} />
              <span>Agreement: {String(agr.agreement_number ?? 'N/A')}</span>
            </Link>
          ))}
          {linkedPayments.map((pmt: any) => (
            <span
              key={String(pmt.id)}
              className="px-2.5 py-1 bg-emerald-500/10 rounded-lg border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-mono font-bold flex items-center gap-1"
            >
              <Receipt size={13} />
              <span>Payment: {String(pmt.reference_number ?? 'N/A')} (LKR {formatNumberSafe(pmt.amount)})</span>
            </span>
          ))}
        </div>
      )}

      {/* Customer & Financial Summary Grid */}
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

        {/* Schedule & Financial Summary Overview */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 shadow-xs">
          <h2 className="text-xs font-bold uppercase tracking-wider text-amber-500 border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-1.5">
            <Calendar size={15} />
            <span>Rental Schedule & Financial Overview</span>
          </h2>
          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Pickup</span>
                <div className="font-semibold text-slate-800 dark:text-slate-200">{String(booking.pickup_location ?? 'Not specified')}</div>
                <div className="text-[11px] text-slate-500">{formatDateTimeSafe(booking.rental_start_at)}</div>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Drop-off</span>
                <div className="font-semibold text-slate-800 dark:text-slate-200">{String(booking.dropoff_location ?? 'Not specified')}</div>
                <div className="text-[11px] text-slate-500">{formatDateTimeSafe(booking.rental_end_at)}</div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span>Inclusive Duration:</span>
              <span className="font-bold text-amber-500">{rentalDays} Day(s)</span>
            </div>

            {/* Financial Grid */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs">
              <div className="text-slate-500">Subtotal:</div>
              <div className="text-right font-mono text-slate-800 dark:text-slate-200">LKR {formatNumberSafe(booking.subtotal)}</div>

              <div className="text-slate-500">Discount:</div>
              <div className="text-right font-mono text-slate-800 dark:text-slate-200">LKR {formatNumberSafe(booking.discount_amount)}</div>

              <div className="text-slate-500">Tax Amount:</div>
              <div className="text-right font-mono text-slate-800 dark:text-slate-200">LKR {formatNumberSafe(booking.tax_amount)}</div>

              <div className="text-slate-500">Refundable Deposit:</div>
              <div className="text-right font-mono text-slate-800 dark:text-slate-200">LKR {formatNumberSafe(booking.refundable_deposit)}</div>

              <div className="text-slate-900 dark:text-white font-bold pt-1 border-t border-slate-200 dark:border-slate-700">Grand Total:</div>
              <div className="text-right font-mono font-bold text-amber-500 text-sm pt-1 border-t border-slate-200 dark:border-slate-700">LKR {formatNumberSafe(booking.grand_total)}</div>

              <div className="text-slate-900 dark:text-white font-bold">Advance Paid:</div>
              <div className="text-right font-mono font-bold text-emerald-500 text-sm">LKR {formatNumberSafe(booking.advance_paid)}</div>

              <div className="text-slate-900 dark:text-white font-bold">Balance Due:</div>
              <div className="text-right font-mono font-bold text-rose-500 text-base">LKR {formatNumberSafe(totalBalanceDue)}</div>
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
                  bookingVehicleId={String(bv.id)}
                  bookingId={String(id)}
                  vehicleName={veh ? `${veh.vehicle_name} (${veh.registration_number})` : `Vehicle ID: ${bv.vehicle_id}`}
                  vehicleRate={Number(bv.vehicle_rate || 0)}
                  depositAmount={Number(bv.deposit_amount || 0)}
                  allowedKm={bv.allowed_km ? Number(bv.allowed_km) : null}
                  extraKmCharge={bv.extra_km_charge ? Number(bv.extra_km_charge) : null}
                  rentalDays={rentalDays}
                  currentDriverId={bv.driver_id ? String(bv.driver_id) : null}
                  currentDriverName={drv ? String(drv.full_name) : null}
                  currentDriverCode={drv ? String(drv.driver_code) : null}
                  currentDriverMobile={drv ? String(drv.mobile) : null}
                  currentDriverStatus={drv ? String(drv.status) : null}
                  rentalStartAt={String(booking.rental_start_at ?? '')}
                  rentalEndAt={String(booking.rental_end_at ?? '')}
                  drivers={serializableDrivers}
                />
              )
            })}
          </div>
        ) : (
          <div className="text-xs text-slate-400 italic py-2">No vehicle rows assigned to this booking.</div>
        )}
      </div>

      {/* Extra Charges Section */}
      <ExtraChargesSection
        bookingId={String(id)}
        charges={bookingCharges.map((c: any) => ({
          id: String(c.id),
          charge_type: String(c.charge_type),
          description: String(c.description),
          quantity: Number(c.quantity),
          unit_amount: Number(c.unit_amount),
          amount: Number(c.amount),
          status: String(c.status),
        }))}
      />

      {/* Activity Log Timeline */}
      <ActivityTimeline logs={serializableLogs} bookingCreatedAt={String(booking.created_at)} />
    </div>
  )
}
