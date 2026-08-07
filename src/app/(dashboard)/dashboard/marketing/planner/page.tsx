import { ComingSoonModule } from '@/components/ui/coming-soon-module'

export const metadata = {
  title: 'Content Planner — Thennakoon Tours',
}

export default function ContentPlannerPage() {
  return (
    <ComingSoonModule
      title="Content Planner"
      description="Plan social posts, tour promotions, and marketing campaign ideas."
      plannedPhase="Phase 4 — Marketing Suite"
    />
  )
}
