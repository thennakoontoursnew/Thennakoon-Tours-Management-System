'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createVehicleInspectionAction(inspectionData: any) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const inspNum = `INS-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`

  const { data: inspection, error } = await supabase
    .from('vehicle_inspections')
    .insert({
      inspection_number: inspNum,
      vehicle_id: inspectionData.vehicle_id,
      booking_id: inspectionData.booking_id || null,
      inspector_id: user?.id || null,
      inspection_type: inspectionData.inspection_type || 'general',
      inspection_date: new Date().toISOString(),
      odometer_reading: inspectionData.odometer_reading || null,
      fuel_level_percent: inspectionData.fuel_level_percent || null,
      overall_condition: inspectionData.overall_condition || 'pass',
      status: 'completed',
      checklist_data: inspectionData.checklist_data || {},
      general_notes: inspectionData.general_notes || null,
      created_by: user?.id || null,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to record inspection: ${error.message}`)
  }

  // Update vehicle mileage if odometer_reading is higher
  if (inspectionData.odometer_reading && inspectionData.vehicle_id) {
    const { data: vehicle } = await supabase.from('vehicles').select('current_mileage').eq('id', inspectionData.vehicle_id).single()
    if (vehicle && Number(inspectionData.odometer_reading) > Number(vehicle.current_mileage || 0)) {
      await supabase.from('vehicles').update({ current_mileage: inspectionData.odometer_reading }).eq('id', inspectionData.vehicle_id)
      await supabase.from('vehicle_odometer_logs').insert({
        vehicle_id: inspectionData.vehicle_id,
        odometer_reading: inspectionData.odometer_reading,
        source: 'inspection',
        recorded_by: user?.id || null,
      })
    }
  }

  // If inspection condition requires maintenance, automatically block vehicle if critical
  if (['damage_found', 'maintenance_required'].includes(inspectionData.overall_condition)) {
    await supabase.from('vehicles').update({ status: 'maintenance' }).eq('id', inspectionData.vehicle_id)
  }

  // Audit Log
  await supabase.from('document_activity_logs').insert({
    document_type: 'vehicle',
    document_id: inspectionData.vehicle_id,
    action: 'INSPECTION_COMPLETED',
    change_summary: `Completed ${inspectionData.inspection_type} inspection (${inspNum}): Condition ${inspectionData.overall_condition}`,
    user_id: user?.id || null,
  })

  revalidatePath('/dashboard/maintenance/inspections')
  revalidatePath('/dashboard/maintenance')
  revalidatePath(`/dashboard/vehicles/${inspectionData.vehicle_id}`)
  return { success: true, inspection_id: inspection.id }
}

export async function createMaintenanceTaskAction(taskData: any) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const taskNum = `MNT-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`

  const { data: task, error } = await supabase
    .from('maintenance_tasks')
    .insert({
      task_number: taskNum,
      vehicle_id: taskData.vehicle_id,
      inspection_id: taskData.inspection_id || null,
      damage_id: taskData.damage_id || null,
      booking_id: taskData.booking_id || null,
      task_type: taskData.task_type || 'routine_service',
      title: taskData.title,
      description: taskData.description || null,
      priority: taskData.priority || 'normal',
      status: 'scheduled',
      scheduled_date: taskData.scheduled_date || new Date().toISOString().slice(0, 10),
      scheduled_mileage: taskData.scheduled_mileage || null,
      provider_name: taskData.provider_name || null,
      created_by: user?.id || null,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to schedule maintenance task: ${error.message}`)
  }

  // Lock vehicle to maintenance status
  await supabase.from('vehicles').update({ status: 'maintenance' }).eq('id', taskData.vehicle_id)

  // Audit Log
  await supabase.from('document_activity_logs').insert({
    document_type: 'vehicle',
    document_id: taskData.vehicle_id,
    action: 'MAINTENANCE_SCHEDULED',
    change_summary: `Scheduled maintenance task ${taskNum}: ${taskData.title}`,
    user_id: user?.id || null,
  })

  revalidatePath('/dashboard/maintenance')
  revalidatePath(`/dashboard/vehicles/${taskData.vehicle_id}`)
  return { success: true, task_id: task.id }
}

export async function completeMaintenanceTaskAction(taskId: string, completionData: any) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: task } = await supabase.from('maintenance_tasks').select('*, vehicle:vehicles(id)').eq('id', taskId).single()
  if (!task) throw new Error('Task not found.')

  const labour = Number(completionData.labour_cost || 0)
  const parts = Number(completionData.parts_cost || 0)
  const other = Number(completionData.other_cost || 0)
  const totalCost = labour + parts + other

  // Update task to completed
  await supabase
    .from('maintenance_tasks')
    .update({
      status: 'completed',
      completion_date: new Date().toISOString().slice(0, 10),
      completed_mileage: completionData.completed_mileage || null,
      labour_cost: labour,
      parts_cost: parts,
      other_cost: other,
      total_cost: totalCost,
      invoice_reference: completionData.invoice_reference || null,
      notes: completionData.notes || null,
      next_service_date: completionData.next_service_date || null,
      next_service_mileage: completionData.next_service_mileage || null,
    })
    .eq('id', taskId)

  // Update vehicle mileage if completed_mileage provided
  if (completionData.completed_mileage) {
    await supabase.from('vehicles').update({ current_mileage: completionData.completed_mileage }).eq('id', task.vehicle_id)
  }

  // Restore vehicle status to available if no other active maintenance tasks
  const { data: activeTasks } = await supabase
    .from('maintenance_tasks')
    .select('id')
    .eq('vehicle_id', task.vehicle_id)
    .in('status', ['scheduled', 'in_progress'])
    .neq('id', taskId)

  if (!activeTasks || activeTasks.length === 0) {
    await supabase.from('vehicles').update({ status: 'available' }).eq('id', task.vehicle_id)
  }

  // Optionally create expense record in Stage 6 Finance
  if (completionData.create_expense && totalCost > 0) {
    const expNum = `EXP-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`
    const { data: expense } = await supabase
      .from('expenses')
      .insert({
        expense_number: expNum,
        expense_date: new Date().toISOString().slice(0, 10),
        category: 'maintenance',
        description: `Maintenance repair: ${task.title} (${task.task_number})`,
        amount: totalCost,
        payment_method: 'cash',
        supplier_name: task.provider_name || 'Service Garage',
        reference_number: completionData.invoice_reference || null,
        vehicle_id: task.vehicle_id,
        status: 'approved',
        created_by: user?.id || null,
      })
      .select()
      .single()

    if (expense) {
      await supabase.from('maintenance_tasks').update({ expense_id: expense.id }).eq('id', taskId)
    }
  }

  revalidatePath('/dashboard/maintenance')
  revalidatePath('/dashboard/expenses')
  revalidatePath(`/dashboard/vehicles/${task.vehicle_id}`)
  return { success: true }
}
