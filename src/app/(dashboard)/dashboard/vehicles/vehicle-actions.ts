'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { vehicleSchema, vehicleCategorySchema, inlineOwnerSchema } from '@/lib/validations/master-data'
import { z } from 'zod'

type VehicleInput = z.infer<typeof vehicleSchema>
type CategoryInput = z.infer<typeof vehicleCategorySchema>
type InlineOwnerInput = z.infer<typeof inlineOwnerSchema>

export type OwnershipMode = 'company' | 'existing' | 'new'

export interface VehicleWithOwnerInput {
  vehicle: VehicleInput
  ownershipMode: OwnershipMode
  existingOwnerId?: string | null
  newOwner?: InlineOwnerInput | null
}

async function getNextOwnerNumber(supabase: any): Promise<string> {
  try {
    const { data } = await supabase.rpc('generate_next_owner_number_v2')
    if (data) return data
  } catch (_) {}
  try {
    const { data } = await supabase.rpc('generate_next_owner_number')
    if (data) return data
  } catch (_) {}
  return `OWN-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`
}

async function createInlineOwnerRecord(
  supabase: any,
  userId: string,
  ownerData: InlineOwnerInput,
  vehicleRates: VehicleInput
): Promise<{ owner?: any; error?: string }> {
  const parsedOwner = inlineOwnerSchema.safeParse(ownerData)
  if (!parsedOwner.success) {
    return { error: parsedOwner.error.issues[0].message }
  }

  const d = parsedOwner.data
  const ownerNum = await getNextOwnerNumber(supabase)
  const fallbackDaily =
    vehicleRates.owner_daily_rate_self && Number(vehicleRates.owner_daily_rate_self) > 0
      ? Number(vehicleRates.owner_daily_rate_self)
      : vehicleRates.owner_daily_rate_with_driver && Number(vehicleRates.owner_daily_rate_with_driver) > 0
      ? Number(vehicleRates.owner_daily_rate_with_driver)
      : null

  const { data: owner, error } = await supabase
    .from('vehicle_owners')
    .insert({
      owner_number: ownerNum,
      full_name: d.full_name.trim(),
      owner_type: d.owner_type || 'individual',
      company_name: d.company_name?.trim() || null,
      national_id: d.national_id?.trim() || null,
      mobile: d.mobile?.trim() || null,
      whatsapp: d.whatsapp?.trim() || null,
      email: d.email?.trim() || null,
      address: d.address?.trim() || null,
      revenue_share_pct: d.revenue_share_pct ? Number(d.revenue_share_pct) : 0,
      flat_rate_per_day: d.flat_rate_per_day ? Number(d.flat_rate_per_day) : fallbackDaily,
      payment_terms: d.payment_terms || 'Monthly',
      monthly_km_quota: d.monthly_km_quota ?? vehicleRates.monthly_km_quota ?? 3000,
      owner_excess_km_rate: d.owner_excess_km_rate ?? vehicleRates.owner_excess_km_rate ?? 0,
      bank_account_name: d.bank_account_name?.trim() || null,
      bank_name: d.bank_name?.trim() || null,
      bank_account_number: d.bank_account_number?.trim() || null,
      bank_branch: d.bank_branch?.trim() || null,
      notes: d.notes?.trim() || null,
      settlement_rule: d.revenue_share_pct && Number(d.revenue_share_pct) > 0 ? 'percentage' : 'fixed_monthly',
      is_active: true,
    })
    .select()
    .single()

  if (error || !owner) {
    return { error: error?.message || 'Failed to register vehicle owner.' }
  }

  try {
    await supabase.from('audit_logs').insert({
      user_id: userId,
      action: 'CREATE',
      table_name: 'vehicle_owners',
      record_id: owner.id,
      new_values: owner,
    })
  } catch (_) {}

  return { owner }
}

