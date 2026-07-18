import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { FileText, Printer, Eye } from 'lucide-react'

export default async function AgreementsPage() {
  const supabase = await createClient()

  const { data: agreements } = await supabase
    .from('rental_agreements')
    .select('*, customer:customers(full_name, mobile), booking:bookings(booking_number)')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Rental Agreements</h1>
        <p className="text-xs text-slate-500">Legal vehicle rental agreements, conditions, and signature documents.</p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
        {agreements && agreements.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-850 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Agreement No</th>
                  <th className="py-3.5 px-4">Booking Ref</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Rental Period</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-slate-700 dark:text-slate-300">
                {agreements.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-850/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-amber-500">{item.agreement_number}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">{item.booking?.booking_number}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">{item.customer?.full_name || 'N/A'}</div>
                      <div className="text-[11px] text-slate-400">{item.customer?.mobile}</div>
                    </td>
                    <td className="py-3.5 px-4 text-[11px]">
                      {new Date(item.rental_start_at).toLocaleDateString()} to {new Date(item.rental_end_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                        {item.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/dashboard/agreements/${item.id}/preview`}
                        className="p-1.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 inline-flex items-center gap-1 font-semibold text-[11px]"
                      >
                        <Printer size={13} />
                        <span>PDF</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center space-y-3">
            <FileText size={36} className="mx-auto text-slate-400" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No Rental Agreements Generated</p>
            <p className="text-xs text-slate-400">Generate rental agreements directly from booking records.</p>
          </div>
        )}
      </div>
    </div>
  )
}
