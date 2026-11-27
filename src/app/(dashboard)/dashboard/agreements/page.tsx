import { createClient } from '@/lib/supabase/server'
import {
  getAgreementsKPIs,
  getUserAgreements,
  getOwnerAgreements,
} from '@/lib/agreements/agreement-service'
import { AgreementsClient } from './agreements-client'

export const metadata = {
  title: 'Agreements Center — Thennakoon Tours',
}

interface PageProps {
  searchParams: Promise<{
    tab?: string
    new_owner?: string
    vehicle_id?: string
    owner_id?: string
  }>
}

export default async function AgreementsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const supabase = await createClient()

  const [kpis, userAgreements, ownerAgreements, ownersRes, vehiclesRes, bookingsRes, staffRes, authRes] = await Promise.all([
    getAgreementsKPIs(supabase),
    getUserAgreements(supabase),
    getOwnerAgreements(supabase),
    supabase.from('vehicle_owners').select('*').order('full_name', { ascending: true }),
    supabase.from('vehicles').select('*').eq('is_archived', false),
    supabase
      .from('bookings')
      .select('id, booking_number, rental_start_at, rental_end_at, customer:customers(id, full_name, mobile)')
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('profiles')
      .select('id, full_name, role, designation, signature_url')
      .eq('is_active', true)
      .order('full_name', { ascending: true }),
    supabase.auth.getUser(),
  ])

  const vehiclesList = vehiclesRes.data || []
  const preselectedVehicleId = params.vehicle_id || undefined
  const matchedVehicle = preselectedVehicleId ? vehiclesList.find((v: any) => v.id === preselectedVehicleId) : null
  const preselectedOwnerId = params.owner_id || matchedVehicle?.vehicle_owner_id || undefined

  return (
    <div className="px-4 py-6 md:px-8">
      <AgreementsClient
        kpis={kpis}
        userAgreements={userAgreements}
        ownerAgreements={ownerAgreements}
        owners={ownersRes.data || []}
        vehicles={vehiclesList}
        bookings={bookingsRes.data || []}
        staffProfiles={staffRes.data || []}
        currentUserId={authRes.data?.user?.id || null}
        initialTab={params.tab === 'owner' ? 'owner' : 'user'}
        initialOpenOwnerModal={params.new_owner === '1'}
        initialOwnerId={preselectedOwnerId}
        initialVehicleId={preselectedVehicleId}
      />
    </div>
  )
}
