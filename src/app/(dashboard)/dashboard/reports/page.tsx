import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { FileText, BarChart3, ArrowRight } from 'lucide-react'
import { REPORT_REGISTRY } from '@/lib/reports/report-registry'
import { ReportsClientWrapper } from './reports-client-wrapper'

export const metadata = {
  title: 'Reports Center — Thennakoon Tours Management System',
}

export default async function ReportsPage() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Reports Center</h1>
          <p className="text-slate-500 text-xs mt-1">Operational summaries, financial ledger reports, fleet analytics, and CSV exports.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/analytics"
            className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-400 text-slate-950 hover:bg-amber-300 transition-all flex items-center gap-1.5 shadow-xs"
          >
            <BarChart3 size={16} />
            <span>Business Analytics Workspace</span>
          </Link>
        </div>
      </div>

      {/* Reports Client Wrapper */}
      <ReportsClientWrapper reports={REPORT_REGISTRY} />
    </div>
  )
}
