'use client'

export function DashboardSkeleton() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-4 w-48 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
          <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
          <div className="h-3 w-72 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-10 w-32 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
          <div className="h-10 w-32 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
        </div>
      </div>

      {/* KPI Cards Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded"></div>
            <div className="h-7 w-28 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
            <div className="h-3 w-24 bg-slate-200 dark:bg-slate-800 rounded"></div>
          </div>
        ))}
      </div>

      {/* Main Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-72 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800"></div>
        <div className="h-72 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800"></div>
      </div>
    </div>
  )
}
