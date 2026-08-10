import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { getInitialUserAgreementFormData } from '@/lib/agreements/user-agreement-service'
import { UserAgreementWizard } from '@/components/agreements/user-agreement-wizard'

export const metadata = {
  title: 'Generate User Agreement — Thennakoon Tours',
}

export default async function NewUserAgreementPage({
  searchParams,
}: {
  searchParams: Promise<{ booking_id?: string }>
}) {
  const { booking_id } = await searchParams
  if (!booking_id) {
    redirect('/dashboard/bookings')
  }

  const supabase = await createClient()

  let initialData
  try {
    initialData = await getInitialUserAgreementFormData(supabase, booking_id)
  } catch (err) {
    notFound()
  }

  return (
    <div className="px-4 py-6 md:px-8">
      <UserAgreementWizard initialData={initialData} />
    </div>
  )
}
