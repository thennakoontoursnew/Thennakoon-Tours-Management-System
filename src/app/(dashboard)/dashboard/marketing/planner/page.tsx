import { createClient } from '@/lib/supabase/server'
import { PlannerClientWrapper } from './planner-client-wrapper'

export const metadata = {
  title: 'Content Planner — Thennakoon Tours',
}

export default async function ContentPlannerPage() {
  const supabase = await createClient()

  const { data: contentItems } = await supabase
    .from('marketing_content')
    .select('*')
    .eq('is_archived', false)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Marketing Content Planner</h1>
        <p className="text-slate-500 text-xs mt-1">Idea staging, video script production, approval lifecycle, and scheduled post publishing.</p>
      </div>

      <PlannerClientWrapper contentItems={contentItems || []} />
    </div>
  )
}
