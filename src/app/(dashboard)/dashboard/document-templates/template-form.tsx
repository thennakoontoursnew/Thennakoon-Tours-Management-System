'use client'

import { useState } from 'react'
import { updateDocumentTemplate } from './template-actions'
import { Save, CheckCircle, AlertCircle, Building2, User, FileText, Info } from 'lucide-react'

interface Props {
  template: any
}

export default function TemplateForm({ template }: Props) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [formData, setFormData] = useState({
    title: template.title || '',
    special_notes: template.special_notes || '',
    important_message: template.important_message || '',
    prepared_by_label: template.prepared_by_label || '',
    default_terms: template.default_terms || '',
    bank_name: template.bank_details?.bank_name || '',
    bank_branch: template.bank_details?.bank_branch || '',
    bank_account_name: template.bank_details?.bank_account_name || '',
    bank_account_number: template.bank_details?.bank_account_number || '',
    bank_swift_code: template.bank_details?.bank_swift_code || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const payload = {
      title: formData.title,
      special_notes: formData.special_notes,
      important_message: formData.important_message,
      prepared_by_label: formData.prepared_by_label,
      default_terms: formData.default_terms,
      bank_details: {
        bank_name: formData.bank_name,
        bank_branch: formData.bank_branch,
        bank_account_name: formData.bank_account_name,
        bank_account_number: formData.bank_account_number,
        bank_swift_code: formData.bank_swift_code,
      },
    }

    const res = await updateDocumentTemplate(template.document_type, payload)
    setLoading(false)

    if (res.success) {
      setMessage({ type: 'success', text: 'Template configuration saved successfully.' })
    } else {
      setMessage({ type: 'error', text: res.error || 'Failed to save template.' })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-6 shadow-sm">
      {message && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
              : 'bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400'
          }`}
        >
          {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* 1. Special Notes & Important Message */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-amber-500 border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-1.5">
          <FileText size={15} />
          <span>1. Default Notes & Messages</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Special Notes (Default list for new {template.document_type}s)
            </label>
            <textarea
              rows={4}
              value={formData.special_notes}
              onChange={(e) => setFormData({ ...formData, special_notes: e.target.value })}
              placeholder="e.g. 1. Quotation valid for 7 days. 2. Fuel level must match pickup level."
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Important Message (Footer highlight box)
            </label>
            <textarea
              rows={4}
              value={formData.important_message}
              onChange={(e) => setFormData({ ...formData, important_message: e.target.value })}
              placeholder="e.g. Thank you for choosing Thennakoon Tours for your journey!"
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* 2. Bank Account Details */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-amber-500 border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-1.5">
          <Building2 size={15} />
          <span>2. Bank Payment Instructions</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Bank Name</label>
            <input
              type="text"
              value={formData.bank_name}
              onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
              placeholder="Bank of Ceylon"
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Branch Name</label>
            <input
              type="text"
              value={formData.bank_branch}
              onChange={(e) => setFormData({ ...formData, bank_branch: e.target.value })}
              placeholder="Colombo Super Grade"
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Account Name</label>
            <input
              type="text"
              value={formData.bank_account_name}
              onChange={(e) => setFormData({ ...formData, bank_account_name: e.target.value })}
              placeholder="Thennakoon Tours (Pvt) Ltd"
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Account Number</label>
            <input
              type="text"
              value={formData.bank_account_number}
              onChange={(e) => setFormData({ ...formData, bank_account_number: e.target.value })}
              placeholder="000123456789"
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">SWIFT Code</label>
            <input
              type="text"
              value={formData.bank_swift_code}
              onChange={(e) => setFormData({ ...formData, bank_swift_code: e.target.value })}
              placeholder="BCEYLKLX"
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Prepared By Designation</label>
            <input
              type="text"
              value={formData.prepared_by_label}
              onChange={(e) => setFormData({ ...formData, prepared_by_label: e.target.value })}
              placeholder="Authorized Reservation Officer"
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* 3. Terms & Conditions */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-amber-500 border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-1.5">
          <Info size={15} />
          <span>3. Default Terms & Conditions</span>
        </h3>
        <div>
          <textarea
            rows={3}
            value={formData.default_terms}
            onChange={(e) => setFormData({ ...formData, default_terms: e.target.value })}
            placeholder="Standard terms and conditions applicable to this document..."
            className="w-full p-3 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
          />
        </div>
      </div>

      {/* Save Button */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs hover:bg-amber-300 transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
        >
          <Save size={16} />
          <span>{loading ? 'Saving Template...' : `Save ${template.title}`}</span>
        </button>
      </div>
    </form>
  )
}
