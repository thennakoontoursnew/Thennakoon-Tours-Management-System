import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import EditVehicleForm from './edit-vehicle-form'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditVehiclePage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: vehicle, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('id', id)
    .single()

  const { data: categories } = await supabase
    .from('vehicle_categories')
    .select('id, name')
    .eq('is_active', true)
    .order('display_order')

  if (error || !vehicle) {
    notFound()
  }

  return <EditVehicleForm vehicle={vehicle} categories={categories || []} />
}
