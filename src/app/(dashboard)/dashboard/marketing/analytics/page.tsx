import { createClient } from '@/lib/supabase/server'
import { BarChart3, TrendingUp, DollarSign, Target, Award } from 'lucide-react'
import { getMarketingOverviewSummary } from '@/lib/marketing/marketing-service'

export const metadata = {
  title: 'Marketing Analytics — Thennakoon Tours',
}

export default async function MarketingAnalyticsPage() {
  const supabase = await createClient()

  const summary = await getMarketingOverviewSummary(supabase)

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Marketing Analytics & ROAS Workspace</h1>
        <p className="text-slate-500 text-xs mt-1">Campaign spend, attributed completed payment revenue, and return on ad spend (ROAS).</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-xs">
          <span className="text-xs font-bold uppercase text-emerald-500">Attributed Collected Revenue</span>
          <div className="font-mono font-black text-slate-900 dark:text-white text-2xl">
            LKR {summary.attributedRevenue.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-400 block">Completed Incoming Payments</span>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-xs">
          <span className="text-xs font-bold uppercase text-rose-500">Actual Campaign Spend</span>
          <div className="font-mono font-black text-rose-500 text-2xl">
            LKR {summary.totalSpend.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-400 block">Marketing & Advertising Expenses</span>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-xs">
          <span className="text-xs font-bold uppercase text-amber-500">Return on Ad Spend (ROAS)</span>
          <div className="font-mono font-black text-amber-500 text-2xl">
            {summary.roas}
          </div>
          <span className="text-[10px] text-slate-400 block">Revenue / Actual Spend</span>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-xs">
          <span className="text-xs font-bold uppercase text-blue-500">Active Campaigns</span>
          <div className="font-mono font-black text-blue-500 text-2xl">
            {summary.activeCampaigns}
          </div>
          <span className="text-[10px] text-slate-400 block">Currently Running Promotional Campaigns</span>
        </div>
      </div>
    </div>
  )
}
