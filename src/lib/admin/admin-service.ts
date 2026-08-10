export async function getSystemSettings(supabase: any) {
  const { data: settings } = await supabase.from('system_settings').select('*')
  const { data: permissions } = await supabase.from('role_permissions').select('*')
  const { data: companySettings } = await supabase.from('company_settings').select('*').maybeSingle()

  const profileSetting = settings?.find((s: any) => s.setting_key === 'company_profile')?.setting_value || {}
  const docSetting = settings?.find((s: any) => s.setting_key === 'document_defaults')?.setting_value || {}

  return {
    companyProfile: companySettings || profileSetting,
    documentDefaults: docSetting,
    rolePermissions: permissions || [],
  }
}
