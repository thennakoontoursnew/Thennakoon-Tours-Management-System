import { createClient } from '@/lib/supabase/server'
import { Calendar, Plus, CheckCircle, Clock } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'Content Calendar — Thennakoon Tours',
}

export default async function ContentCalendarPage() {
  const supabase = await createClient()

  const { data: contentItems } = await supabase
    .from('marketing_content')
    .select('*')
    .eq('is_archived', false)
    .order('planned_publish_at', { ascending: true })

  const items = contentItems || []

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Marketing Content Calendar</h1>
          <p className="text-slate-500 text-xs mt-1">Publishing dates, scheduled content slots, and upcoming social media releases.</p>
        </div>
        <Link
          href="/dashboard/marketing/planner"
          className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-400 text-slate-950 hover:bg-amber-300 transition-all flex items-center gap-1.5 shadow-xs"
        >
          <Plus size={16} />
          <span>Open Planner Board</span>
        </Link>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 shadow-xs">
        <h2 className="text-xs font-bold uppercase tracking-wider text-amber-500 border-b border-slate-100 dark:border-slate-800 pb-3">
          Upcoming Scheduled Content Agenda
        </h2>

        {items.length > 0 ? (
          <div className="space-y-3">
            {items.map((item: any) => (
              <div
                key={item.id}
                className="p-4 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl font-mono text-xs font-bold text-center min-w-[70px]">
                    {item.planned_publish_at ? new Date(item.planned_publish_at).toLocaleDateString() : 'Unscheduled'}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-amber-500">{item.content_type} • {item.content_pillar}</span>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">{item.title}</h3>
                    <p className="text-[11px] text-slate-400 line-clamp-1">{item.caption || 'No caption copy added'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                    item.status === 'published' ? 'bg-emerald-500/10 text-emerald-500' :
                    item.status === 'scheduled' ? 'bg-blue-500/10 text-blue-500' :
                    'bg-amber-500/10 text-amber-500'
                  }`}>
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-slate-400 italic">No scheduled marketing content found in calendar.</div>
        )}
      </div>
    </div>
  )
}
