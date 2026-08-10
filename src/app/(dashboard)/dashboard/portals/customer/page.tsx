import { createClient } from '@/lib/supabase/server'
import { getCustomerPortalData } from '@/lib/portals/portal-service'
import { CustomerPortalClient } from './customer-portal-client'

export const metadata = {
  title: 'Customer Portal — Thennakoon Tours',
}

export default async function CustomerPortalPage() {
  const supabase = await createClient()

  const portalData = await getCustomerPortalData(supabase)

  // Fetch self-booking requests
  const { data: selfBookings } = await supabase
    .from('customer_self_bookings')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  // Fetch vehicle categories for self booking form
  const { data: categories } = await supabase
    .from('vehicle_categories')
    .select('id, category_name')
    .order('category_name', { ascending: true })

  // Fetch available vehicles
  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('id, vehicle_name, registration_number')
    .eq('is_archived', false)

  return (
    <div className="px-4 py-6 md:px-8">
      <CustomerPortalClient
        portalData={portalData}
        selfBookings={selfBookings || []}
        categories={categories || []}
        vehicles={vehicles || []}
      />
    </div>
  )
}
