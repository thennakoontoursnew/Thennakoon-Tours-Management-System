import { ComingSoonModule } from '@/components/ui/coming-soon-module'

export const metadata = {
  title: 'Offers & Promotions — Thennakoon Tours',
}

export default function OffersPage() {
  return (
    <ComingSoonModule
      title="Offers & Promotions"
      description="Manage seasonal tour packages, promo codes, and customer discount vouchers."
      plannedPhase="Phase 4 — Promotional Engine"
    />
  )
}
