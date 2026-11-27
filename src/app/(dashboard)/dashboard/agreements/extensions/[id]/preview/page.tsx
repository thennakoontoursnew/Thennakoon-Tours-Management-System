import { createClient } from '@/lib/supabase/server'
import { getExtensionLetterById } from '@/lib/agreements/agreement-service'
import { notFound } from 'next/navigation'
import { ExtensionLetterPreviewClient } from './extension-letter-preview-client'

export const metadata = {
  title: 'Extension Letter Preview — Thennakoon Tours',
}

export default async function ExtensionLetterPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const data = await getExtensionLetterById(supabase, id)
  if (!data || !data.extension) {
    notFound()
  }

  const serialized = JSON.parse(JSON.stringify(data))

  return (
    <ExtensionLetterPreviewClient
      extension={serialized.extension}
      companySettings={serialized.companySettings}
      parentAgreement={serialized.parentAgreement}
    />
  )
}
