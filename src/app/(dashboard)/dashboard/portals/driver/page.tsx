import { ComingSoonModule } from '@/components/ui/coming-soon-module'

export const metadata = {
  title: 'Driver Mobile Portal — Thennakoon Tours',
}

export default function DriverPortalPage() {
  return (
    <ComingSoonModule
      title="Driver Mobile Duty Portal"
      description="Mobile interface for drivers to view assigned trips, record start/return mileage, update fuel levels, and complete trip logs."
      plannedPhase="Phase 4 — Driver Mobile Application"
    />
  )
}
