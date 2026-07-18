import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import EditDriverForm from './edit-driver-form'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditDriverPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: driver, error } = await supabase
    .from('drivers')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !driver) {
    notFound()
  }

  return <EditDriverForm driver={driver} />
}
