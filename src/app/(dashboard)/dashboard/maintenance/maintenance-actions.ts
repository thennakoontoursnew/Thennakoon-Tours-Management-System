'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function createVehicleInspectionAction(inspectionData: any) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const inspNum = `INS-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`

  // Fetch current vehicle record to check pre-inspection status
  const { data: currentVehicle } = await supabase
    .from('vehicles')
    .select('id, status, current_mileage, registration_number')
    .eq('id', inspectionData.vehicle_id)
    .single()

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

  // Update vehicle mileage if odometer_reading is provided & higher
  if (inspectionData.odometer_reading && inspectionData.vehicle_id) {
    const curMile = Number(currentVehicle?.current_mileage || 0)
    if (Number(inspectionData.odometer_reading) > curMile) {
      await supabase.from('vehicles').update({ current_mileage: inspectionData.odometer_reading }).eq('id', inspectionData.vehicle_id)
      await supabase.from('vehicle_odometer_logs').insert({
        vehicle_id: inspectionData.vehicle_id,
        odometer_reading: inspectionData.odometer_reading,
        source: 'inspection',
        recorded_by: user?.id || null,
      })
    }
  }

  // STATUS TRANSITION LOGIC FOR PENDING / RE-INSPECTED ONBOARDING VEHICLES
  const preStatus = currentVehicle?.status
  if (preStatus === 'pending_inspection' || preStatus === 'inspection_failed') {
    if (inspectionData.overall_condition === 'pass') {
      await supabase.from('vehicles').update({ status: 'pending_management_approval' }).eq('id', inspectionData.vehicle_id)
    } else if (['fail', 'damage_found', 'maintenance_required'].includes(inspectionData.overall_condition)) {
      await supabase.from('vehicles').update({ status: 'inspection_failed' }).eq('id', inspectionData.vehicle_id)
    }
  } else if (['damage_found', 'maintenance_required'].includes(inspectionData.overall_condition)) {
    // Standard vehicle critical damage -> maintenance lock
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

  revalidatePath('/dashboard/fleet')
  revalidatePath('/dashboard/vehicles')
  revalidatePath('/dashboard/maintenance/inspections')
  revalidatePath('/dashboard/maintenance')
  revalidatePath(`/dashboard/vehicles/${inspectionData.vehicle_id}`)
  return { success: true, inspection_id: inspection.id }
}

