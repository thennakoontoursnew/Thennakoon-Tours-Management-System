'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Helper for fuel efficiency (KM/L and L/100KM)
function computeEfficiency(distanceKm: number, liters: number) {
  if (!distanceKm || distanceKm <= 0 || !liters || liters <= 0) {
    return { kmPerLiter: null, litersPer100km: null }
  }
  return {
    kmPerLiter: Number((distanceKm / liters).toFixed(2)),
    litersPer100km: Number(((liters / distanceKm) * 100).toFixed(2)),
  }
}

// =============================================
// CREATE FUEL LOG
// =============================================
export async function createFuelLogAction(data: any) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const liters = Number(data.liters)
  const costPerLiter = Number(data.cost_per_liter)
  const totalCost = liters * costPerLiter
  const odoReading = data.odometer_reading ? Number(data.odometer_reading) : null
  const isFullTank = data.is_full_tank !== undefined ? Boolean(data.is_full_tank) : true

  // Calculate km_since_last_refuel & efficiency if odometer reading provided
  let kmSinceLastRefuel: number | null = null
  let kmPerLiter: number | null = null
  let litersPer100km: number | null = null

  if (odoReading && data.vehicle_id) {
    const { data: prevLog } = await supabase
      .from('fuel_logs')
      .select('odometer_reading')
      .eq('vehicle_id', data.vehicle_id)
      .not('odometer_reading', 'is', null)
      .lt('log_date', data.log_date)
      .order('log_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (prevLog?.odometer_reading && odoReading > Number(prevLog.odometer_reading)) {
      kmSinceLastRefuel = odoReading - Number(prevLog.odometer_reading)
      const eff = computeEfficiency(kmSinceLastRefuel, liters)
      kmPerLiter = eff.kmPerLiter
      litersPer100km = eff.litersPer100km
    }
  }

  // 1. Insert Fuel Log
  const { data: log, error } = await supabase
    .from('fuel_logs')
    .insert({
      vehicle_id: data.vehicle_id,
      booking_id: data.booking_id || null,
      driver_id: data.driver_id || null,
      log_date: data.log_date,
      fuel_type: data.fuel_type || 'diesel',
      liters: liters,
      cost_per_liter: costPerLiter,
      total_cost: totalCost,
      odometer_reading: odoReading,
      is_full_tank: isFullTank,
      km_since_last_refuel: kmSinceLastRefuel,
      km_per_liter: kmPerLiter,
      liters_per_100km: litersPer100km,
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

  // 2. Link to Stage 6 Finance Expenses (Duplicate-cost protection via source_type & source_id)
  try {
    const { data: expense } = await supabase
      .from('expenses')
      .insert({
        category: 'fuel',
        amount: totalCost,
        expense_date: data.log_date,
        description: `Fuel Refill - ${liters}L @ ${costPerLiter} LKR/L (${data.station_name || 'Fuel Station'})`,
        payment_method: 'cash',
        reference_number: data.receipt_number || null,
        receipt_url: data.receipt_url || null,
        source_type: 'fuel_log',
        source_id: log.id,
        created_by: user.id,
      })
      .select()
      .single()

    if (expense?.id) {
      await supabase.from('fuel_logs').update({ expense_id: expense.id }).eq('id', log.id)
    }
  } catch (_) {}

  // 3. Update vehicle odometer & log entry if provided
  if (odoReading && data.vehicle_id) {
    await supabase
      .from('vehicles')
      .update({
        current_mileage: odoReading,
        updated_at: new Date().toISOString(),
      })
      .eq('id', data.vehicle_id)

    await supabase
      .from('vehicle_odometer_logs')
      .insert({
        vehicle_id: data.vehicle_id,
        odometer: odoReading,
        source_type: 'fuel_log',
        source_id: log.id,
        notes: `Fuel log entry — ${data.station_name || 'refueling'} (${liters}L)`,
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
  revalidatePath('/dashboard/expenses')
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

  const liters = Number(data.liters)
  const costPerLiter = Number(data.cost_per_liter)
  const totalCost = liters * costPerLiter
  const odoReading = data.odometer_reading ? Number(data.odometer_reading) : null

  const { data: log } = await supabase.from('fuel_logs').select('expense_id').eq('id', id).single()

  const { error } = await supabase
    .from('fuel_logs')
    .update({
      vehicle_id: data.vehicle_id,
      booking_id: data.booking_id || null,
      driver_id: data.driver_id || null,
      log_date: data.log_date,
      fuel_type: data.fuel_type || 'diesel',
      liters: liters,
      cost_per_liter: costPerLiter,
      total_cost: totalCost,
      odometer_reading: odoReading,
      station_name: data.station_name || null,
      station_location: data.station_location || null,
      receipt_number: data.receipt_number || null,
      notes: data.notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) return { error: error.message }

  // Sync Finance expense if linked
  if (log?.expense_id) {
    try {
      await supabase
        .from('expenses')
        .update({
          amount: totalCost,
          expense_date: data.log_date,
          reference_number: data.receipt_number || null,
        })
        .eq('id', log.expense_id)
    } catch (_) {}
  }

  revalidatePath('/dashboard/fleet/fuel')
  revalidatePath('/dashboard/expenses')
  return { success: true }
}

// =============================================
// DELETE FUEL LOG (WITH CLEANUP)
// =============================================
export async function deleteFuelLogAction(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: log } = await supabase.from('fuel_logs').select('expense_id').eq('id', id).single()

  // Clean linked expense if present
  if (log?.expense_id) {
    try {
      await supabase.from('expenses').delete().eq('id', log.expense_id)
    } catch (_) {}
  }

  const { error } = await supabase.from('fuel_logs').delete().eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/fleet/fuel')
  revalidatePath('/dashboard/expenses')
  return { success: true }
}