function buildVehicleDbPayload(
  parsedData: VehicleInput,
  rawValues: VehicleInput,
  userId: string,
  isCreate: boolean,
  resolvedOwner?: { id: string | null; name?: string | null; phone?: string | null }
) {
  const isOwnerLeased = Boolean(resolvedOwner?.id) || parsedData.ownership_type === 'owner_leased' || parsedData.ownership_type === 'external_owner'
  const ownerDailySelf = Number(parsedData.owner_daily_rate_self ?? 0)
  const ownerMonthlySelf = Number(parsedData.owner_monthly_rate_self ?? 0)
  const ownerDailyDriver = Number(parsedData.owner_daily_rate_with_driver ?? 0)
  const ownerMonthlyDriver = Number(parsedData.owner_monthly_rate_with_driver ?? 0)
  const sellingDailyDriver = Number(parsedData.selling_daily_rate_with_driver ?? 0)
  const sellingMonthlyDriver = Number(parsedData.selling_monthly_rate_with_driver ?? 0)
  const driverBata = Number(parsedData.driver_bata_per_day ?? 0)
  const monthlyKmQuota = Number(parsedData.monthly_km_quota ?? 3000)
  const ownerExcessKm = Number(parsedData.owner_excess_km_rate ?? 0)
  const serviceIntervalKm = Number(parsedData.service_interval_km ?? 5000)

  const legacyDailyPayout = ownerDailySelf > 0 ? ownerDailySelf : ownerDailyDriver > 0 ? ownerDailyDriver : null
  const legacyAgreedPayout =
    ownerMonthlySelf > 0
      ? ownerMonthlySelf
      : ownerMonthlyDriver > 0
      ? ownerMonthlyDriver
      : ownerDailySelf > 0
      ? ownerDailySelf
      : null

  const computedServiceDue =
    parsedData.service_due_mileage !== undefined && parsedData.service_due_mileage !== null && Number(parsedData.service_due_mileage) > 0
      ? Number(parsedData.service_due_mileage)
      : isCreate && serviceIntervalKm > 0
      ? Number(parsedData.current_mileage || 0) + serviceIntervalKm
      : null

  const payload: Record<string, any> = {
    ...parsedData,
    next_service_date: rawValues.next_service_date?.trim() || null,
    insurance_expiry: rawValues.insurance_expiry?.trim() || null,
    revenue_license_expiry: rawValues.revenue_license_expiry?.trim() || null,
    emission_test_expiry: rawValues.emission_test_expiry?.trim() || null,
    chassis_number: rawValues.chassis_number?.trim() || null,
    engine_number: rawValues.engine_number?.trim() || null,
    colour: rawValues.colour?.trim() || null,
    description: rawValues.description?.trim() || null,
    notes: rawValues.notes?.trim() || null,
    tracker_id: rawValues.tracker_id?.trim() || null,
    ownership_type: isOwnerLeased ? (parsedData.ownership_type && parsedData.ownership_type !== 'company' ? parsedData.ownership_type : 'owner_leased') : 'company',
    vehicle_owner_id: resolvedOwner ? resolvedOwner.id : (parsedData.vehicle_owner_id || null),
    holding_type: !isOwnerLeased
      ? 'in_house'
      : ['available_on_call', 'standby_pool', 'pending_management_approval'].includes(parsedData.status || '')
      ? 'owner_held'
      : isCreate
      ? 'in_house'
      : undefined,
    owner_name: resolvedOwner ? (resolvedOwner.name || null) : undefined,
    owner_contact_name: resolvedOwner ? (resolvedOwner.name || null) : undefined,
    owner_contact_phone: resolvedOwner ? (resolvedOwner.phone || null) : undefined,
    owner_daily_rate_self: ownerDailySelf,
    owner_monthly_rate_self: ownerMonthlySelf,
    owner_daily_rate_with_driver: ownerDailyDriver,
    owner_monthly_rate_with_driver: ownerMonthlyDriver,
    selling_daily_rate_with_driver: sellingDailyDriver,
    selling_monthly_rate_with_driver: sellingMonthlyDriver,
    driver_bata_per_day: driverBata,
    monthly_km_quota: monthlyKmQuota,
    owner_excess_km_rate: ownerExcessKm,
    service_interval_km: serviceIntervalKm,
    owner_flat_rate_per_day: legacyDailyPayout,
    agreed_payout_rate: legacyAgreedPayout,
    updated_by: userId,
  }

  if (computedServiceDue !== null) {
    payload.service_due_mileage = computedServiceDue
  }
  if (isCreate) {
    payload.created_by = userId
  }
  if (!resolvedOwner) {
    delete payload.owner_name
    delete payload.owner_contact_name
    delete payload.owner_contact_phone
  }
  if (payload.holding_type === undefined) {
    delete payload.holding_type
  }
  return payload
}

