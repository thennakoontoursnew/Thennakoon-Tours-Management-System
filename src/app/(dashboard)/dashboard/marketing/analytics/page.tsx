import { ComingSoonModule } from '@/components/ui/coming-soon-module'

export const metadata = {
  title: 'Marketing Analytics — Thennakoon Tours',
}

export default function MarketingAnalyticsPage() {
  return (
    <ComingSoonModule
      title="Marketing Analytics"
      description="Track ad spend ROI, campaign engagement rates, and booking conversion sources."
      plannedPhase="Phase 4 — Marketing Intelligence"
    />
  )
}
