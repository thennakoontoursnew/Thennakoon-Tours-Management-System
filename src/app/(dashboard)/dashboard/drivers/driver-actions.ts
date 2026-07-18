'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { driverSchema } from '@/lib/validations/master-data'
import { z } from 'zod'

type DriverInput = z.infer<typeof driverSchema>

export async function createDriver(values: DriverInput) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated.' }

    const parsed = driverSchema.safeParse(values)
    if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

    const { data: newDriver, error: insertError } = await supabase
      .from('drivers')
      .insert({
        ...parsed.data,
        created_by: user.id,
        updated_by: user.id,
      })
      .select()
      .single()

    if (insertError || !newDriver) {
      const msg = insertError?.message.toLowerCase() || ''
      if (msg.includes('nic')) return { success: false, error: 'A driver with this NIC already exists.' }
      if (msg.includes('license_number')) return { success: false, error: 'A driver with this Driving License Number already exists.' }
      return { success: false, error: insertError?.message || 'Failed to create driver record.' }
    }

    await supabase.rpc('log_audit_action_internal', {
      p_action: 'CREATE_DRIVER',
      p_entity_type: 'driver',
      p_entity_id: newDriver.id,
      p_description: `Created driver ${newDriver.driver_code} (${newDriver.full_name})`,
    })

    revalidatePath('/dashboard/drivers')
    revalidatePath('/dashboard')
    return { success: true, driverId: newDriver.id }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create driver.' }
  }
}

export async function updateDriver(id: string, values: DriverInput) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated.' }

    const parsed = driverSchema.safeParse(values)
    if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

    const { error: updateError } = await supabase
      .from('drivers')
      .update({
        ...parsed.data,
        updated_by: user.id,
      })
      .eq('id', id)

    if (updateError) {
      const msg = updateError.message.toLowerCase()
      if (msg.includes('nic')) return { success: false, error: 'A driver with this NIC already exists.' }
      if (msg.includes('license_number')) return { success: false, error: 'A driver with this Driving License Number already exists.' }
      return { success: false, error: updateError.message }
    }

    await supabase.rpc('log_audit_action_internal', {
      p_action: 'UPDATE_DRIVER',
      p_entity_type: 'driver',
      p_entity_id: id,
      p_description: `Updated driver details for ${parsed.data.full_name}`,
    })

    revalidatePath('/dashboard/drivers')
    revalidatePath(`/dashboard/drivers/${id}`)
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update driver.' }
  }
}

export async function archiveDriver(id: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated.' }

    const { error } = await supabase
      .from('drivers')
      .update({ is_archived: true, archived_at: new Date().toISOString(), updated_by: user.id })
      .eq('id', id)

    if (error) return { success: false, error: error.message }

    await supabase.rpc('log_audit_action_internal', {
      p_action: 'ARCHIVE_DRIVER',
      p_entity_type: 'driver',
      p_entity_id: id,
      p_description: 'Archived driver record',
    })

    revalidatePath('/dashboard/drivers')
    revalidatePath('/dashboard/drivers/archived')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to archive driver.' }
  }
}

export async function restoreDriver(id: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated.' }

    const { error } = await supabase
      .from('drivers')
      .update({ is_archived: false, archived_at: null, updated_by: user.id })
      .eq('id', id)

    if (error) return { success: false, error: error.message }

    await supabase.rpc('log_audit_action_internal', {
      p_action: 'RESTORE_DRIVER',
      p_entity_type: 'driver',
      p_entity_id: id,
      p_description: 'Restored driver from archive',
    })

    revalidatePath('/dashboard/drivers')
    revalidatePath('/dashboard/drivers/archived')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to restore driver.' }
  }
}

// Driver Document Upload to Private driver-documents Bucket
export async function uploadDriverDocument(formData: FormData) {
  try {
    const driverId = formData.get('driver_id') as string
    const documentType = formData.get('document_type') as string
    const expiryDate = (formData.get('expiry_date') as string) || null
    const file = formData.get('file') as File

    if (!driverId || !documentType || !file) {
      return { success: false, error: 'Driver ID, Document Type, and File are required.' }
    }

    const allowedMime = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    if (!allowedMime.includes(file.type)) {
      return { success: false, error: 'Allowed formats: JPG, PNG, WEBP, and PDF.' }
    }
    if (file.size > 10 * 1024 * 1024) {
      return { success: false, error: 'File size exceeds 10MB limit.' }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated.' }

    const fileExt = file.name.split('.').pop() || 'pdf'
    const fileName = `${documentType}_${Date.now()}.${fileExt}`
    const storagePath = `driver-documents/${driverId}/${fileName}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const adminSupabase = process.env.SUPABASE_SERVICE_ROLE_KEY ? createAdminClient() : supabase

    const { error: uploadError } = await adminSupabase.storage
      .from('driver-documents')
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) {
      return { success: false, error: `Storage upload failed: ${uploadError.message}` }
    }

    // Generate signed URL for private bucket access (1 year expiry for session display)
    const { data: signedData } = await adminSupabase.storage
      .from('driver-documents')
      .createSignedUrl(storagePath, 60 * 60 * 24 * 365)

    const { error: dbError } = await supabase.from('driver_documents').insert({
      driver_id: driverId,
      document_type: documentType,
      storage_path: storagePath,
      public_url: signedData?.signedUrl || null,
      file_name: file.name,
      expiry_date: expiryDate,
      uploaded_by: user.id,
    })

    if (dbError) {
      await adminSupabase.storage.from('driver-documents').remove([storagePath])
      return { success: false, error: `Database insert failed: ${dbError.message}` }
    }

    await supabase.rpc('log_audit_action_internal', {
      p_action: 'UPLOAD_DRIVER_DOCUMENT',
      p_entity_type: 'driver_document',
      p_entity_id: driverId,
      p_description: `Uploaded ${documentType} document for driver`,
    })

    revalidatePath(`/dashboard/drivers/${driverId}`)
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Document upload failed.' }
  }
}

export async function deleteDriverDocument(documentId: string, driverId: string, storagePath: string) {
  try {
    const supabase = await createClient()
    const adminSupabase = process.env.SUPABASE_SERVICE_ROLE_KEY ? createAdminClient() : supabase

    if (storagePath) {
      await adminSupabase.storage.from('driver-documents').remove([storagePath])
    }

    const { error } = await supabase.from('driver_documents').delete().eq('id', documentId)
    if (error) return { success: false, error: error.message }

    revalidatePath(`/dashboard/drivers/${driverId}`)
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}
