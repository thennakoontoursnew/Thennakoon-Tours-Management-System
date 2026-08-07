'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// =============================================
// CREATE FUEL LOG
// =============================================
export async function createFuelLogAction(data: any) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const totalCost = Number(data.liters) * Number(data.cost_per_liter)

  const { data: log, error } = await supabase
    .from('fuel_logs')
    .insert({
      vehicle_id: data.vehicle_id,
      booking_id: data.booking_id || null,
      driver_id: data.driver_id || null,
      log_date: data.log_date,
      fuel_type: data.fuel_type || 'diesel',
      liters: Number(data.liters),
      cost_per_liter: Number(data.cost_per_liter),
      total_cost: totalCost,
      odometer_reading: data.odometer_reading ? Number(data.odometer_reading) : null,
      station_name: data.station_name || null,
      station_location: data.station_location || null,
      receipt_number: data.receipt_number || null,
      receipt_url: data.receipt_url || null,
      notes: data.notes || null,
      recorded_by: user.id,
    })
    .select()
    .single()

  if (error) return { error: error.message }

  // Update vehicle odometer if provided
  if (data.odometer_reading && data.vehicle_id) {
    await supabase
      .from('vehicles')
      .update({
        current_mileage: Number(data.odometer_reading),
        updated_at: new Date().toISOString(),
      })
      .eq('id', data.vehicle_id)

    await supabase
      .from('vehicle_odometer_logs')
      .insert({
        vehicle_id: data.vehicle_id,
        odometer: Number(data.odometer_reading),
        source_type: 'manual',
        source_id: log.id,
        notes: `Fuel log entry — ${data.station_name || 'refueling'}`,
        recorded_by: user.id,
        recorded_at: new Date(data.log_date).toISOString(),
      })
  }

  // Audit log (best-effort)
  try {
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'CREATE',
      table_name: 'fuel_logs',
      record_id: log.id,
      new_values: log,
    })
  } catch (_) {}

  revalidatePath('/dashboard/fleet/fuel')
  if (data.vehicle_id) revalidatePath(`/dashboard/vehicles/${data.vehicle_id}`)
  return { success: true, log }
}

// =============================================
// UPDATE FUEL LOG
// =============================================
export async function updateFuelLogAction(id: string, data: any) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const totalCost = Number(data.liters) * Number(data.cost_per_liter)

  const { error } = await supabase
    .from('fuel_logs')
    .update({
      vehicle_id: data.vehicle_id,
      booking_id: data.booking_id || null,
      driver_id: data.driver_id || null,
      log_date: data.log_date,
      fuel_type: data.fuel_type || 'diesel',
      liters: Number(data.liters),
      cost_per_liter: Number(data.cost_per_liter),
      total_cost: totalCost,
      odometer_reading: data.odometer_reading ? Number(data.odometer_reading) : null,
      station_name: data.station_name || null,
      station_location: data.station_location || null,
      receipt_number: data.receipt_number || null,
      notes: data.notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/fleet/fuel')
  return { success: true }
}

// =============================================
// DELETE FUEL LOG
// =============================================
export async function deleteFuelLogAction(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase.from('fuel_logs').delete().eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/fleet/fuel')
  return { success: true }
}
