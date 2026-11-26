import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import EditVehicleForm from './edit-vehicle-form'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditVehiclePage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const [vehicleRes, categoriesRes, ownersRes] = await Promise.all([
    supabase.from('vehicles').select('*').eq('id', id).single(),
    supabase
      .from('vehicle_categories')
      .select('id, name')
      .or('is_active.eq.true,is_active.is.null')
      .order('display_order'),
    supabase
      .from('vehicle_owners')
      .select(
        'id, owner_number, full_name, company_name, owner_type, national_id, mobile, whatsapp, email, address, revenue_share_pct, flat_rate_per_day, payment_terms, bank_account_name, bank_name, bank_account_number, bank_branch, monthly_km_quota, owner_excess_km_rate'
      )
      .eq('is_active', true)
      .order('full_name', { ascending: true }),
  ])

  if (vehicleRes.error || !vehicleRes.data) {
    notFound()
  }

  return (
    <EditVehicleForm
      vehicle={vehicleRes.data}
      categories={categoriesRes.data || []}
      owners={ownersRes.data || []}
    />
  )
}
