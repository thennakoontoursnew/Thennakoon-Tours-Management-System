import { createClient } from '@/lib/supabase/server'
import NewVehicleForm from './new-vehicle-form'

export default async function NewVehiclePage() {
  const supabase = await createClient()

  // Fetch active categories for dropdown
  const { data: categories } = await supabase
    .from('vehicle_categories')
    .select('id, name')
    .eq('is_active', true)
    .order('display_order')

  return <NewVehicleForm categories={categories || []} />
}
