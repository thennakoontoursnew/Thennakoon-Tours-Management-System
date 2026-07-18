import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CompanySettingsForm } from './company-settings-form'

export const metadata = {
  title: 'Company Settings — Thennakoon Tours Management System',
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

  // Fetch current settings
  const { data: settings } = await supabase
    .from('company_settings')
    .select('*')
    .single()

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Company Settings</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Manage company information and document configuration.
        </p>
      </div>

      {/* Letterhead Preview Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <div className="w-2 h-5 bg-amber-400 rounded-full"></div>
          <h2 className="font-bold text-slate-900 dark:text-white text-sm">Official Document Template</h2>
        </div>
        <div className="p-6">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div className="flex-1 space-y-3">
              <div>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Template Name
                </p>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Thennakoon Tours Official Letterhead
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Asset Path
                </p>
                <code className="text-xs bg-slate-100 dark:bg-slate-850 text-amber-600 dark:text-amber-400 px-2 py-1 rounded font-mono">
                  /documents/thennakoon-tours-letterhead.png
                </code>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Applied to
                </p>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {['Quotations', 'Proforma Invoices', 'Final Invoices', 'Receipts', 'Booking Confirmations', 'Rental Agreements'].map((doc) => (
                    <span
                      key={doc}
                      className="text-[10px] bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-semibold"
                    >
                      {doc}
                    </span>
                  ))}
                </div>
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-3">
                The official letterhead is a fixed project asset. It is used as the full-page A4 background for all generated documents. Do not upload or replace this asset through this panel.
              </p>
            </div>

            {/* Letterhead Thumbnail */}
            <div className="shrink-0 w-44">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Preview</p>
              <div className="border-2 border-amber-200 dark:border-amber-500/20 rounded-lg overflow-hidden shadow-md">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/documents/thennakoon-tours-letterhead.png"
                  alt="Thennakoon Tours Official Letterhead"
                  className="w-full object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Company Settings Form */}
      <CompanySettingsForm initialValues={settings} />
    </div>
  )
}
