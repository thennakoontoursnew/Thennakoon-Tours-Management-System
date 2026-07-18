import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft, Calendar, Car } from 'lucide-react'

export default async function BookingCalendarPage() {
  const supabase = await createClient()

  const { data: bookings } = await supabase
    .from('bookings')
    .select('*, customer:customers(full_name), vehicles:booking_vehicles(*, vehicle:vehicles(vehicle_name, registration_number))')
    .eq('is_archived', false)
    .order('rental_start_at', { ascending: true })

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/bookings"
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
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
          <span className="text-xs font-semibold text-slate-500">{bookings?.length || 0} Total Bookings</span>
        </div>

        <div className="space-y-3">
          {bookings && bookings.length > 0 ? (
            bookings.map((b) => (
              <div
                key={b.id}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-amber-400 transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-amber-500 text-xs">{b.booking_number}</span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">• {b.customer?.full_name}</span>
                  </div>
                  <div className="text-xs text-slate-500">
                    Schedule: {new Date(b.rental_start_at).toLocaleString()} ➔ {new Date(b.rental_end_at).toLocaleString()}
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {(b.vehicles || []).map((v: any) => (
                      <span key={v.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold text-[11px]">
                        <Car size={11} />
                        <span>{v.vehicle?.vehicle_name} ({v.vehicle?.registration_number})</span>
                      </span>
                    ))}
                  </div>
                </div>

                <Link
                  href={`/dashboard/bookings/${b.id}`}
                  className="px-3 py-1.5 bg-slate-900 text-white dark:bg-slate-800 rounded-lg text-xs font-bold hover:bg-slate-800 w-fit"
                >
                  View Details
                </Link>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-xs text-slate-400">No scheduled bookings found.</div>
          )}
        </div>
      </div>
    </div>
  )
}
