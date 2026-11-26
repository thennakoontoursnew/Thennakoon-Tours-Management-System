import { redirect } from 'next/navigation'

export default async function NewOwnerAgreementRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ vehicle_id?: string; owner_id?: string }>
}) {
  const params = await searchParams
  const query = new URLSearchParams({ tab: 'owner', new_owner: '1' })
  if (params.vehicle_id) query.set('vehicle_id', params.vehicle_id)
  if (params.owner_id) query.set('owner_id', params.owner_id)
  redirect(`/dashboard/agreements?${query.toString()}`)
}
