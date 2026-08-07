import { getColomboTodayString } from '@/lib/utils/colombo-date-utils'

export interface ReminderKPIs {
  dueToday: number
  overdue: number
  upcoming: number
  completed: number
  dismissed: number
  critical: number
}

export async function getReminderCenterSummary(supabase: any): Promise<ReminderKPIs> {
  const todayStr = getColomboTodayString()

  const { data: reminders } = await supabase
    .from('reminders')
    .select('id, due_at, status, priority')

  const items = reminders || []

  let dueToday = 0
  let overdue = 0
  let upcoming = 0
  let completed = 0
  let dismissed = 0
  let critical = 0

  items.forEach((r: any) => {
    const dueDay = r.due_at ? r.due_at.slice(0, 10) : ''

    if (r.status === 'completed') completed++
    else if (r.status === 'dismissed') dismissed++
    else {
      if (r.priority === 'critical') critical++

      if (dueDay === todayStr) dueToday++
      else if (dueDay < todayStr) overdue++
      else upcoming++
    }
  })

  return {
    dueToday,
    overdue,
    upcoming,
    completed,
    dismissed,
    critical,
  }
}

export async function syncSystemReminders(supabase: any) {
  const todayStr = getColomboTodayString()

  // 1. Invoice Overdue Reminders
  const { data: overdueInvoices } = await supabase
    .from('invoices')
    .select('id, invoice_number, grand_total, balance_due, due_date, customer:customers(full_name)')
    .gt('balance_due', 0)
    .lt('due_date', todayStr)
    .neq('status', 'cancelled')

  if (overdueInvoices) {
    for (const inv of overdueInvoices) {
      const dedupeKey = `invoice_overdue:${inv.id}`
      await supabase.from('reminders').upsert(
        {
          reminder_number: `REM-INV-${inv.invoice_number}`,
          reminder_type: 'invoice_overdue',
          entity_type: 'invoice',
          entity_id: inv.id,
          title: `Invoice Overdue: ${inv.invoice_number}`,
          message: `Customer ${inv.customer?.full_name || 'Customer'} has an overdue balance of LKR ${Number(inv.balance_due).toLocaleString()} (Due: ${inv.due_date})`,
          priority: 'critical',
          due_at: `${inv.due_date}T00:00:00.000Z`,
          status: 'overdue',
          source: 'system',
          dedupe_key: dedupeKey,
        },
        { onConflict: 'dedupe_key' }
      )
    }
  }

  // 2. CRM Lead Follow-up Reminders
  const { data: leadFollowups } = await supabase
    .from('crm_leads')
    .select('id, lead_number, customer_name, follow_up_date, status')
    .not('follow_up_date', 'is', null)
    .in('status', ['new', 'contacted', 'quoted'])

  if (leadFollowups) {
    for (const lead of leadFollowups) {
      const dedupeKey = `lead_followup:${lead.id}`
      const isOverdue = lead.follow_up_date < todayStr
      await supabase.from('reminders').upsert(
        {
          reminder_number: `REM-LEAD-${lead.lead_number}`,
          reminder_type: 'lead_followup',
          entity_type: 'lead',
          entity_id: lead.id,
          title: `Lead Follow-up: ${lead.lead_number} (${lead.customer_name})`,
          message: `Scheduled follow-up for enquiry ${lead.lead_number}.`,
          priority: isOverdue ? 'high' : 'normal',
          due_at: `${lead.follow_up_date}T09:00:00.000Z`,
          status: isOverdue ? 'overdue' : 'pending',
          source: 'system',
          dedupe_key: dedupeKey,
        },
        { onConflict: 'dedupe_key' }
      )
    }
  }

  // 3. Stage 11: Owner Settlement Payout Reminders
  const { data: pendingPayouts } = await supabase
    .from('owner_payouts')
    .select('id, payout_number, period_end, net_payout, owner:vehicle_owners(full_name)')
    .in('status', ['pending', 'approved'])
    .gt('net_payout', 0)

  if (pendingPayouts) {
    for (const payout of pendingPayouts) {
      const dedupeKey = `owner_payout_due:${payout.id}`
      const isOverdue = payout.period_end < todayStr
      await supabase.from('reminders').upsert(
        {
          reminder_number: `REM-SET-${payout.payout_number}`,
          reminder_type: 'owner_payout_due',
          entity_type: 'owner_payout',
          entity_id: payout.id,
          title: `Owner Payout Due: ${payout.payout_number}`,
          message: `Pending payout of LKR ${Number(payout.net_payout).toLocaleString()} for owner ${payout.owner?.full_name || 'Partner'}.`,
          priority: isOverdue ? 'high' : 'normal',
          due_at: `${payout.period_end}T00:00:00.000Z`,
          status: isOverdue ? 'overdue' : 'pending',
          source: 'system',
          dedupe_key: dedupeKey,
        },
        { onConflict: 'dedupe_key' }
      )
    }
  }

  // 4. Stage 11: Fuel Efficiency Anomaly Reminders
  const { data: lowEfficiencyLogs } = await supabase
    .from('fuel_logs')
    .select('id, log_date, km_per_liter, vehicle:vehicles(vehicle_name, registration_number)')
    .not('km_per_liter', 'is', null)
    .lt('km_per_liter', 5)
    .gte('log_date', `${todayStr.slice(0, 7)}-01`)
    .limit(20)

  if (lowEfficiencyLogs) {
    for (const fuelLog of lowEfficiencyLogs) {
      const dedupeKey = `fuel_efficiency_alert:${fuelLog.id}`
      await supabase.from('reminders').upsert(
        {
          reminder_number: `REM-FUEL-${fuelLog.id.slice(0, 8)}`,
          reminder_type: 'fuel_efficiency_alert',
          entity_type: 'fuel_log',
          entity_id: fuelLog.id,
          title: `Fuel Efficiency Anomaly: ${fuelLog.vehicle?.vehicle_name || 'Vehicle'}`,
          message: `Low efficiency detected (${fuelLog.km_per_liter} KM/L) on ${fuelLog.log_date} for ${fuelLog.vehicle?.registration_number || 'vehicle'}.`,
          priority: 'high',
          due_at: `${fuelLog.log_date}T00:00:00.000Z`,
          status: 'pending',
          source: 'system',
          dedupe_key: dedupeKey,
        },
        { onConflict: 'dedupe_key' }
      )
    }
  }

  return { success: true }
}
