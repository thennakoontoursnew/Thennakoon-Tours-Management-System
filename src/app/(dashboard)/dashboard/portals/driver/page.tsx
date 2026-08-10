import { createClient } from '@/lib/supabase/server'
import { getDriverPortalData } from '@/lib/portals/portal-service'
import { DriverPortalClient } from './driver-portal-client'

export const metadata = {
  title: 'Driver Portal — Thennakoon Tours',
}

export default async function DriverPortalPage() {
  const supabase = await createClient()

  const portalData = await getDriverPortalData(supabase)

  return (
    <div className="px-4 py-6 md:px-8">
      <DriverPortalClient portalData={portalData} />
    </div>
  )
}
