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

export default async function AgreementsPage() {
  const supabase = await createClient()

  const [kpis, userAgreements, ownerAgreements, ownersRes, vehiclesRes, bookingsRes] = await Promise.all([
    getAgreementsKPIs(supabase),
    getUserAgreements(supabase),
    getOwnerAgreements(supabase),
    supabase.from('vehicle_owners').select('id, owner_number, full_name, company_name').order('full_name', { ascending: true }),
    supabase.from('vehicles').select('id, vehicle_name, registration_number, vehicle_owner_id').eq('is_archived', false),
    supabase.from('bookings').select('id, booking_number, rental_start_at, rental_end_at, customer:customers(id, full_name, mobile)').order('created_at', { ascending: false }).limit(50),
  ])

  return (
    <div className="px-4 py-6 md:px-8">
      <AgreementsClient
        kpis={kpis}
        userAgreements={userAgreements}
        ownerAgreements={ownerAgreements}
        owners={ownersRes.data || []}
        vehicles={vehiclesRes.data || []}
        bookings={bookingsRes.data || []}
      />
    </div>
  )
}
