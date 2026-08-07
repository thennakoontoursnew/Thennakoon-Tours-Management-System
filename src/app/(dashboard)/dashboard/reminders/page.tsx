import { ComingSoonModule } from '@/components/ui/coming-soon-module'

export const metadata = {
  title: 'Reminders & Notifications — Thennakoon Tours',
}

export default function RemindersPage() {
  return (
    <ComingSoonModule
      title="Reminders & Operational Notifications"
      description="Automated customer pickup reminders, vehicle license renewal alerts, and payment due notifications."
      plannedPhase="Phase 4 — Automated Alerts Engine"
    />
  )
}
