import { createClient } from '@/lib/supabase/server'
import { getOwnerAgreementById } from '@/lib/agreements/agreement-service'
import { notFound } from 'next/navigation'
import { OwnerAgreementPreviewClient } from './owner-agreement-preview-client'

export const metadata = {
  title: 'Owner Agreement PDF Preview — Thennakoon Tours',
}

export default async function OwnerAgreementPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const data = await getOwnerAgreementById(supabase, id)
  if (!data || !data.agreement) {
    notFound()
  }

  // Pure DTO serialization
  const serialized = JSON.parse(JSON.stringify(data))

  return (
    <OwnerAgreementPreviewClient
      agreement={serialized.agreement}
      owner={serialized.agreement.owner}
      vehicles={serialized.agreement.vehicles}
    />
  )
}
