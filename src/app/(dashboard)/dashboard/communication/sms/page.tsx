import { ComingSoonModule } from '@/components/ui/coming-soon-module'

export const metadata = {
  title: 'SMS Alerts — Thennakoon Tours',
}

export default function SMSCommunicationPage() {
  return (
    <ComingSoonModule
      title="SMS Gateway & Mobile Alerts"
      description="Automated SMS dispatch for booking confirmations, driver dispatch notifications, and OTP verification."
      plannedPhase="Phase 4 — SMS Gateway"
    />
  )
}
