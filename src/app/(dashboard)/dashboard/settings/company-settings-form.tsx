'use client'

import { useState } from 'react'
import { saveCompanySettings } from './settings-actions'
import { Loader2, Save, CheckCircle, Hash } from 'lucide-react'
import { COMPANY_CONFIG } from '@/lib/company-config'

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
  default_invoice_terms: string | null
  default_special_notes: string | null
}

interface NumberCounter {
  document_type: string
  prefix: string
  last_value: number
  padding: number
  allow_manual_edit: boolean
}

interface CompanySettingsFormProps {
  initialValues: CompanySettings | null
  invoiceCounter?: NumberCounter | null
}

function FormField({
  label,
  name,
  defaultValue,
  placeholder,
  type = 'text',
  readOnly = false,
}: {
  label: string
  name: string
  defaultValue?: string | null
  placeholder?: string
  type?: string
  readOnly?: boolean
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
        readOnly={readOnly}
        className={`w-full border text-slate-900 dark:text-white rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-amber-400 transition-colors ${
          readOnly
            ? 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 font-mono font-bold'
            : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800'
        }`}
      />
    </div>
  )
}

export function CompanySettingsForm({ initialValues, invoiceCounter }: CompanySettingsFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const invPrefix = invoiceCounter?.prefix || initialValues?.invoice_prefix || 'TT-IN-'
  const invLastVal = invoiceCounter?.last_value ?? 10000
  const invNextNo = `${invPrefix}${String(invLastVal + 1).padStart(5, '0')}`

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

      {/* Numbering Settings (Administration -> Numbering Settings -> Invoice) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-5 bg-amber-400 rounded-full"></div>
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white text-sm">Invoice Numbering Settings</h2>
              <p className="text-[11px] text-slate-500">Configure prefix, starting number, and manual edit permissions.</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center gap-1">
            <Hash size={12} />
            Next: {invNextNo}
          </span>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <FormField
            label="Invoice Prefix"
            name="invoice_prefix"
            defaultValue={invPrefix}
            placeholder="TT-IN-"
          />
          <FormField
            label="Starting Number"
            name="starting_number"
            defaultValue="10001"
            readOnly
          />
          <FormField
            label="Next Number (Auto)"
            name="next_number"
            defaultValue={invNextNo}
            readOnly
          />
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Allow Manual Editing
            </label>
            <select
              name="allow_manual_edit"
              defaultValue={invoiceCounter?.allow_manual_edit !== false ? 'true' : 'false'}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-amber-400 transition-colors"
            >
              <option value="true">Enabled (Authorized Users)</option>
              <option value="false">Disabled (Auto Only)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Default Document Terms & Special Notes */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <div className="w-2 h-5 bg-amber-400 rounded-full"></div>
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white text-sm">Default Document Terms & Special Notes</h2>
            <p className="text-[11px] text-slate-500">Configure default terms and notes pre-filled on new invoices and quotations.</p>
          </div>
        </div>
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Default Special Notes (Customer PDF)
            </label>
            <textarea
              name="default_special_notes"
              rows={3}
              defaultValue={initialValues?.default_special_notes ?? COMPANY_CONFIG.defaultInvoiceSpecialNotes}
              placeholder="A grace period of two (2) days will be allowed..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-amber-400 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Default Invoice Terms & Conditions (Customer PDF)
            </label>
            <textarea
              name="default_invoice_terms"
              rows={3}
              defaultValue={initialValues?.default_invoice_terms ?? COMPANY_CONFIG.defaultInvoiceImportantTerms}
              placeholder="Payment should be made on or before the due date..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-amber-400 transition-colors"
            />
          </div>
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
          <h2 className="font-bold text-slate-900 dark:text-white text-sm">Other Document Prefixes</h2>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
          <FormField
            label="Quotation Prefix"
            name="quotation_prefix"
            defaultValue={initialValues?.quotation_prefix || 'QT'}
            placeholder="QT"
          />
          <FormField
            label="Receipt Prefix"
            name="receipt_prefix"
            defaultValue={initialValues?.receipt_prefix || 'RCPT'}
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
          Company and Numbering settings saved successfully.
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
