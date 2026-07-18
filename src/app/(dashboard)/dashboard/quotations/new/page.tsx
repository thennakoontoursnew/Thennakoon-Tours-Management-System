import { createClient } from '@/lib/supabase/server'
import NewQuotationForm from './new-quotation-form'

export default async function NewQuotationPage() {
  const supabase = await createClient()

  const { data: customers } = await supabase
    .from('customers')
    .select('id, customer_code, full_name, mobile, company_name')
    .eq('is_archived', false)
    .order('full_name')

  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('id, vehicle_code, vehicle_name, registration_number, daily_rate, refundable_deposit, allowed_km_per_day, extra_km_charge, manufacture_year')
    .eq('is_archived', false)
    .order('vehicle_name')

  return (
    <div className="max-w-5xl mx-auto">
      <NewQuotationForm customers={customers || []} vehicles={vehicles || []} />
    </div>
  )
}