// Vehicle Category Actions
export async function createVehicleCategory(values: CategoryInput) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated.' }

    const parsed = vehicleCategorySchema.safeParse(values)
    if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

    const { data: newCat, error } = await supabase
      .from('vehicle_categories')
      .insert({
        ...parsed.data,
        description: values.description?.trim() || null,
        created_by: user.id,
        updated_by: user.id,
      })
      .select()
      .single()

    if (error) {
      if (error.message.includes('slug')) return { success: false, error: 'Category slug must be unique.' }
      return { success: false, error: error.message }
    }

    await supabase.rpc('log_audit_action_internal', {
      p_action: 'CREATE_VEHICLE_CATEGORY',
      p_entity_type: 'vehicle_category',
      p_entity_id: newCat.id,
      p_description: `Created vehicle category ${newCat.name}`,
    })

    revalidatePath('/dashboard/vehicles/categories')
    revalidatePath('/dashboard/vehicles')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create category.' }
  }
}

export async function updateVehicleCategory(id: string, values: CategoryInput) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated.' }

    const parsed = vehicleCategorySchema.safeParse(values)
    if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

    const { error } = await supabase
      .from('vehicle_categories')
      .update({
        ...parsed.data,
        description: values.description?.trim() || null,
        updated_by: user.id,
      })
      .eq('id', id)

    if (error) return { success: false, error: error.message }

    await supabase.rpc('log_audit_action_internal', {
      p_action: 'UPDATE_VEHICLE_CATEGORY',
      p_entity_type: 'vehicle_category',
      p_entity_id: id,
      p_description: `Updated category ${parsed.data.name}`,
    })

    revalidatePath('/dashboard/vehicles/categories')
    revalidatePath('/dashboard/vehicles')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update category.' }
  }
}

// Shared helper to resolve owner ID / snapshot based on mode
async function resolveVehicleOwnerForAction(
  supabase: any,
  userId: string,
  ownershipMode: OwnershipMode,
  existingOwnerId: string | null | undefined,
  newOwner: InlineOwnerInput | null | undefined,
  vehicleRates: VehicleInput
): Promise<{
  resolvedOwner: { id: string | null; name?: string | null; phone?: string | null }
  createdOwnerId: string | null
  error?: string
}> {
  if (ownershipMode === 'company') {
    return { resolvedOwner: { id: null, name: null, phone: null }, createdOwnerId: null }
  }

  if (ownershipMode === 'existing') {
    if (!existingOwnerId) {
      return {
        resolvedOwner: { id: null },
        createdOwnerId: null,
        error: 'Please select an existing vehicle owner or switch to Company Owned.',
      }
    }
    const { data: ownerRow } = await supabase
      .from('vehicle_owners')
      .select('id, full_name, mobile, whatsapp')
      .eq('id', existingOwnerId)
      .maybeSingle()

    if (!ownerRow) {
      return {
        resolvedOwner: { id: null },
        createdOwnerId: null,
        error: 'Selected vehicle owner could not be found.',
      }
    }

    return {
      resolvedOwner: {
        id: ownerRow.id,
        name: ownerRow.full_name || null,
        phone: ownerRow.mobile || ownerRow.whatsapp || null,
      },
      createdOwnerId: null,
    }
  }

  if (!newOwner || !newOwner.full_name?.trim()) {
    return {
      resolvedOwner: { id: null },
      createdOwnerId: null,
      error: 'Owner Full Name is required when registering a new owner inline.',
    }
  }

  const { owner, error } = await createInlineOwnerRecord(supabase, userId, newOwner, vehicleRates)
  if (error || !owner) {
    return {
      resolvedOwner: { id: null },
      createdOwnerId: null,
      error: error || 'Failed to register inline vehicle owner.',
    }
  }

  return {
    resolvedOwner: {
      id: owner.id,
      name: owner.full_name || null,
      phone: owner.mobile || owner.whatsapp || null,
    },
    createdOwnerId: owner.id,
  }
}

