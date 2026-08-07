import { ComingSoonModule } from '@/components/ui/coming-soon-module'

export const metadata = {
  title: 'Customer Self-Service Portal — Thennakoon Tours',
}

export default function CustomerPortalPage() {
  return (
    <ComingSoonModule
      title="Customer Self-Service Portal"
      description="Allow hirers to view active bookings, download agreement PDFs, view invoice balances, and track assigned drivers."
      plannedPhase="Phase 4 — Customer Web Portal"
    />
  )
}
