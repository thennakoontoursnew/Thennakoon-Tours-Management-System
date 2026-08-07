import { ComingSoonModule } from '@/components/ui/coming-soon-module'

export const metadata = {
  title: 'Content Library — Thennakoon Tours',
}

export default function ContentLibraryPage() {
  return (
    <ComingSoonModule
      title="Content Library"
      description="Central media repository for tour photos, vehicle graphics, and brand assets."
      plannedPhase="Phase 4 — Marketing Media Hub"
    />
  )
}
