'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Helper for standard owner numbers (OWN-YYYY-XXXXXX with VNO-XXXX fallback)
async function getNextOwnerNumber(supabase: any) {
  try {
    const { data } = await supabase.rpc('generate_next_owner_number_v2')
    if (data) return data
  } catch (_) {}
  const { data } = await supabase.rpc('generate_next_owner_number')
  return data || `OWN-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`
}

// Helper for standard settlement numbers (SET-YYYY-XXXXXX with OPY-XXXX fallback)
async function getNextSettlementNumber(supabase: any) {
  try {
    const { data } = await supabase.rpc('generate_next_settlement_number_v2')
    if (data) return data
  } catch (_) {}
  const { data } = await supabase.rpc('generate_next_payout_number')
  return data || `SET-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`
}

// Helper for statement numbers (STM-YYYY-XXXXXX)
async function getNextStatementNumber(supabase: any) {
  try {
    const { data } = await supabase.rpc('generate_next_statement_number')
    if (data) return data
  } catch (_) {}
  return `STM-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`
}

// =============================================
// CREATE VEHICLE OWNER
// =============================================
export async function createVehicleOwnerAction(data: any) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const ownerNum = await getNextOwnerNumber(supabase)

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
      settlement_rule: data.settlement_rule || 'percentage',
      revenue_share_pct: data.revenue_share_pct ? Number(data.revenue_share_pct) : 0,
      flat_rate_per_day: data.flat_rate_per_day ? Number(data.flat_rate_per_day) : null,
      payment_terms: data.payment_terms || 'monthly',
      notes: data.notes || null,
      is_active: true,
    })
    .select()
    .single()

  if (error) return { error: error.message }

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
      settlement_rule: data.settlement_rule || old?.settlement_rule || 'percentage',
      revenue_share_pct: data.revenue_share_pct ? Number(data.revenue_share_pct) : 0,
      flat_rate_per_day: data.flat_rate_per_day ? Number(data.flat_rate_per_day) : null,
      payment_terms: data.payment_terms || 'monthly',
      notes: data.notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) return { error: error.message }

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
// CREATE OWNER PAYOUT (WITH FINANCE EXPENSE INTEGRATION)
// =============================================
export async function createOwnerPayoutAction(data: any) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const payoutNum = await getNextSettlementNumber(supabase)

  const grossRevenue = Number(data.gross_revenue || 0)
  const ownerShareAmount = Number(data.owner_share_amount || 0)
  const deductions = Number(data.deductions || 0)
  const netPayout = ownerShareAmount - deductions
  const amountPaid = Number(data.amount_paid || (data.status === 'paid' ? netPayout : 0))
  const outstandingBalance = Math.max(0, netPayout - amountPaid)

  // 1. Create Payout record
  const { data: payout, error } = await supabase
    .from('owner_payouts')
    .insert({
      vehicle_owner_id: data.vehicle_owner_id,
      vehicle_id: data.vehicle_id || null,
      payout_number: payoutNum,
      period_start: data.period_start,
      period_end: data.period_end,
      gross_revenue: grossRevenue,
      owner_share_amount: ownerShareAmount,
      deductions: deductions,
      net_payout: netPayout,
      amount_paid: amountPaid,
      outstanding_balance: outstandingBalance,
      settlement_rule: data.settlement_rule || 'percentage',
      revenue_share_pct: data.revenue_share_pct ? Number(data.revenue_share_pct) : null,
      flat_rate_per_day: data.flat_rate_per_day ? Number(data.flat_rate_per_day) : null,
      status: data.status || 'pending',
      payment_date: data.payment_date || null,
      payment_reference: data.payment_reference || null,
      notes: data.notes || null,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) return { error: error.message }

  // 2. Link to Stage 6 Finance Expenses if paid/approved (Duplicate-cost protection via source_type & source_id)
  if (['approved', 'paid'].includes(payout.status) && amountPaid > 0) {
    try {
      const { data: expense } = await supabase
        .from('expenses')
        .insert({
          category: 'owner_payout',
          amount: amountPaid,
          expense_date: data.payment_date || data.period_end || new Date().toISOString().slice(0, 10),
          description: `Owner Settlement ${payoutNum} (${data.period_start} to ${data.period_end})`,
          payment_method: 'bank_transfer',
          reference_number: data.payment_reference || payoutNum,
          source_type: 'owner_payout',
          source_id: payout.id,
          created_by: user.id,
        })
        .select()
        .single()

      if (expense?.id) {
        await supabase.from('owner_payouts').update({ expense_id: expense.id }).eq('id', payout.id)
      }
    } catch (_) {}
  }

  revalidatePath('/dashboard/fleet/owners')
  revalidatePath('/dashboard/expenses')
  return { success: true, payout }
}

