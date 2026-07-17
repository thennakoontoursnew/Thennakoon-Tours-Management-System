import { Construction } from 'lucide-react'

export const metadata = {
  title: 'Maintenance â€” Thennakoon Tours Management System',
}

export default function Page() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Maintenance</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Scheduled and unscheduled vehicle maintenance records and alerts.</p>
      </div>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 p-12 shadow-sm flex flex-col items-center justify-center text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 flex items-center justify-center text-amber-500">
          <Construction size={32} />
        </div>
        <div className="space-y-2 max-w-md">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">Module Not Yet Available</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
            This module will be implemented in a future development phase. The architecture and database schema are ready; functionality will be activated upon Phase 2 and beyond.
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-full">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
          <span className="text-xs font-bold text-amber-700 dark:text-amber-400">Coming in Next Phase</span>
        </div>
      </div>
    </div>
  )
}
