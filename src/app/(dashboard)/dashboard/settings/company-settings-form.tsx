'use client'

import { useState } from 'react'
import { saveCompanySettings } from './settings-actions'
import { Loader2, Save, CheckCircle } from 'lucide-react'

interface CompanySettings {
  company_name: string
  address: string | null
  phone_primary: string | null
  phone_secondary: string | null
  whatsapp_number: string | null
  email: string | null
  website: string | null
  currency: string | null
  timezone: string | null
  quotation_prefix: string | null
  invoice_prefix: string | null
  receipt_prefix: string | null
}

interface CompanySettingsFormProps {
  initialValues: CompanySettings | null
}

function FormField({
  label,
  name,
  defaultValue,
  placeholder,
  type = 'text',
}: {
  label: string
  name: string
  defaultValue?: string | null
  placeholder?: string
  type?: string
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <input
        type={type}
        name={name}
        defaultValue={defaultValue ?? ''}
        placeholder={placeholder}
        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-amber-400 transition-colors"
      />
    </div>
  )
}

export function CompanySettingsForm({ initialValues }: CompanySettingsFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSaved(false)

    const formData = new FormData(e.currentTarget)
    try {
      const result = await saveCompanySettings(formData)
      if (result.success) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } else {
        setError(result.error || 'Failed to save settings.')
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Company Information */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <div className="w-2 h-5 bg-amber-400 rounded-full"></div>
          <h2 className="font-bold text-slate-900 dark:text-white text-sm">Company Information</h2>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2">
            <FormField
              label="Company Name"
              name="company_name"
              defaultValue={initialValues?.company_name}
              placeholder="Thennakoon Tours (Pvt) Ltd"
            />
          </div>
          <div className="md:col-span-2">
            <FormField
              label="Address"
              name="address"
              defaultValue={initialValues?.address}
              placeholder="39 A, 1st Cross Street, Pagoda Road, Nugegoda"
            />
          </div>
          <FormField
            label="Primary Phone"
            name="phone_primary"
            defaultValue={initialValues?.phone_primary}
            placeholder="+94 112 823 723"
            type="tel"
          />
          <FormField
            label="Secondary Phone"
            name="phone_secondary"
            defaultValue={initialValues?.phone_secondary}
            placeholder="+94 777 273 820"
            type="tel"
          />
          <FormField
            label="WhatsApp Number"
            name="whatsapp_number"
            defaultValue={initialValues?.whatsapp_number}
            placeholder="+94 777 474 938"
            type="tel"
          />
          <FormField
            label="Email"
            name="email"
            defaultValue={initialValues?.email}
            placeholder="info@thennakoontours.com"
            type="email"
          />
          <FormField
            label="Website"
            name="website"
            defaultValue={initialValues?.website}
            placeholder="thennakoontours.com"
          />
        </div>
      </div>

      {/* System Preferences */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <div className="w-2 h-5 bg-amber-400 rounded-full"></div>
          <h2 className="font-bold text-slate-900 dark:text-white text-sm">System Preferences</h2>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Currency
            </label>
            <select
              name="currency"
              defaultValue={initialValues?.currency ?? 'LKR'}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-amber-400 transition-colors"
            >
              <option value="LKR">LKR — Sri Lankan Rupee</option>
              <option value="USD">USD — US Dollar</option>
              <option value="EUR">EUR — Euro</option>
              <option value="GBP">GBP — British Pound</option>
              <option value="AUD">AUD — Australian Dollar</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Timezone
            </label>
            <select
              name="timezone"
              defaultValue={initialValues?.timezone ?? 'Asia/Colombo'}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-amber-400 transition-colors"
            >
              <option value="Asia/Colombo">Asia/Colombo (GMT+5:30)</option>
              <option value="UTC">UTC (GMT+0)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Document Prefixes */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <div className="w-2 h-5 bg-amber-400 rounded-full"></div>
          <h2 className="font-bold text-slate-900 dark:text-white text-sm">Document Number Prefixes</h2>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-5">
          <FormField
            label="Quotation Prefix"
            name="quotation_prefix"
            defaultValue={initialValues?.quotation_prefix}
            placeholder="QT"
          />
          <FormField
            label="Invoice Prefix"
            name="invoice_prefix"
            defaultValue={initialValues?.invoice_prefix}
            placeholder="INV"
          />
          <FormField
            label="Receipt Prefix"
            name="receipt_prefix"
            defaultValue={initialValues?.receipt_prefix}
            placeholder="RCPT"
          />
        </div>
      </div>

      {/* Error / Success messages */}
      {error && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-lg text-xs font-semibold">
          {error}
        </div>
      )}
      {saved && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-semibold flex items-center gap-2">
          <CheckCircle size={14} />
          Company settings saved successfully.
        </div>
      )}

      {/* Submit */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-sm py-2.5 px-6 rounded-lg flex items-center gap-2 cursor-pointer shadow-sm hover:shadow-amber-400/20 transition-all disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save size={16} />
              Save Settings
            </>
          )}
        </button>
      </div>
    </form>
  )
}