export async function reconcilePendingOnboardingVehiclesAction() {
  const supabase = await createClient()

  // Find all vehicles in pending_inspection or inspection_failed
  const { data: pendingVehicles } = await supabase
    .from('vehicles')
    .select('id, registration_number, status')
    .in('status', ['pending_inspection', 'inspection_failed'])
    .eq('is_archived', false)

  if (!pendingVehicles || pendingVehicles.length === 0) return { reconciledCount: 0 }

  let reconciledCount = 0

  for (const v of pendingVehicles) {
    const { data: latestInsp } = await supabase
      .from('vehicle_inspections')
      .select('id, overall_condition')
      .eq('vehicle_id', v.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (latestInsp) {
      if (latestInsp.overall_condition === 'pass') {
        await supabase
          .from('vehicles')
          .update({ status: 'pending_management_approval' })
          .eq('id', v.id)
        reconciledCount++
      } else if (['fail', 'damage_found', 'maintenance_required'].includes(latestInsp.overall_condition)) {
        await supabase
          .from('vehicles')
          .update({ status: 'inspection_failed' })
          .eq('id', v.id)
      }
    }
  }

  if (reconciledCount > 0) {
    revalidatePath('/dashboard/fleet')
    revalidatePath('/dashboard/vehicles')
    revalidatePath('/dashboard/maintenance/inspections')
    revalidatePath('/dashboard/maintenance')
  }

  return { reconciledCount }
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

export interface OnboardingInspectionInput {
  registration_number: string
  vehicle_name: string
  brand?: string
  model?: string
  manufacture_year?: number
  category_id: string
  transmission?: 'automatic' | 'manual' | 'semi_automatic'
  fuel_type?: 'petrol' | 'diesel' | 'hybrid' | 'electric' | 'plug_in_hybrid'
  daily_rate?: number
  colour?: string
  owner_contact_name?: string
  owner_contact_phone?: string
  agreed_payout_rate?: number
  insurance_expiry?: string
  revenue_license_expiry?: string

  inspection_type?: string
  odometer_reading?: number
  fuel_level_percent?: number
  overall_condition: 'pass' | 'fail' | 'conditional' | 'attention_required' | 'damage_found' | 'maintenance_required'
  general_notes?: string
}

export async function recordVehicleOnboardingInspectionAction(onboardingData: OnboardingInspectionInput) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const regNorm = onboardingData.registration_number.toUpperCase().trim()

  // 1. Check for Duplicate Registration Number
  const { data: existing } = await supabase
    .from('vehicles')
    .select('id')
    .ilike('registration_number', regNorm)
    .maybeSingle()

  if (existing) {
    throw new Error(`A vehicle with registration number "${regNorm}" already exists.`)
  }

  // 2. Owner Auto-Sync Pipeline into vehicle_owners table
  let linkedOwnerId: string | null = null
  const ownerName = onboardingData.owner_contact_name?.trim()
  const ownerPhone = onboardingData.owner_contact_phone?.trim()

  if (ownerName || ownerPhone) {
    const normPhone = ownerPhone ? ownerPhone.replace(/[^\d+]/g, '') : ''

    // Query vehicle_owners by phone or name
    let existingOwner: any = null
    if (normPhone) {
      const { data: byPhone } = await supabase
        .from('vehicle_owners')
        .select('id')
        .or(`mobile.ilike.%${normPhone}%,whatsapp.ilike.%${normPhone}%`)
        .maybeSingle()
      existingOwner = byPhone
    }

    if (!existingOwner && ownerName) {
      const { data: byName } = await supabase
        .from('vehicle_owners')
        .select('id')
        .ilike('full_name', ownerName)
        .maybeSingle()
      existingOwner = byName
    }

    if (existingOwner) {
      linkedOwnerId = existingOwner.id
    } else {
      // Create new vehicle owner entry in vehicle_owners table
      const ownerNum = `OWN-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`
      const { data: newOwner } = await supabase
        .from('vehicle_owners')
        .insert({
          owner_number: ownerNum,
          full_name: ownerName || 'Partner Owner',
          mobile: ownerPhone || null,
          whatsapp: ownerPhone || null,
          owner_type: 'individual',
          is_active: true,
          notes: 'Auto-enrolled during vehicle onboarding pipeline',
          created_by: user?.id || null,
        })
        .select('id')
        .single()

      if (newOwner) {
        linkedOwnerId = newOwner.id
      }
    }
  }

  // 3. Insert new vehicle record with status 'pending_inspection'
  const vCode = `TT-V-${Math.floor(10000 + Math.random() * 90000)}`
  const brandName = onboardingData.brand?.trim() || onboardingData.vehicle_name.split(' ')[0] || 'Unknown'
  const modelName = onboardingData.model?.trim() || onboardingData.vehicle_name.split(' ').slice(1).join(' ') || 'Standard'

  const { data: newVehicle, error: vError } = await supabase
    .from('vehicles')
    .insert({
      vehicle_code: vCode,
      registration_number: regNorm,
      vehicle_name: onboardingData.vehicle_name.trim(),
      brand: brandName,
      model: modelName,
      manufacture_year: onboardingData.manufacture_year || new Date().getFullYear(),
      category_id: onboardingData.category_id,
      transmission: onboardingData.transmission || 'automatic',
      fuel_type: onboardingData.fuel_type || 'petrol',
      current_mileage: onboardingData.odometer_reading || 0,
      daily_rate: onboardingData.daily_rate || 10000,
      colour: onboardingData.colour?.trim() || null,
      vehicle_owner_id: linkedOwnerId,
      owner_contact_name: ownerName || null,
      owner_contact_phone: ownerPhone || null,
      agreed_payout_rate: onboardingData.agreed_payout_rate || null,
      insurance_expiry: onboardingData.insurance_expiry || null,
      revenue_license_expiry: onboardingData.revenue_license_expiry || null,
      holding_type: 'owner_held',
      owner_agreement_status: 'pending_dispatch',
      status: 'pending_inspection',
      is_archived: false,
      created_by: user?.id || null,
      updated_by: user?.id || null,
    })
    .select()
    .single()

  if (vError || !newVehicle) {
    throw new Error(`Failed to create onboarding vehicle record: ${vError?.message || 'Unknown error'}`)
  }

  // 4. Register Reminders for Insurance & Revenue License Expiry
  const todayStr = new Date().toISOString().slice(0, 10)

  if (onboardingData.insurance_expiry) {
    const isOverdue = onboardingData.insurance_expiry < todayStr
    await supabase.from('reminders').upsert(
      {
        reminder_number: `REM-INS-${vCode}`,
        reminder_type: 'vehicle_insurance_expiry',
        entity_type: 'vehicle',
        entity_id: newVehicle.id,
        title: `Insurance Expiry: ${regNorm}`,
        message: `Insurance for ${newVehicle.vehicle_name} (${regNorm}) expires on ${onboardingData.insurance_expiry}.`,
        priority: isOverdue ? 'critical' : 'high',
        due_at: `${onboardingData.insurance_expiry}T00:00:00.000Z`,
        status: isOverdue ? 'overdue' : 'pending',
        source: 'system',
        dedupe_key: `vehicle_insurance_expiry:${newVehicle.id}`,
      },
      { onConflict: 'dedupe_key' }
    )
  }

  if (onboardingData.revenue_license_expiry) {
    const isOverdue = onboardingData.revenue_license_expiry < todayStr
    await supabase.from('reminders').upsert(
      {
        reminder_number: `REM-LIC-${vCode}`,
        reminder_type: 'vehicle_revenue_license_expiry',
        entity_type: 'vehicle',
        entity_id: newVehicle.id,
        title: `Revenue License Expiry: ${regNorm}`,
        message: `Revenue license for ${newVehicle.vehicle_name} (${regNorm}) expires on ${onboardingData.revenue_license_expiry}.`,
        priority: isOverdue ? 'critical' : 'high',
        due_at: `${onboardingData.revenue_license_expiry}T00:00:00.000Z`,
        status: isOverdue ? 'overdue' : 'pending',
        source: 'system',
        dedupe_key: `vehicle_license_expiry:${newVehicle.id}`,
      },
      { onConflict: 'dedupe_key' }
    )
  }

  // 3. Record inspection entry in vehicle_inspections
  const inspNum = `INS-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`

  const { data: inspection, error: inspErr } = await supabase
    .from('vehicle_inspections')
    .insert({
      inspection_number: inspNum,
      vehicle_id: newVehicle.id,
      inspector_id: user?.id || null,
      inspection_type: onboardingData.inspection_type || 'pre_onboarding',
      inspection_date: new Date().toISOString(),
      odometer_reading: onboardingData.odometer_reading || null,
      fuel_level_percent: onboardingData.fuel_level_percent || null,
      overall_condition: onboardingData.overall_condition,
      status: 'completed',
      checklist_data: {},
      general_notes: onboardingData.general_notes || 'Pre-Fleet Onboarding Audit',
      created_by: user?.id || null,
    })
    .select()
    .single()

  if (inspErr) {
    throw new Error(`Failed to record onboarding inspection: ${inspErr.message}`)
  }

  // 4. Update vehicle status based on inspection overall result:
  // Technical Inspection PASS -> Vehicle enters 'pending_management_approval'
  // Technical Inspection FAIL -> Vehicle enters 'inspection_failed'
  let finalStatus: string = 'pending_inspection'
  if (onboardingData.overall_condition === 'pass') {
    finalStatus = 'pending_management_approval'
  } else if (['fail', 'damage_found', 'maintenance_required'].includes(onboardingData.overall_condition)) {
    finalStatus = 'inspection_failed'
  } else {
    finalStatus = 'pending_management_approval'
  }

  await supabase
    .from('vehicles')
    .update({ status: finalStatus, current_mileage: onboardingData.odometer_reading || 0 })
    .eq('id', newVehicle.id)

  if (onboardingData.odometer_reading && onboardingData.odometer_reading > 0) {
    await supabase.from('vehicle_odometer_logs').insert({
      vehicle_id: newVehicle.id,
      odometer_reading: onboardingData.odometer_reading,
      source: 'onboarding_inspection',
      recorded_by: user?.id || null,
    })
  }

  // 5. Audit Logging
  await supabase.from('document_activity_logs').insert({
    document_type: 'vehicle',
    document_id: newVehicle.id,
    action: 'ONBOARDING_INSPECTION_COMPLETED',
    change_summary: `Onboarding inspection (${inspNum}) completed for ${newVehicle.registration_number}: Result=${onboardingData.overall_condition.toUpperCase()}, Status=${finalStatus}`,
    user_id: user?.id || null,
  })

  revalidatePath('/dashboard/fleet')
  revalidatePath('/dashboard/vehicles')
  revalidatePath('/dashboard/maintenance/inspections')
  revalidatePath('/dashboard/maintenance')

  return { success: true, vehicle_id: newVehicle.id, inspection_id: inspection.id, status: finalStatus }
}

export interface ManagementDecisionInput {
  vehicleId: string
  decision: 'fleet_partner_on_call' | 'in_house_fleet' | 'standby_pool' | 'rejected'
  agreedPayoutRate?: number
  holdingType?: 'in_house' | 'owner_held'
  managementNotes?: string
}

export async function resolveOnboardingManagementDecisionAction(input: ManagementDecisionInput) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { vehicleId, decision, agreedPayoutRate, holdingType, managementNotes } = input

  const { data: vehicle, error: vErr } = await supabase
    .from('vehicles')
    .select('id, registration_number, vehicle_name, vehicle_owner_id, owner_contact_name, owner_contact_phone')
    .eq('id', vehicleId)
    .single()

  if (vErr || !vehicle) {
    throw new Error(`Vehicle not found: ${vErr?.message || 'Invalid vehicle ID'}`)
  }

  let finalStatus = 'pending_management_approval'
  let finalHoldingType = holdingType || 'owner_held'
  let agreementStatus = 'pending_dispatch'

  if (decision === 'fleet_partner_on_call') {
    finalStatus = 'available_on_call'
    finalHoldingType = 'owner_held'
    agreementStatus = 'pending_dispatch'
  } else if (decision === 'in_house_fleet') {
    finalStatus = 'available'
    finalHoldingType = 'in_house'
    agreementStatus = 'exempt'
  } else if (decision === 'standby_pool') {
    finalStatus = 'standby_pool'
    finalHoldingType = 'owner_held'
    agreementStatus = 'pending_dispatch'
  } else if (decision === 'rejected') {
    finalStatus = 'rejected'
    agreementStatus = 'exempt'
  }

  // Auto-sync owner to vehicle_owners table if vehicle_owner_id is missing
  let linkedOwnerId = vehicle.vehicle_owner_id
  const ownerName = vehicle.owner_contact_name?.trim()
  const ownerPhone = vehicle.owner_contact_phone?.trim()

  if (!linkedOwnerId && (ownerName || ownerPhone)) {
    const normPhone = ownerPhone ? ownerPhone.replace(/[^\d+]/g, '') : ''

    if (normPhone) {
      const { data: byPhone } = await supabase
        .from('vehicle_owners')
        .select('id')
        .or(`mobile.ilike.%${normPhone}%,whatsapp.ilike.%${normPhone}%`)
        .maybeSingle()
      if (byPhone) linkedOwnerId = byPhone.id
    }

    if (!linkedOwnerId && ownerName) {
      const { data: byName } = await supabase
        .from('vehicle_owners')
        .select('id')
        .ilike('full_name', ownerName)
        .maybeSingle()
      if (byName) linkedOwnerId = byName.id
    }

    if (!linkedOwnerId) {
      const ownerNum = `OWN-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`
      const { data: newOwner } = await supabase
        .from('vehicle_owners')
        .insert({
          owner_number: ownerNum,
          full_name: ownerName || 'Partner Owner',
          mobile: ownerPhone || null,
          whatsapp: ownerPhone || null,
          owner_type: 'individual',
          is_active: true,
          notes: 'Auto-created via Management Approval',
          created_by: user?.id || null,
        })
        .select('id')
        .single()

      if (newOwner) linkedOwnerId = newOwner.id
    }
  }

  const updatePayload: Record<string, any> = {
    status: finalStatus,
    holding_type: finalHoldingType,
    owner_agreement_status: agreementStatus,
    management_decision: decision,
    management_notes: managementNotes?.trim() || null,
    management_reviewed_at: new Date().toISOString(),
    updated_by: user?.id || null,
  }

  if (linkedOwnerId) {
    updatePayload.vehicle_owner_id = linkedOwnerId
  }

  if (typeof agreedPayoutRate === 'number' && agreedPayoutRate >= 0) {
    updatePayload.agreed_payout_rate = agreedPayoutRate
  }

  const { error: updateErr } = await supabase
    .from('vehicles')
    .update(updatePayload)
    .eq('id', vehicleId)

  if (updateErr) {
    throw new Error(`Failed to update vehicle management decision: ${updateErr.message}`)
  }

  // Audit Log
  await supabase.from('document_activity_logs').insert({
    document_type: 'vehicle',
    document_id: vehicleId,
    action: 'MANAGEMENT_ONBOARDING_DECISION',
    change_summary: `Management decision [${decision.toUpperCase()}] for ${vehicle.registration_number}: Status=${finalStatus}, Holding=${finalHoldingType}, Agreed Rate=LKR ${agreedPayoutRate || 0}`,
    user_id: user?.id || null,
  })

  revalidatePath('/dashboard/fleet')
  revalidatePath('/dashboard/vehicles')
  revalidatePath('/dashboard/fleet/owners')
  revalidatePath('/dashboard/maintenance/inspections')
  revalidatePath('/dashboard/maintenance')

  return { success: true, status: finalStatus }
}

