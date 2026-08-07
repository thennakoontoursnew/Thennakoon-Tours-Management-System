import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Car, Banknote, TrendingUp, Calendar, ChevronRight } from 'lucide-react'

export const metadata = {
  title: 'Owner Portal — Thennakoon Tours',
}

export default async function OwnerPortalPage() {
  const supabase = await createClient()

  // Fetch all vehicle owners
  const { data: owners } = await supabase
    .from('vehicle_owners')
    .select('id, owner_number, full_name, company_name, revenue_share_pct, flat_rate_per_day, payment_terms, is_active')
    .eq('is_active', true)
    .order('full_name', { ascending: true })

  // Fetch vehicles with owners
  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('id, vehicle_name, registration_number, status, vehicle_owner_id, owner_revenue_share_pct, owner_flat_rate_per_day')
    .not('vehicle_owner_id', 'is', null)
    .eq('is_archived', false)

  // Fetch recent payouts
  const { data: payouts } = await supabase
    .from('owner_payouts')
    .select('*, owner:vehicle_owners(full_name), vehicle:vehicles(vehicle_name, registration_number)')
    .order('created_at', { ascending: false })
    .limit(20)

  const partnerVehicles = vehicles || []
  const ownerList = owners || []
  const payoutList = payouts || []

  // Compute totals
  const totalPaid = payoutList.filter((p) => p.status === 'paid').reduce((s, p) => s + Number(p.net_payout || 0), 0)
  const totalPending = payoutList.filter((p) => p.status === 'pending' || p.status === 'approved').reduce((s, p) => s + Number(p.net_payout || 0), 0)

  const STATUS_COLORS: Record<string, string> = {
    pending: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    approved: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    paid: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    cancelled: 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:border-slate-700',
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 px-4 py-6 md:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Vehicle Owner Partner Portal</h1>
          <p className="text-slate-500 text-xs mt-1">Partner dashboard — fleet utilization, earnings, and payout summaries.</p>
        </div>
        <Link
          href="/dashboard/fleet/owners"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-amber-400 text-slate-950 hover:bg-amber-300 transition-all shadow-sm"
        >
          Manage Owners
        </Link>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Active Partners</span>
          <span className="font-mono font-black text-slate-900 dark:text-white text-xl">{ownerList.length}</span>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-blue-500 block">Partner Vehicles</span>
          <span className="font-mono font-black text-blue-500 text-xl">{partnerVehicles.length}</span>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-emerald-500 block">Total Paid Out</span>
          <span className="font-mono font-black text-emerald-500 text-base">LKR {totalPaid.toLocaleString()}</span>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-amber-500 block">Pending Payouts</span>
          <span className="font-mono font-black text-amber-500 text-base">LKR {totalPending.toLocaleString()}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Partners */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <h2 className="font-bold text-slate-900 dark:text-white text-sm">Active Partners</h2>
            <Link href="/dashboard/fleet/owners" className="text-xs text-amber-600 dark:text-amber-400 font-semibold hover:underline">Manage</Link>
          </div>

          {ownerList.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 italic">No active partners registered yet.</div>
          ) : (
            <div className="space-y-2">
              {ownerList.map((owner) => {
                const ownerVehicles = partnerVehicles.filter((v) => v.vehicle_owner_id === owner.id)
                return (
                  <div key={owner.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/30">
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white text-sm">{owner.full_name}</div>
                      {owner.company_name && <div className="text-[10px] text-slate-400">{owner.company_name}</div>}
                      <div className="text-[10px] text-slate-400 font-mono">{owner.owner_number}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-amber-600 dark:text-amber-400 text-sm">
                        {owner.revenue_share_pct > 0 ? `${owner.revenue_share_pct}% share` : owner.flat_rate_per_day ? `LKR ${Number(owner.flat_rate_per_day).toLocaleString()}/day` : '—'}
                      </div>
                      <div className="flex items-center gap-1 justify-end mt-0.5">
                        <Car size={10} className="text-slate-400" />
                        <span className="text-[10px] text-slate-500">{ownerVehicles.length} vehicles</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Recent Payouts */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <h2 className="font-bold text-slate-900 dark:text-white text-sm">Recent Payouts</h2>
            <span className="text-xs text-slate-400">{payoutList.length} total</span>
          </div>

          {payoutList.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 italic">No payouts recorded yet. Create payouts from the Vehicle Owners page.</div>
          ) : (
            <div className="space-y-2">
              {payoutList.slice(0, 8).map((payout) => (
                <div key={payout.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/30">
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white text-xs">{payout.owner?.full_name || '—'}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{payout.payout_number}</div>
                    <div className="text-[10px] text-slate-400">{payout.period_start} → {payout.period_end}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-slate-900 dark:text-white">LKR {Number(payout.net_payout).toLocaleString()}</div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold border ${STATUS_COLORS[payout.status] || ''}`}>
                      {payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Partner Vehicles List */}
      {partnerVehicles.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs">
          <h2 className="font-bold text-slate-900 dark:text-white text-sm mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">Partner Fleet Vehicles</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {partnerVehicles.map((v) => {
              const owner = ownerList.find((o) => o.id === v.vehicle_owner_id)
              return (
                <Link
                  key={v.id}
                  href={`/dashboard/vehicles/${v.id}`}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-700 hover:bg-amber-50/30 dark:hover:bg-amber-900/10 transition-all"
                >
                  <div className="flex items-center gap-2">
                    <Car size={15} className="text-slate-400" />
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white text-xs">{v.vehicle_name}</div>
                      <div className="text-[10px] text-slate-400">{v.registration_number}</div>
                      {owner && <div className="text-[10px] text-amber-600 dark:text-amber-400">{owner.full_name}</div>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${v.status === 'available' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                      {v.status || 'available'}
                    </span>
                    <ChevronRight size={13} className="text-slate-400" />
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
