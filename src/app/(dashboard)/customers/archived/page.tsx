import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft, RotateCcw, Archive, UserCheck } from 'lucide-react'
import { restoreCustomer } from '../customer-actions'

export default async function ArchivedCustomersPage() {
  const supabase = await createClient()

  const { data: customers } = await supabase
    .from('customers')
    .select('*')
    .eq('is_archived', true)
    .order('archived_at', { ascending: false })

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/customers"
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Archived Customers</h1>
          <p className="text-xs text-slate-500">View and restore soft-deleted customer records.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
        {customers && customers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-850 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider">
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Customer Name</th>
                  <th className="py-3 px-4">Mobile</th>
                  <th className="py-3 px-4">Archived At</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-slate-700 dark:text-slate-300">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-850/50">
                    <td className="py-3 px-4 font-mono font-bold text-amber-500">{c.customer_code}</td>
                    <td className="py-3 px-4 font-bold">{c.full_name}</td>
                    <td className="py-3 px-4">{c.mobile}</td>
                    <td className="py-3 px-4 text-slate-400">{c.archived_at ? new Date(c.archived_at).toLocaleDateString() : 'N/A'}</td>
                    <td className="py-3 px-4 text-right">
                      <form action={async () => {
                        'use server'
                        await restoreCustomer(c.id)
                      }}>
                        <button
                          type="submit"
                          className="px-3 py-1 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border border-emerald-500/20 rounded font-semibold text-xs inline-flex items-center gap-1 cursor-pointer"
                        >
                          <RotateCcw size={12} />
                          <span>Restore</span>
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center space-y-2">
            <Archive size={32} className="mx-auto text-slate-400" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No Archived Customers</p>
            <p className="text-xs text-slate-400">All customer records are currently active.</p>
          </div>
        )}
      </div>
    </div>
  )
}
