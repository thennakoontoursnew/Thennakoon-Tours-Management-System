import { ComingSoonModule } from '@/components/ui/coming-soon-module'

export const metadata = {
  title: 'Live GPS Tracking — Thennakoon Tours',
}

export default function FleetGPSPage() {
  return (
    <ComingSoonModule
      title="Live GPS Fleet Tracking"
      description="Real-time vehicle map tracking, geofencing alerts, speed monitoring, and trip telemetry."
      plannedPhase="Phase 4 — Real-Time Telematics & GPS"
    />
  )
}
