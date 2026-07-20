'use client'

import { useState } from 'react'
import { updateDocumentTemplate, resetDocumentTemplateToDefault } from './template-actions'
import { Save, RotateCcw, CheckCircle, AlertCircle, Building2, User, FileText, Info, Loader2 } from 'lucide-react'

interface Props {
  template: any
}

export default function TemplateForm({ template }: Props) {
  const [loading, setLoading] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [formData, setFormData] = useState({
    special_notes: template.special_notes || '',
    important_message: template.important_message || '',
    bank_account_name: template.bank_account_name || '',
    bank_name: template.bank_name || '',
    bank_branch: template.bank_branch || '',
    bank_account_number: template.bank_account_number || '',
    bank_swift_code: template.bank_swift_code || '',
    payment_instructions: template.payment_instructions || '',
    prepared_by_designation: template.prepared_by_designation || '',
    company_name: template.company_name || '',
    default_terms_and_conditions: template.default_terms_and_conditions || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setToast(null)

    const res = await updateDocumentTemplate(template.document_type, formData)
    setLoading(false)

    if (res.success) {
      setToast({ type: 'success', text: 'Document template saved successfully!' })
    } else {
      setToast({ type: 'error', text: res.error || 'Failed to save document template.' })
    }
  }

  const handleReset = async () => {
    if (!confirm('Are you sure you want to reset this template to default system values?')) return
    setResetting(true)
    setToast(null)

    const res = await resetDocumentTemplateToDefault(template.document_type)
    setResetting(false)

    if (res.success && res.template) {
      setFormData({
        special_notes: res.template.special_notes || '',
        important_message: res.template.important_message || '',
        bank_account_name: res.template.bank_account_name || '',
        bank_name: res.template.bank_name || '',
        bank_branch: res.template.bank_branch || '',
        bank_account_number: res.template.bank_account_number || '',
        bank_swift_code: res.template.bank_swift_code || '',
        payment_instructions: res.template.payment_instructions || '',
        prepared_by_designation: res.template.prepared_by_designation || '',
        company_name: res.template.company_name || '',
        default_terms_and_conditions: res.template.default_terms_and_conditions || '',
      })
      setToast({ type: 'success', text: 'Template reset to system default values!' })
    } else {
      setToast({ type: 'error', text: res.error || 'Failed to reset template.' })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-6 shadow-sm">
      {/* Toast Notification Banner */}
      {toast && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center justify-between transition-all ${
            toast.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
              : 'bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400'
          }`}
        >
          <div className="flex items-center gap-2">
            {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            <span className="font-semibold">{toast.text}</span>
          </div>
          <button type="button" onClick={() => setToast(null)} className="text-xs font-bold underline">Dismiss</button>
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
              Special Notes (Multiline Textarea)
            </label>
            <textarea
              rows={6}
              value={formData.special_notes}
              onChange={(e) => setFormData({ ...formData, special_notes: e.target.value })}
              placeholder="Enter special notes..."
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Important Message (Multiline Textarea)
            </label>
            <textarea
              rows={6}
              value={formData.important_message}
              onChange={(e) => setFormData({ ...formData, important_message: e.target.value })}
              placeholder="Enter important message box text..."
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* 2. Bank Details */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-amber-500 border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-1.5">
          <Building2 size={15} />
          <span>2. Bank Details & Payment Instructions</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Bank Name</label>
            <input
              type="text"
              value={formData.bank_name}
              onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
              placeholder="Nations Trust Bank"
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Branch Name</label>
            <input
              type="text"
              value={formData.bank_branch}
              onChange={(e) => setFormData({ ...formData, bank_branch: e.target.value })}
              placeholder="Nugegoda"
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Account Number</label>
            <input
              type="text"
              value={formData.bank_account_number}
              onChange={(e) => setFormData({ ...formData, bank_account_number: e.target.value })}
              placeholder="100530013140"
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Swift Code</label>
            <input
              type="text"
              value={formData.bank_swift_code}
              onChange={(e) => setFormData({ ...formData, bank_swift_code: e.target.value })}
              placeholder="NTBCLKLX"
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none font-mono"
            />
          </div>
          <div className="sm:col-span-3">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Payment Instructions (Multiline)</label>
            <textarea
              rows={2}
              value={formData.payment_instructions}
              onChange={(e) => setFormData({ ...formData, payment_instructions: e.target.value })}
              placeholder="Instructions for customer payment transfers..."
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* 3. Prepared By & Company Name */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-amber-500 border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-1.5">
          <User size={15} />
          <span>3. Prepared By & Company Name</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Default Prepared By Designation</label>
            <input
              type="text"
              value={formData.prepared_by_designation}
              onChange={(e) => setFormData({ ...formData, prepared_by_designation: e.target.value })}
              placeholder="Admin & Marketing Assistant"
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Company Name</label>
            <input
              type="text"
              value={formData.company_name}
              onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
              placeholder="Thennakoon Tours (Pvt) Ltd"
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* 4. Default Terms and Conditions */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-amber-500 border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-1.5">
          <Info size={15} />
          <span>4. Default Terms and Conditions</span>
        </h3>
        <div>
          <textarea
            rows={3}
            value={formData.default_terms_and_conditions}
            onChange={(e) => setFormData({ ...formData, default_terms_and_conditions: e.target.value })}
            placeholder="Standard terms and conditions..."
            className="w-full p-3 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
          />
        </div>
      </div>

      {/* Action Buttons: Save & Reset */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleReset}
          disabled={resetting || loading}
          className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          {resetting ? <Loader2 size={15} className="animate-spin" /> : <RotateCcw size={15} />}
          <span>{resetting ? 'Resetting...' : 'Reset to Default'}</span>
        </button>

        <button
          type="submit"
          disabled={loading || resetting}
          className="px-6 py-2.5 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs hover:bg-amber-300 transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          <span>{loading ? 'Saving Template...' : `Save ${template.document_type.toUpperCase()} Template`}</span>
        </button>
      </div>
    </form>
  )
}