// =============================================
// UPDATE PAYOUT STATUS & BALANCE
// =============================================
export async function updatePayoutStatusAction(payoutId: string, status: string, paymentDate?: string, paymentReference?: string, amountPaidInput?: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: payout } = await supabase.from('owner_payouts').select('*').eq('id', payoutId).single()
  if (!payout) return { error: 'Payout not found' }

  const netPayout = Number(payout.net_payout || 0)
  const amountPaid = amountPaidInput !== undefined ? Number(amountPaidInput) : (status === 'paid' ? netPayout : Number(payout.amount_paid || 0))
  const outstandingBalance = Math.max(0, netPayout - amountPaid)

  const { error } = await supabase
    .from('owner_payouts')
    .update({
      status,
      payment_date: paymentDate || payout.payment_date || null,
      payment_reference: paymentReference || payout.payment_reference || null,
      amount_paid: amountPaid,
      outstanding_balance: outstandingBalance,
      updated_at: new Date().toISOString(),
    })
    .eq('id', payoutId)

  if (error) return { error: error.message }

  // Sync / Create Stage 6 Finance Expense if paid
  if (status === 'paid' && amountPaid > 0) {
    try {
      if (payout.expense_id) {
        await supabase
          .from('expenses')
          .update({
            amount: amountPaid,
            expense_date: paymentDate || new Date().toISOString().slice(0, 10),
            reference_number: paymentReference || payout.payout_number,
          })
          .eq('id', payout.expense_id)
      } else {
        const { data: expense } = await supabase
          .from('expenses')
          .insert({
            category: 'owner_payout',
            amount: amountPaid,
            expense_date: paymentDate || new Date().toISOString().slice(0, 10),
            description: `Owner Settlement ${payout.payout_number}`,
            payment_method: 'bank_transfer',
            reference_number: paymentReference || payout.payout_number,
            source_type: 'owner_payout',
            source_id: payout.id,
            created_by: user.id,
          })
          .select()
          .single()

        if (expense?.id) {
          await supabase.from('owner_payouts').update({ expense_id: expense.id }).eq('id', payoutId)
        }
      }
    } catch (_) {}
  }

  revalidatePath('/dashboard/fleet/owners')
  revalidatePath('/dashboard/expenses')
  return { success: true }
}

// =============================================
// CREATE OWNER STATEMENT
// =============================================
export async function createOwnerStatementAction(data: any) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const stmNum = await getNextStatementNumber(supabase)

  const openingBalance = Number(data.opening_balance || 0)
  const earnings = Number(data.earnings || 0)
  const adjustments = Number(data.adjustments || 0)
  const deductions = Number(data.deductions || 0)
  const payments = Number(data.payments || 0)
  const closingBalance = openingBalance + earnings + adjustments - deductions - payments

  const { data: statement, error } = await supabase
    .from('owner_statements')
    .insert({
      statement_number: stmNum,
      vehicle_owner_id: data.vehicle_owner_id,
      statement_date: data.statement_date || new Date().toISOString().slice(0, 10),
      period_start: data.period_start,
      period_end: data.period_end,
      opening_balance: openingBalance,
      earnings: earnings,
      adjustments: adjustments,
      deductions: deductions,
      payments: payments,
      closing_balance: closingBalance,
      status: data.status || 'draft',
      notes: data.notes || null,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath('/dashboard/fleet/owners')
  return { success: true, statement }
}
