'use client'

import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'

interface RecentBooking {
  id: string
  booking_number: string
  customer_name: string
  vehicle_name: string
  rental_start_date: string
  rental_end_date: string
  grand_total: number
  status: string
}

interface RecentBookingsTableProps {
  bookings: RecentBooking[]
}

export function RecentBookingsTable({ bookings }: RecentBookingsTableProps) {
  const bookingList = bookings || []

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2 h-5 bg-amber-400 rounded-full"></div>
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white text-sm">Recent Bookings</h2>
            <p className="text-[11px] text-slate-400">Latest reservation activity</p>
          </div>
        </div>
        <Link
          href="/dashboard/bookings"
          className="text-xs font-bold text-amber-500 hover:underline flex items-center gap-1"
        >
          <span>View All Bookings</span>
          <ArrowUpRight size={14} />
        </Link>
      </div>

      {bookingList.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-850 text-slate-500 font-bold border-b border-slate-100 dark:border-slate-800 uppercase tracking-wider">
                <th className="py-3 px-4">Booking No</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Vehicle</th>
                <th className="py-3 px-4">Rental Period</th>
                <th className="py-3 px-4">Grand Total</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-slate-700 dark:text-slate-300">
              {bookingList.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-850/50 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-amber-500">{b.booking_number}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">{b.customer_name}</td>
                  <td className="py-3.5 px-4 font-medium text-slate-600 dark:text-slate-300">{b.vehicle_name}</td>
                  <td className="py-3.5 px-4 font-mono text-[11px]">
                    {b.rental_start_date} → {b.rental_end_date}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                    LKR {b.grand_total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3.5 px-4 uppercase font-bold text-[10px]">
                    <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {b.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Link
                      href={`/dashboard/bookings/${b.id}`}
                      className="px-3 py-1.5 rounded-lg bg-amber-400 text-slate-950 font-bold text-xs hover:bg-amber-300 transition-all inline-block shadow-2xs"
                    >
                      Manage
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-8 text-center text-xs text-slate-400">No recent bookings recorded.</div>
      )}
    </div>
  )
}
