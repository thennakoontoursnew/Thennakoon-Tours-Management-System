import { ComingSoonModule } from '@/components/ui/coming-soon-module'

export const metadata = {
  title: 'Leads & Enquiries — Thennakoon Tours',
}

export default function LeadsPage() {
  return (
    <ComingSoonModule
      title="Leads & Enquiries"
      description="Track incoming booking inquiries, customer leads, and sales conversion pipelines."
      plannedPhase="Phase 4 — CRM & Sales Pipeline"
    />
  )
}
