import { ComingSoonModule } from '@/components/ui/coming-soon-module'

export const metadata = {
  title: 'Fuel Tracking — Thennakoon Tours',
}

export default function FuelTrackingPage() {
  return (
    <ComingSoonModule
      title="Fuel Tracking"
      description="Monitor vehicle fuel logs, trip consumption, refueling receipts, and efficiency metrics."
      plannedPhase="Phase 4 — Fleet Cost Management"
    />
  )
}
