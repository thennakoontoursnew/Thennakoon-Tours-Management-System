'use client'

import Link from 'next/link'
import { Sparkles, ArrowLeft, Clock } from 'lucide-react'

interface ComingSoonModuleProps {
  title: string
  description: string
  plannedPhase?: string
}

export function ComingSoonModule({
  title,
  description,
  plannedPhase = 'Upcoming Feature Release',
}: ComingSoonModuleProps) {
  return (
    <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-6">
      <div className="w-16 h-16 rounded-3xl bg-amber-400/10 border border-amber-400/20 text-amber-500 flex items-center justify-center mx-auto shadow-inner">
        <Clock size={32} />
      </div>

      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider">
          <Sparkles size={13} />
          <span>{plannedPhase}</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">{title}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">{description}</p>
      </div>

      <div className="pt-4 flex items-center justify-center gap-3">
        <Link
          href="/dashboard"
          className="px-5 py-2.5 bg-amber-400 text-slate-950 font-bold rounded-xl text-xs hover:bg-amber-300 transition-all flex items-center gap-2 shadow-sm cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Back to Executive Dashboard</span>
        </Link>
      </div>
    </div>
  )
}