export async function reconcileMissingVehicleOwnersAction() {
  const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY ? createAdminClient() : await createClient()

  const { data: unlinkedVehicles, error: fetchErr } = await supabase
    .from('vehicles')
    .select('id, owner_contact_name, owner_contact_phone, vehicle_name, registration_number')
    .is('vehicle_owner_id', null)
    .eq('is_archived', false)
    .not('owner_contact_name', 'is', null)

  if (fetchErr || !unlinkedVehicles || unlinkedVehicles.length === 0) {
    return { success: true, reconciledCount: 0 }
  }

  let reconciledCount = 0

  for (const v of unlinkedVehicles) {
    const ownerName = v.owner_contact_name?.trim()
    const ownerPhone = v.owner_contact_phone?.trim()

    if (!ownerName || ownerName === '') continue

    let linkedOwnerId: string | null = null
    const normPhone = ownerPhone ? ownerPhone.replace(/[^\d+]/g, '') : ''

    if (normPhone) {
      const { data: byPhone } = await supabase
        .from('vehicle_owners')
        .select('id')
        .or(`mobile.ilike.%${normPhone}%,whatsapp.ilike.%${normPhone}%`)
        .maybeSingle()
      if (byPhone) linkedOwnerId = byPhone.id
    }

    if (!linkedOwnerId && ownerName) {
      const { data: byName } = await supabase
        .from('vehicle_owners')
        .select('id')
        .ilike('full_name', ownerName)
        .maybeSingle()
      if (byName) linkedOwnerId = byName.id
    }

    if (!linkedOwnerId) {
      const ownerNum = `OWN-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`
      const { data: newOwner } = await supabase
        .from('vehicle_owners')
        .insert({
          owner_number: ownerNum,
          full_name: ownerName,
          mobile: ownerPhone || null,
          whatsapp: ownerPhone || null,
          owner_type: 'individual',
          is_active: true,
          notes: 'Auto-reconciled legacy owner record',
          created_by: null,
        })
        .select('id')
        .single()

      if (newOwner) {
        linkedOwnerId = newOwner.id
      }
    }

    if (linkedOwnerId) {
      await supabase
        .from('vehicles')
        .update({ vehicle_owner_id: linkedOwnerId })
        .eq('id', v.id)
      reconciledCount++
    }
  }

  if (reconciledCount > 0) {
    revalidatePath('/dashboard/fleet/owners')
    revalidatePath('/dashboard/vehicles')
    revalidatePath('/dashboard/fleet')
  }

  return { success: true, reconciledCount }
}
