import Link from 'next/link'
import { Sparkles, TrendingUp, AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react'

interface ManagementIntelligenceWidgetProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  insights: any[]
  forecast30d: number
  criticalAlertCount: number
}

export function ManagementIntelligenceWidget({
  insights,
  forecast30d,
  criticalAlertCount,
}: ManagementIntelligenceWidgetProps) {
  const top3 = insights.slice(0, 3)

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-200/60">
            <Sparkles size={18} />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 text-base">Management Intelligence Summary</h2>
            <p className="text-slate-500 text-xs">Deterministic business insights & revenue forecasting</p>
          </div>
        </div>

        <Link
          href="/dashboard/ai-tools"
          className="px-3 py-1.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-all flex items-center gap-1 shrink-0 w-fit shadow-sm"
        >
          <span>Open AI Center</span>
          <ArrowRight size={13} />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Forecast Card */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
          <span className="text-[10px] font-semibold uppercase text-slate-500 flex items-center gap-1">
            <TrendingUp size={12} className="text-emerald-600" /> Next 30-Day Revenue Forecast
          </span>
          <div className="font-mono font-black text-slate-900 text-xl">
            LKR {forecast30d.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500">Baseline run-rate + confirmed pipeline</span>
        </div>

        {/* Critical Alerts */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
          <span className="text-[10px] font-semibold uppercase text-slate-500 flex items-center gap-1">
            <AlertTriangle size={12} className="text-rose-500" /> Critical Management Alerts
          </span>
          <div className="font-mono font-black text-rose-600 text-xl">
            {criticalAlertCount} Active
          </div>
          <span className="text-[10px] text-slate-500">Requires management follow-up</span>
        </div>

        {/* Insights summary */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
          <span className="text-[10px] font-semibold uppercase text-slate-500 flex items-center gap-1">
            <CheckCircle2 size={12} className="text-blue-600" /> Active Recommendations
          </span>
          <div className="font-mono font-black text-blue-600 text-xl">
            {insights.length} Actions
          </div>
          <span className="text-[10px] text-slate-500">Categorized by priority & module</span>
        </div>
      </div>

      {/* Top 3 Insights */}
      {top3.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-slate-200">
          <span className="text-[10px] font-medium uppercase tracking-wider text-slate-700">Top Actionable Management Insights</span>
          <div className="space-y-1.5">
            {top3.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50/80 border border-slate-200">
                <span className="font-semibold text-slate-800 truncate max-w-lg">{item.title}</span>
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
                  item.priority === 'critical' || item.priority === 'high'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {item.priority}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