// Vehicle Actions
export async function createVehicleWithOptionalOwner(input: VehicleWithOwnerInput) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated.' }

    const parsed = vehicleSchema.safeParse(input.vehicle)
    if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

    const { resolvedOwner, createdOwnerId, error: ownerErr } = await resolveVehicleOwnerForAction(
      supabase,
      user.id,
      input.ownershipMode || 'company',
      input.existingOwnerId,
      input.newOwner,
      parsed.data
    )

    if (ownerErr) return { success: false, error: ownerErr }

    const payload = buildVehicleDbPayload(parsed.data, input.vehicle, user.id, true, resolvedOwner)

    const { data: newVehicle, error: insertError } = await supabase
      .from('vehicles')
      .insert(payload)
      .select()
      .single()

    if (insertError || !newVehicle) {
      // Roll back inline owner creation if vehicle insertion fails
      if (createdOwnerId) {
        try {
          await supabase.from('vehicle_owners').delete().eq('id', createdOwnerId)
        } catch (_) {}
      }
      const msg = insertError?.message.toLowerCase() || ''
      if (msg.includes('registration_number')) return { success: false, error: 'A vehicle with this registration number already exists.' }
      return { success: false, error: insertError?.message || 'Failed to create vehicle record.' }
    }

    await supabase.rpc('log_audit_action_internal', {
      p_action: 'CREATE_VEHICLE',
      p_entity_type: 'vehicle',
      p_entity_id: newVehicle.id,
      p_description: `Created vehicle ${newVehicle.vehicle_code} (${newVehicle.brand} ${newVehicle.model})`,
    })

    revalidatePath('/dashboard/vehicles')
    revalidatePath('/dashboard/fleet')
    revalidatePath('/dashboard/fleet/owners')
    revalidatePath('/dashboard')
    return { success: true, vehicleId: newVehicle.id, ownerId: resolvedOwner.id }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create vehicle.' }
  }
}

export async function createVehicle(values: VehicleInput) {
  const mode: OwnershipMode = values.vehicle_owner_id ? 'existing' : 'company'
  return createVehicleWithOptionalOwner({
    vehicle: values,
    ownershipMode: mode,
    existingOwnerId: values.vehicle_owner_id || null,
  })
}

export async function updateVehicleWithOptionalOwner(id: string, input: VehicleWithOwnerInput) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated.' }

    const parsed = vehicleSchema.safeParse(input.vehicle)
    if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

    const { resolvedOwner, createdOwnerId, error: ownerErr } = await resolveVehicleOwnerForAction(
      supabase,
      user.id,
      input.ownershipMode || 'company',
      input.existingOwnerId,
      input.newOwner,
      parsed.data
    )

    if (ownerErr) return { success: false, error: ownerErr }

    const payload = buildVehicleDbPayload(parsed.data, input.vehicle, user.id, false, resolvedOwner)

    const { error: updateError } = await supabase
      .from('vehicles')
      .update(payload)
      .eq('id', id)

    if (updateError) {
      if (createdOwnerId) {
        try {
          await supabase.from('vehicle_owners').delete().eq('id', createdOwnerId)
        } catch (_) {}
      }
      const msg = updateError.message.toLowerCase()
      if (msg.includes('registration_number')) return { success: false, error: 'A vehicle with this registration number already exists.' }
      return { success: false, error: updateError.message }
    }

    await supabase.rpc('log_audit_action_internal', {
      p_action: 'UPDATE_VEHICLE',
      p_entity_type: 'vehicle',
      p_entity_id: id,
      p_description: `Updated vehicle details for ${parsed.data.vehicle_name}`,
    })

    revalidatePath('/dashboard/vehicles')
    revalidatePath(`/dashboard/vehicles/${id}`)
    revalidatePath('/dashboard/fleet')
    revalidatePath('/dashboard/fleet/owners')
    return { success: true, ownerId: resolvedOwner.id }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update vehicle.' }
  }
}

export async function updateVehicle(id: string, values: VehicleInput) {
  const mode: OwnershipMode = values.vehicle_owner_id
    ? 'existing'
    : values.ownership_type && values.ownership_type !== 'company'
    ? 'existing'
    : 'company'

  // If called directly with legacy values without explicit ownership mode, keep legacy behavior unless owner specified
  if (values.ownership_type === undefined && values.vehicle_owner_id === undefined) {
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return { success: false, error: 'Not authenticated.' }
      const parsed = vehicleSchema.safeParse(values)
      if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }
      const payload = buildVehicleDbPayload(parsed.data, values, user.id, false)
      const { error: updateError } = await supabase.from('vehicles').update(payload).eq('id', id)
      if (updateError) return { success: false, error: updateError.message }
      revalidatePath('/dashboard/vehicles')
      revalidatePath(`/dashboard/vehicles/${id}`)
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to update vehicle.' }
    }
  }

  return updateVehicleWithOptionalOwner(id, {
    vehicle: values,
    ownershipMode: mode,
    existingOwnerId: values.vehicle_owner_id || null,
  })
}

