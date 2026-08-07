import { createClient } from '@/lib/supabase/server'
import { VehicleOwnersClient } from './vehicle-owners-client'

export const metadata = {
  title: 'Vehicle Owners — Thennakoon Tours',
}

export default async function VehicleOwnersPage() {
  const supabase = await createClient()

  // Fetch all vehicle owners with vehicle counts
  const { data: ownersRaw } = await supabase
    .from('vehicle_owners')
    .select('*')
    .order('is_active', { ascending: false })
    .order('full_name', { ascending: true })

  const owners = ownersRaw || []

  // Count vehicles per owner
  const ownerIds = owners.map((o) => o.id)
  let vehicleCountMap: Record<string, number> = {}

  if (ownerIds.length > 0) {
    const { data: vehiclesWithOwners } = await supabase
      .from('vehicles')
      .select('vehicle_owner_id')
      .in('vehicle_owner_id', ownerIds)
      .eq('is_archived', false)

    ;(vehiclesWithOwners || []).forEach((v) => {
      if (v.vehicle_owner_id) {
        vehicleCountMap[v.vehicle_owner_id] = (vehicleCountMap[v.vehicle_owner_id] || 0) + 1
      }
    })
  }

  const enrichedOwners = owners.map((o) => ({
    ...o,
    vehicle_count: vehicleCountMap[o.id] || 0,
  }))

  return (
    <div className="px-4 py-6 md:px-8">
      <VehicleOwnersClient owners={enrichedOwners} />
    </div>
  )
}
