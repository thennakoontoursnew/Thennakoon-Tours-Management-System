'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { vehicleSchema, vehicleCategorySchema, sanitizePayload } from '@/lib/validations/master-data'
import { z } from 'zod'

type VehicleInput = z.infer<typeof vehicleSchema>
type CategoryInput = z.infer<typeof vehicleCategorySchema>

// Vehicle Category Actions
export async function createVehicleCategory(values: CategoryInput) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated.' }

    const parsed = vehicleCategorySchema.safeParse(values)
    if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

    const sanitizedData = sanitizePayload(parsed.data)

    const { data: newCat, error } = await supabase
      .from('vehicle_categories')
      .insert({
        ...sanitizedData,
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

    const sanitizedData = sanitizePayload(parsed.data)

    const { error } = await supabase
      .from('vehicle_categories')
      .update({
        ...sanitizedData,
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

// Vehicle Actions
export async function createVehicle(values: VehicleInput) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated.' }

    const parsed = vehicleSchema.safeParse(values)
    if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

    const sanitizedData = sanitizePayload(parsed.data)
    const payload = {
      ...sanitizedData,
      created_by: user.id,
      updated_by: user.id,
    }

    console.log('Vehicle insert payload', payload)

    const { data: newVehicle, error: insertError } = await supabase
      .from('vehicles')
      .insert(payload)
      .select()
      .single()

    if (insertError || !newVehicle) {
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
    revalidatePath('/dashboard')
    return { success: true, vehicleId: newVehicle.id }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create vehicle.' }
  }
}

export async function updateVehicle(id: string, values: VehicleInput) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated.' }

    const parsed = vehicleSchema.safeParse(values)
    if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

    const sanitizedData = sanitizePayload(parsed.data)
    const payload = {
      ...sanitizedData,
      updated_by: user.id,
    }

    console.log('Vehicle update payload', payload)

    const { error: updateError } = await supabase
      .from('vehicles')
      .update(payload)
      .eq('id', id)

    if (updateError) {
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
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update vehicle.' }
  }
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
