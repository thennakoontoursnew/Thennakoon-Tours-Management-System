import { getColomboTodayString } from '@/lib/utils/colombo-date-utils'

export interface InspectionKPIs {
  totalToday: number
  pending: number
  passed: number
  attentionRequired: number
  damageFound: number
  overdue: number
}

export interface MaintenanceKPIs {
  scheduled: number
  dueSoon: number
  overdue: number
  inProgress: number
  completedThisMonth: number
  totalCostThisMonth: number
}

export async function getInspectionCenterSummary(supabase: any): Promise<InspectionKPIs> {
  const todayStr = getColomboTodayString()

  const { data: inspections } = await supabase
    .from('vehicle_inspections')
    .select('id, inspection_date, overall_condition, status')

  const items = inspections || []

  let totalToday = 0
  let pending = 0
  let passed = 0
  let attentionRequired = 0
  let damageFound = 0
  let overdue = 0

  items.forEach((item: any) => {
    const itemDate = item.inspection_date ? item.inspection_date.slice(0, 10) : ''
    if (itemDate === todayStr) totalToday++

    if (item.status === 'in_progress' || item.status === 'draft') pending++

    if (item.overall_condition === 'pass') passed++
    if (item.overall_condition === 'attention_required') attentionRequired++
    if (item.overall_condition === 'damage_found' || item.overall_condition === 'maintenance_required') damageFound++
  })

  return {
    totalToday,
    pending,
    passed,
    attentionRequired,
    damageFound,
    overdue,
  }
}

export async function getMaintenanceCenterSummary(supabase: any): Promise<MaintenanceKPIs> {
  const todayStr = getColomboTodayString()
  const currentMonthPrefix = todayStr.slice(0, 7)

  const { data: tasks } = await supabase
    .from('maintenance_tasks')
    .select('id, status, scheduled_date, completion_date, total_cost')

  const items = tasks || []

  let scheduled = 0
  let dueSoon = 0
  let overdue = 0
  let inProgress = 0
  let completedThisMonth = 0
  let totalCostThisMonth = 0

  items.forEach((task: any) => {
    if (task.status === 'scheduled') scheduled++
    if (task.status === 'in_progress') inProgress++

    if (task.scheduled_date && task.status !== 'completed' && task.status !== 'cancelled') {
      if (task.scheduled_date < todayStr) overdue++
      else if (task.scheduled_date <= new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10)) dueSoon++
    }

    if (task.status === 'completed' && task.completion_date && task.completion_date.startsWith(currentMonthPrefix)) {
      completedThisMonth++
      totalCostThisMonth += Number(task.total_cost || 0)
    }
  })

  return {
    scheduled,
    dueSoon,
    overdue,
    inProgress,
    completedThisMonth,
    totalCostThisMonth,
  }
}
