import { ComingSoonModule } from '@/components/ui/coming-soon-module'

export const metadata = {
  title: 'Vehicle Inspections — Thennakoon Tours',
}

export default function InspectionsPage() {
  return (
    <ComingSoonModule
      title="Vehicle Inspections"
      description="Pre-rental and post-rental vehicle condition reports, photo inspections, and damage logs."
      plannedPhase="Phase 4 — Operations Inspection Suite"
    />
  )
}
