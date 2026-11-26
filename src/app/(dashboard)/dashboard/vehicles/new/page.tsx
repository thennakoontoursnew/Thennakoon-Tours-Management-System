import { createClient } from '@/lib/supabase/server'
import NewVehicleForm from './new-vehicle-form'

export default async function NewVehiclePage() {
  const supabase = await createClient()

  // Fetch active categories and vehicle owners in parallel
  const [categoriesRes, ownersRes] = await Promise.all([
    supabase
      .from('vehicle_categories')
      .select('id, name')
      .or('is_active.eq.true,is_active.is.null')
      .order('display_order', { ascending: true }),
    supabase
      .from('vehicle_owners')
      .select(
        'id, owner_number, full_name, company_name, owner_type, national_id, mobile, whatsapp, email, address, revenue_share_pct, flat_rate_per_day, payment_terms, bank_account_name, bank_name, bank_account_number, bank_branch, monthly_km_quota, owner_excess_km_rate'
      )
      .eq('is_active', true)
      .order('full_name', { ascending: true }),
  ])

  return <NewVehicleForm categories={categoriesRes.data || []} owners={ownersRes.data || []} />
}
