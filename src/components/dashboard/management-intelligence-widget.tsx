import Link from 'next/link'
import { Sparkles, TrendingUp, AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react'

interface ManagementIntelligenceWidgetProps {
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
    <div className="bg-gradient-to-r from-slate-900 via-amber-950/30 to-slate-900 text-white rounded-2xl border border-amber-500/20 p-6 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-500/20 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-400/10 text-amber-400">
            <Sparkles size={18} />
          </div>
          <div>
            <h2 className="font-bold text-white text-base">Management Intelligence Summary</h2>
            <p className="text-slate-400 text-xs">Deterministic business insights & revenue forecasting</p>
          </div>
        </div>

        <Link
          href="/dashboard/ai-tools"
          className="px-3 py-1.5 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs hover:bg-amber-300 transition-all flex items-center gap-1 shrink-0 w-fit"
        >
          <span>Open AI Center</span>
          <ArrowRight size={13} />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Forecast Card */}
        <div className="p-4 bg-slate-850/60 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
            <TrendingUp size={12} className="text-emerald-400" /> Next 30-Day Revenue Forecast
          </span>
          <div className="font-mono font-black text-amber-400 text-xl">
            LKR {forecast30d.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-400">Baseline run-rate + confirmed pipeline</span>
        </div>

        {/* Critical Alerts */}
        <div className="p-4 bg-slate-850/60 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
            <AlertTriangle size={12} className="text-rose-400" /> Critical Management Alerts
          </span>
          <div className="font-mono font-black text-rose-400 text-xl">
            {criticalAlertCount} Active
          </div>
          <span className="text-[10px] text-slate-400">Requires management follow-up</span>
        </div>

        {/* Insights summary */}
        <div className="p-4 bg-slate-850/60 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
            <CheckCircle2 size={12} className="text-blue-400" /> Active Recommendations
          </span>
          <div className="font-mono font-black text-blue-400 text-xl">
            {insights.length} Actions
          </div>
          <span className="text-[10px] text-slate-400">Categorized by priority & module</span>
        </div>
      </div>

      {/* Top 3 Insights */}
      {top3.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Top Actionable Management Insights</span>
          <div className="space-y-1.5">
            {top3.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-850/40 border border-slate-800/80">
                <span className="font-semibold text-slate-200 truncate max-w-lg">{item.title}</span>
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${item.priority === 'critical' ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'}`}>
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
