import { createClient } from '@/lib/supabase/server'
import NewVehicleForm from './new-vehicle-form'

export default async function NewVehiclePage() {
  const supabase = await createClient()

  // Fetch active categories for dropdown
  const { data: categories } = await supabase
    .from('vehicle_categories')
    .select('id, name')
    .or('is_active.eq.true,is_active.is.null')
    .order('display_order', { ascending: true })

  return <NewVehicleForm categories={categories || []} />
}
