import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CompanySettingsForm } from './company-settings-form'
import { LetterheadManagementCard } from './letterhead-management-card'

export const metadata = {
  title: 'Company & Numbering Settings — Thennakoon Tours Management System',
}

export default async function CompanySettingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Enforce owner-only access
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'owner') {
    redirect('/unauthorized')
  }

  // Fetch current company settings
  const { data: settings } = await supabase
    .from('company_settings')
    .select('*')
    .single()

  // Fetch invoice number counter configuration
  const { data: invoiceCounter } = await supabase
    .from('number_counters')
    .select('*')
    .eq('document_type', 'invoice')
    .maybeSingle()

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Company & Numbering Settings</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Manage company information, system preferences, and document numbering defaults.
        </p>
      </div>

      {/* Dynamic Letterhead Upload & Management Card */}
      <LetterheadManagementCard currentLetterheadUrl={settings?.letterhead_url} />

      {/* Company & Numbering Settings Form */}
      <CompanySettingsForm initialValues={settings} invoiceCounter={invoiceCounter} />
    </div>
  )
}
