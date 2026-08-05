import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Calendar, Eye } from 'lucide-react'

interface PageProps {
  searchParams: Promise<{ q?: string; status?: string }>
}

export default async function BookingsPage({ searchParams }: PageProps) {
  const { q, status } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('bookings')
    .select('*')
    .eq('is_archived', false)
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  if (q) {
    query = query.or(`booking_number.ilike.%${q}%`)
  }

  const { data: rawBookings, error: bErr } = await query
  if (bErr) {
    console.error('Bookings list load failed:', bErr)
  }

  const bookings = rawBookings || []
  const customerIds = bookings.map((b: any) => b.customer_id).filter(Boolean)
  const bookingIds = bookings.map((b: any) => b.id)

  const { data: customersList } = customerIds.length > 0
    ? await supabase.from('customers').select('id, full_name, mobile').in('id', customerIds)
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

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'confirmed':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">Confirmed</span>
      case 'on_trip':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">On Trip</span>
      case 'completed':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">Completed</span>
      case 'cancelled':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">Cancelled</span>
      default:
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-500/10 text-slate-500 border border-slate-500/20">{(st || 'PENDING').toUpperCase()}</span>
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Booking Management</h1>
          <p className="text-xs text-slate-500">Track vehicle reservations, schedules, driver assignments, and trip statuses.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/bookings/calendar"
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
          >
            <Calendar size={16} />
            <span>Calendar View</span>
          </Link>
          <Link
            href="/dashboard/bookings/new"
            className="px-4 py-2.5 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs hover:bg-amber-300 transition-all flex items-center gap-2 w-fit shadow-sm"
          >
            <Plus size={16} />
            <span>New Booking</span>
          </Link>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
        {bookings && bookings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-850 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Booking No</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Rental Schedule</th>
                  <th className="py-3.5 px-4">Assigned Fleet</th>
                  <th className="py-3.5 px-4">Grand Total</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-slate-700 dark:text-slate-300">
                {bookings.map((item: any) => {
                  const cust = customerMap.get(item.customer_id)
                  const bvs = bvMap.get(item.id) || []
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-850/50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-amber-500">
                        <Link href={`/dashboard/bookings/${item.id}`} className="hover:underline">
                          {item.booking_number}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">{cust?.full_name || 'N/A'}</div>
                        <div className="text-[11px] text-slate-400">{cust?.mobile || 'No Mobile'}</div>
                      </td>
                      <td className="py-3.5 px-4 text-[11px]">
                        <div>{item.rental_start_at ? new Date(item.rental_start_at).toLocaleDateString() : 'N/A'} to {item.rental_end_at ? new Date(item.rental_end_at).toLocaleDateString() : 'N/A'}</div>
                        <div className="text-slate-400">{item.destination || 'Standard Route'}</div>
                      </td>
                      <td className="py-3.5 px-4 text-[11px]">
                        {bvs.map((bv: any) => {
                          const veh = vehicleMap.get(bv.vehicle_id)
                          return (
                            <div key={bv.id} className="font-semibold text-slate-800 dark:text-slate-200">
                              {veh ? `${veh.vehicle_name} (${veh.registration_number})` : 'Vehicle Assigned'}
                            </div>
                          )
                        })}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                        LKR {Number(item.grand_total || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4">{getStatusBadge(item.status)}</td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/dashboard/bookings/${item.id}`}
                          className="p-1.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 inline-flex items-center gap-1 font-semibold text-[11px]"
                        >
                          <Eye size={13} />
                          <span>Manage</span>
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center space-y-3">
            <Calendar size={36} className="mx-auto text-slate-400" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No Bookings Found</p>
            <p className="text-xs text-slate-400">Create your first booking or convert an accepted quotation.</p>
          </div>
        )}
      </div>
    </div>
  )
}
