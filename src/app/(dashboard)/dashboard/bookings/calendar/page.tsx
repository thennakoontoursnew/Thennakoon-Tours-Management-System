import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft, Calendar, Car } from 'lucide-react'

export default async function BookingCalendarPage() {
  const supabase = await createClient()

  const { data: rawBookings } = await supabase
    .from('bookings')
    .select('*')
    .eq('is_archived', false)
    .order('rental_start_at', { ascending: true })

  const bookings = rawBookings || []
  const customerIds = bookings.map((b: any) => b.customer_id).filter(Boolean)
  const bookingIds = bookings.map((b: any) => b.id)

  const { data: customersList } = customerIds.length > 0
    ? await supabase.from('customers').select('id, full_name').in('id', customerIds)
    : { data: [] }

  const { data: bookingVehiclesList } = bookingIds.length > 0
    ? await supabase.from('booking_vehicles').select('id, booking_id, vehicle_id').in('booking_id', bookingIds)
    : { data: [] }

  const vehicleIds = (bookingVehiclesList || []).map((bv: any) => bv.vehicle_id).filter(Boolean)

  const { data: vehiclesList } = vehicleIds.length > 0
    ? await supabase.from('vehicles').select('id, vehicle_name, registration_number').in('id', vehicleIds)
    : { data: [] }

  const customerMap = new Map((customersList || []).map((c: any) => [c.id, c]))
  const vehicleMap = new Map((vehiclesList || []).map((v: any) => [v.id, v]))

  const bvMap = new Map<string, any[]>()
  for (const bv of bookingVehiclesList || []) {
    const list = bvMap.get(bv.booking_id) || []
    list.push(bv)
    bvMap.set(bv.booking_id, list)
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/bookings"
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Fleet Schedule Calendar</h1>
          <p className="text-xs text-slate-500">Visual timeline of active, upcoming, and completed vehicle bookings.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
            <Calendar size={16} />
            <span>Active Reservations Timeline</span>
          </span>
          <span className="text-xs font-semibold text-slate-500">{bookings.length} Total Bookings</span>
        </div>

        <div className="space-y-3">
          {bookings.length > 0 ? (
            bookings.map((b: any) => {
              const cust = customerMap.get(b.customer_id)
              const bvs = bvMap.get(b.id) || []
              return (
                <div
                  key={b.id}
                  className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-amber-400 transition-all"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-amber-500 text-xs">{b.booking_number}</span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">• {cust?.full_name || 'N/A'}</span>
                    </div>
                    <div className="text-xs text-slate-500">
                      Schedule: {b.rental_start_at ? new Date(b.rental_start_at).toLocaleString() : 'N/A'} ➔ {b.rental_end_at ? new Date(b.rental_end_at).toLocaleString() : 'N/A'}
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {bvs.map((bv: any) => {
                        const veh = vehicleMap.get(bv.vehicle_id)
                        return (
                          <span key={bv.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold text-[11px]">
                            <Car size={11} />
                            <span>{veh ? `${veh.vehicle_name} (${veh.registration_number})` : 'Vehicle'}</span>
                          </span>
                        )
                      })}
                    </div>
                  </div>

                  <Link
                    href={`/dashboard/bookings/${b.id}`}
                    className="px-3 py-1.5 bg-slate-900 text-white dark:bg-slate-800 rounded-lg text-xs font-bold hover:bg-slate-800 dark:hover:bg-slate-700 w-fit"
                  >
                    View Details
                  </Link>
                </div>
              )
            })
          ) : (
            <div className="py-12 text-center text-xs text-slate-400">No scheduled bookings found.</div>
          )}
        </div>
      </div>
    </div>
  )
}
