'use client'

import { useState, useRef } from 'react'
import { updateDocumentTemplate, resetDocumentTemplateToDefault } from './template-actions'
import {
  MERGE_TAGS_OWNER_AGREEMENT,
  MERGE_TAGS_USER_AGREEMENT,
  MergeTagDefinition,
} from '@/lib/agreements/template-renderer'
import {
  Save,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Building2,
  User,
  FileText,
  Info,
  Loader2,
  Code,
  Tag,
  Eye,
  Check,
} from 'lucide-react'
import SectionCardBuilder from './section-card-builder'

interface Props {
  template: any
}

export default function TemplateForm({ template }: Props) {
  const isAgreementTemplate =
    template.document_type === 'owner_agreement' ||
    template.document_type === 'user_agreement' ||
    template.document_type === 'user_extension_letter' ||
    template.document_type === 'owner_extension_letter'

  if (isAgreementTemplate) {
    return <SectionCardBuilder template={template} />
  }

  const [loading, setLoading] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [previewMode, setPreviewMode] = useState(false)
  const [copiedTag, setCopiedTag] = useState<string | null>(null)

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Form State
  const [bodyContent, setBodyContent] = useState<string>(template.body_content || '')
  const [formData, setFormData] = useState({
    display_name: template.display_name || '',
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

  // Merge tags for the active template
  const mergeTags: MergeTagDefinition[] =
    template.document_type === 'owner_agreement'
      ? MERGE_TAGS_OWNER_AGREEMENT
      : MERGE_TAGS_USER_AGREEMENT

  // Click-to-insert merge tag into textarea at cursor position
  const handleInsertTag = (tag: string) => {
    const textarea = textareaRef.current
    if (!textarea) {
      setBodyContent((prev) => prev + ' ' + tag)
      return
    }

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = bodyContent
    const before = text.substring(0, start)
    const after = text.substring(end, text.length)
    const nextText = before + tag + after

    setBodyContent(nextText)
    setCopiedTag(tag)
    setTimeout(() => setCopiedTag(null), 1500)

    // Reset cursor to directly after the inserted tag
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + tag.length, start + tag.length)
    }, 10)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setToast(null)

    const payload: any = {
      ...formData,
      body_content: isAgreementTemplate ? bodyContent : undefined,
    }

    const res = await updateDocumentTemplate(template.document_type, payload)
    setLoading(false)

    if (res.success) {
      setToast({ type: 'success', text: `${template.display_name || 'Template'} saved successfully!` })
    } else {
      setToast({ type: 'error', text: res.error || 'Failed to save document template.' })
    }
  }

  const handleReset = async () => {
    const confirmMsg = isAgreementTemplate
      ? 'Are you sure you want to restore the official Thennakoon Tours legal agreement clauses and merge tags? Any custom changes made to this template will be reset.'
      : 'Are you sure you want to reset this template to default system values?'

    if (!confirm(confirmMsg)) return
    setResetting(true)
    setToast(null)

    const res = await resetDocumentTemplateToDefault(template.document_type)
    setResetting(false)

    if (res.success && res.template) {
      if (res.template.body_content !== undefined) {
        setBodyContent(res.template.body_content || '')
      }
      setFormData({
        display_name: res.template.display_name || '',
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
      setToast({ type: 'success', text: 'Template restored to official system default wording!' })
    } else {
      setToast({ type: 'error', text: res.error || 'Failed to reset template.' })
    }
  }

  // Count tags used in bodyContent
  const tagsInContent = (bodyContent.match(/{{\s*([a-zA-Z0-9_-]+)\s*}}/g) || []).length

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-6 shadow-sm"
    >
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
          <button type="button" onClick={() => setToast(null)} className="text-xs font-bold underline">
            Dismiss
          </button>
        </div>
      )}

      {/* AGREEMENT MASTER TEMPLATE EDITOR */}
      {isAgreementTemplate ? (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <FileText size={17} className="text-amber-500" />
                <span>
                  {template.document_type === 'owner_agreement'
                    ? 'Vehicle Owner Agreement Master Legal Template'
                    : 'Customer User Agreement Master Legal Template'}
                </span>
              </h2>
              <p className="text-slate-400 text-xs">
                Edit official legal clauses, term covenants, and structure. Click any merge tag below to insert dynamic values.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                {tagsInContent} Dynamic Tags Inserted
              </span>
              <button
                type="button"
                onClick={() => setPreviewMode(!previewMode)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 flex items-center gap-1.5"
              >
                <Eye size={13} />
                <span>{previewMode ? 'Edit Mode' : 'Preview Format'}</span>
              </button>
            </div>
          </div>

          {/* Click-to-Insert Merge Tag Toolbar */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Tag size={14} className="text-amber-500" /> Click to Insert Merge Tag at Cursor:
              </span>
              <span className="text-[11px] text-slate-400 italic">
                Auto-fills with real booking/fleet/owner data on agreement generation
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {mergeTags.map((t) => {
                const isJustInserted = copiedTag === t.tag
                return (
                  <button
                    key={t.tag}
                    type="button"
                    onClick={() => handleInsertTag(t.tag)}
                    title={t.description || t.label}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all flex items-center gap-1 cursor-pointer ${
                      isJustInserted
                        ? 'bg-emerald-500 text-white font-bold scale-105 shadow-xs'
                        : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-amber-400 hover:text-amber-600 dark:hover:text-amber-400 hover:shadow-xs'
                    }`}
                  >
                    <span>{isJustInserted ? <Check size={12} /> : '+'}</span>
                    <span className="font-semibold">{t.label}</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">{t.tag}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Text Editor / Live Format */}
          {!previewMode ? (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block flex items-center justify-between">
                <span>Legal Agreement Body (Markdown / Text):</span>
                <span className="font-normal text-[11px] text-slate-400">
                  Monospace Editor • Preserves formatting, headings (###) and bold (**text**)
                </span>
              </label>
              <textarea
                ref={textareaRef}
                rows={24}
                required
                value={bodyContent}
                spellCheck={false}
                onChange={(e) => setBodyContent(e.target.value)}
                placeholder="Enter master agreement legal text..."
                className="w-full bg-slate-50/80 dark:bg-slate-950/60 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:border-amber-500 rounded-xl p-4 text-sm leading-relaxed"
                style={{ tabSize: 2 }}
              />
            </div>
          ) : (
            <div className="p-6 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 leading-relaxed font-serif whitespace-pre-wrap max-h-[600px] overflow-y-auto">
              {bodyContent}
            </div>
          )}
        </div>
      ) : (
        /* STANDARD DOCUMENT TEMPLATE EDITOR (Quotation, Invoice, Receipt) */
        <div className="space-y-6">
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
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Payment Instructions</label>
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
        </div>
      )}

      {/* Action Buttons: Save & Reset */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleReset}
          disabled={resetting || loading}
          className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          {resetting ? <Loader2 size={15} className="animate-spin" /> : <RotateCcw size={15} />}
          <span>{resetting ? 'Restoring...' : isAgreementTemplate ? 'Reset to Default Legal Template' : 'Reset to Default'}</span>
        </button>

        <button
          type="submit"
          disabled={loading || resetting}
          className="px-6 py-2.5 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs hover:bg-amber-300 transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          <span>
            {loading
              ? 'Saving Template...'
              : isAgreementTemplate
              ? `Save ${template.display_name || 'Master Template'}`
              : `Save ${template.document_type.toUpperCase()} Template`}
          </span>
        </button>
      </div>
    </form>
  )
}
