import { createClient } from '@/lib/supabase/server'
import NewBookingForm from './new-booking-form'

export default async function NewBookingPage() {
  const supabase = await createClient()

  const { data: customers } = await supabase
    .from('customers')
    .select('id, customer_code, full_name, mobile, company_name')
    .eq('is_archived', false)
    .order('full_name')

  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('id, vehicle_code, vehicle_name, registration_number, daily_rate, refundable_deposit, status')
    .eq('is_archived', false)
    .order('vehicle_name')

  return (
    <div className="max-w-5xl mx-auto">
      <NewBookingForm customers={customers || []} vehicles={vehicles || []} />
    </div>
  )
}
