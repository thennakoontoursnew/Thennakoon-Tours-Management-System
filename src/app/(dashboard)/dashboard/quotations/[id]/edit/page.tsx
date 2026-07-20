import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import EditQuotationForm from './edit-quotation-form'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditQuotationPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: quotation } = await supabase
    .from('quotations')
    .select('*, customer:customers(*), items:quotation_items(*)')
    .eq('id', id)
    .single()

  if (!quotation) {
    notFound()
  }

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
      <EditQuotationForm
        quotation={quotation}
        customers={customers || []}
        vehicles={vehicles || []}
      />
    </div>
  )
}
