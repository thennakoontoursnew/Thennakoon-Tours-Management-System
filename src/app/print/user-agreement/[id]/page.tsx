import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { getUserAgreementById } from '@/lib/agreements/agreement-service'
import { UserAgreementPrintClient } from './user-agreement-print-client'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const agreementData = await getUserAgreementById(supabase, id)
  if (!agreementData) return { title: 'User Agreement Not Found' }

  return {
    title: `Print ${agreementData.agreement.agreement_number} — Thennakoon Tours`,
  }
}

export default async function UserAgreementPrintPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const data = await getUserAgreementById(supabase, id)

  if (!data || !data.agreement) {
    notFound()
  }

  return (
    <UserAgreementPrintClient
      agreement={data.agreement}
      isV1={data.isV1}
      booking={data.booking}
      customer={data.customer}
      vehicle={data.vehicle}
      companySettings={data.companySettings}
    />
  )
}