export async function archiveVehicle(id: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated.' }

    const { error } = await supabase
      .from('vehicles')
      .update({ is_archived: true, archived_at: new Date().toISOString(), updated_by: user.id })
      .eq('id', id)

    if (error) return { success: false, error: error.message }

    await supabase.rpc('log_audit_action_internal', {
      p_action: 'ARCHIVE_VEHICLE',
      p_entity_type: 'vehicle',
      p_entity_id: id,
      p_description: 'Archived vehicle record',
    })

    revalidatePath('/dashboard/vehicles')
    revalidatePath('/dashboard/vehicles/archived')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to archive vehicle.' }
  }
}

export async function restoreVehicle(id: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated.' }

    const { error } = await supabase
      .from('vehicles')
      .update({ is_archived: false, archived_at: null, updated_by: user.id })
      .eq('id', id)

    if (error) return { success: false, error: error.message }

    await supabase.rpc('log_audit_action_internal', {
      p_action: 'RESTORE_VEHICLE',
      p_entity_type: 'vehicle',
      p_entity_id: id,
      p_description: 'Restored vehicle from archive',
    })

    revalidatePath('/dashboard/vehicles')
    revalidatePath('/dashboard/vehicles/archived')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to restore vehicle.' }
  }
}

// Vehicle Image Upload & Storage Actions
export async function uploadVehicleImage(formData: FormData) {
  try {
    const vehicleId = formData.get('vehicle_id') as string
    const file = formData.get('file') as File
    const isPrimary = formData.get('is_primary') === 'true'

    if (!vehicleId || !file) {
      return { success: false, error: 'Vehicle ID and image file are required.' }
    }

    const allowedMime = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
    if (!allowedMime.includes(file.type)) {
      return { success: false, error: 'Invalid file format. Allowed formats: JPG, PNG, WEBP.' }
    }
    if (file.size > 5 * 1024 * 1024) {
      return { success: false, error: 'File size exceeds maximum limit of 5MB.' }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated.' }

    const fileExt = file.name.split('.').pop() || 'webp'
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
    const storagePath = `vehicle-images/${vehicleId}/${fileName}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const adminSupabase = process.env.SUPABASE_SERVICE_ROLE_KEY ? createAdminClient() : supabase

    const { error: uploadError } = await adminSupabase.storage
      .from('vehicle-images')
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) {
      return { success: false, error: `Storage upload failed: ${uploadError.message}` }
    }

    const { data: { publicUrl } } = adminSupabase.storage
      .from('vehicle-images')
      .getPublicUrl(storagePath)

    if (isPrimary) {
      await supabase
        .from('vehicle_images')
        .update({ is_primary: false })
        .eq('vehicle_id', vehicleId)
    }

    const { error: dbError } = await supabase.from('vehicle_images').insert({
      vehicle_id: vehicleId,
      storage_path: storagePath,
      public_url: publicUrl,
      alt_text: file.name,
      is_primary: isPrimary,
      uploaded_by: user.id,
    })

    if (dbError) {
      await adminSupabase.storage.from('vehicle-images').remove([storagePath])
      return { success: false, error: `Database record failed: ${dbError.message}` }
    }

    await supabase.rpc('log_audit_action_internal', {
      p_action: 'UPLOAD_VEHICLE_IMAGE',
      p_entity_type: 'vehicle_image',
      p_entity_id: vehicleId,
      p_description: `Uploaded vehicle image ${file.name}`,
    })

    revalidatePath(`/dashboard/vehicles/${vehicleId}`)
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Image upload failed.' }
  }
}

export async function setPrimaryVehicleImage(vehicleId: string, imageId: string) {
  try {
    const supabase = await createClient()

    await supabase
      .from('vehicle_images')
      .update({ is_primary: false })
      .eq('vehicle_id', vehicleId)

    const { error } = await supabase
      .from('vehicle_images')
      .update({ is_primary: true })
      .eq('id', imageId)

    if (error) return { success: false, error: error.message }

    revalidatePath(`/dashboard/vehicles/${vehicleId}`)
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function deleteVehicleImage(imageId: string, vehicleId: string, storagePath: string) {
  try {
    const supabase = await createClient()
    const adminSupabase = process.env.SUPABASE_SERVICE_ROLE_KEY ? createAdminClient() : supabase

    if (storagePath) {
      await adminSupabase.storage.from('vehicle-images').remove([storagePath])
    }

    const { error } = await supabase.from('vehicle_images').delete().eq('id', imageId)

    if (error) return { success: false, error: error.message }

    revalidatePath(`/dashboard/vehicles/${vehicleId}`)
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}
