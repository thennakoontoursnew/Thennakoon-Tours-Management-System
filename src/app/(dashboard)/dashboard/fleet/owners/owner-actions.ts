'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// =============================================
// CREATE VEHICLE OWNER
// =============================================
export async function createVehicleOwnerAction(data: any) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Generate owner number
  const { data: ownerNum } = await supabase.rpc('generate_next_owner_number')

  const { data: owner, error } = await supabase
    .from('vehicle_owners')
    .insert({
      owner_number: ownerNum,
      full_name: data.full_name,
      company_name: data.company_name || null,
      owner_type: data.owner_type || 'individual',
      national_id: data.national_id || null,
      mobile: data.mobile || null,
      whatsapp: data.whatsapp || null,
      email: data.email || null,
      address: data.address || null,
      bank_name: data.bank_name || null,
      bank_account_number: data.bank_account_number || null,
      bank_branch: data.bank_branch || null,
      revenue_share_pct: data.revenue_share_pct ? Number(data.revenue_share_pct) : 0,
      flat_rate_per_day: data.flat_rate_per_day ? Number(data.flat_rate_per_day) : null,
      payment_terms: data.payment_terms || 'monthly',
      notes: data.notes || null,
      is_active: true,
    })
    .select()
    .single()

  if (error) return { error: error.message }

  // Audit log (best-effort)
  try {
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'CREATE',
      table_name: 'vehicle_owners',
      record_id: owner.id,
      new_values: owner,
    })
  } catch (_) {}

  revalidatePath('/dashboard/fleet/owners')
  return { success: true, owner }
}

// =============================================
// UPDATE VEHICLE OWNER
// =============================================
export async function updateVehicleOwnerAction(id: string, data: any) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: old } = await supabase.from('vehicle_owners').select().eq('id', id).single()

  const { error } = await supabase
    .from('vehicle_owners')
    .update({
      full_name: data.full_name,
      company_name: data.company_name || null,
      owner_type: data.owner_type || 'individual',
      national_id: data.national_id || null,
      mobile: data.mobile || null,
      whatsapp: data.whatsapp || null,
      email: data.email || null,
      address: data.address || null,
      bank_name: data.bank_name || null,
      bank_account_number: data.bank_account_number || null,
      bank_branch: data.bank_branch || null,
      revenue_share_pct: data.revenue_share_pct ? Number(data.revenue_share_pct) : 0,
      flat_rate_per_day: data.flat_rate_per_day ? Number(data.flat_rate_per_day) : null,
      payment_terms: data.payment_terms || 'monthly',
      notes: data.notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) return { error: error.message }

  // Audit log (best-effort)
  try {
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'UPDATE',
      table_name: 'vehicle_owners',
      record_id: id,
      old_values: old,
      new_values: data,
    })
  } catch (_) {}

  revalidatePath('/dashboard/fleet/owners')
  return { success: true }
}

// =============================================
// DEACTIVATE/REACTIVATE VEHICLE OWNER
// =============================================
export async function toggleVehicleOwnerStatusAction(id: string, isActive: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('vehicle_owners')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/fleet/owners')
  return { success: true }
}

// =============================================
// ASSIGN OWNER TO VEHICLE
// =============================================
export async function assignOwnerToVehicleAction(vehicleId: string, ownerId: string | null, revenueSharePct?: number, flatRatePerDay?: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('vehicles')
    .update({
      vehicle_owner_id: ownerId,
      owner_revenue_share_pct: revenueSharePct ? Number(revenueSharePct) : null,
      owner_flat_rate_per_day: flatRatePerDay ? Number(flatRatePerDay) : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', vehicleId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/fleet/owners')
  revalidatePath(`/dashboard/vehicles/${vehicleId}`)
  return { success: true }
}

// =============================================
// CREATE OWNER PAYOUT
// =============================================
export async function createOwnerPayoutAction(data: any) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: payoutNum } = await supabase.rpc('generate_next_payout_number')

  const netPayout = Number(data.owner_share_amount || 0) - Number(data.deductions || 0)

  const { data: payout, error } = await supabase
    .from('owner_payouts')
    .insert({
      vehicle_owner_id: data.vehicle_owner_id,
      vehicle_id: data.vehicle_id || null,
      payout_number: payoutNum,
      period_start: data.period_start,
      period_end: data.period_end,
      gross_revenue: Number(data.gross_revenue || 0),
      owner_share_amount: Number(data.owner_share_amount || 0),
      deductions: Number(data.deductions || 0),
      net_payout: netPayout,
      status: data.status || 'pending',
      payment_date: data.payment_date || null,
      payment_reference: data.payment_reference || null,
      notes: data.notes || null,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath('/dashboard/fleet/owners')
  return { success: true, payout }
}

// =============================================
// UPDATE PAYOUT STATUS
// =============================================
export async function updatePayoutStatusAction(payoutId: string, status: string, paymentDate?: string, paymentReference?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('owner_payouts')
    .update({
      status,
      payment_date: paymentDate || null,
      payment_reference: paymentReference || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', payoutId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/fleet/owners')
  return { success: true }
}
