import { createClient } from '@/lib/supabase/server'
import { getUserAgreementById } from '@/lib/agreements/agreement-service'
import { notFound } from 'next/navigation'
import { UserAgreementPreviewClient } from './user-agreement-preview-client'

export const metadata = {
  title: 'User Agreement PDF Preview — Thennakoon Tours',
}

export default async function UserAgreementPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  console.log('[USER AGREEMENT PREVIEW STEP 1] Load Agreement ID:', id)
  let rawData: any = null
  try {
    rawData = await getUserAgreementById(supabase, id)
  } catch (err: any) {
    console.error('[USER AGREEMENT PREVIEW STEP 1 ERROR]:', err)
    throw err // Passed to error.tsx boundary
  }

  if (!rawData || !rawData.agreement) {
    notFound()
  }

  console.log('[USER AGREEMENT PREVIEW STEP 2 & 3] Detect Template & Prepare Payload')
  // Guarantee 100% JSON-serializable payload crossing Server -> Client boundary
  const serializedPayload = JSON.parse(JSON.stringify(rawData))

  console.log('[USER AGREEMENT PREVIEW STEP 4 & 5] Render Client Component')
  return <UserAgreementPreviewClient {...serializedPayload} />
}
