import { redirect } from 'next/navigation'
import Link from 'next/link'
import { RotateCcw } from 'lucide-react'
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

      {/* Active Testing Mode Alert Card */}
      <div className="p-5 rounded-2xl border border-rose-500/20 bg-rose-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Active Testing Mode: Clear Test Records</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Quickly clear sample quotations, invoices, agreements, and bookings created during testing.
            </p>
          </div>
        </div>
        <Link
          href="/dashboard/go-live-reset"
          className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all whitespace-nowrap self-start sm:self-auto cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Wipe Test Data & Reset Counters</span>
        </Link>
      </div>

      {/* Dynamic Letterhead Upload & Management Card */}
      <LetterheadManagementCard currentLetterheadUrl={settings?.letterhead_url} />

      {/* Company & Numbering Settings Form */}
      <CompanySettingsForm initialValues={settings} invoiceCounter={invoiceCounter} />
    </div>
  )
}
