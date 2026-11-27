'use client'

import { useState, useRef, useEffect } from 'react'
import {
  AgreementSection,
  DEFAULT_OWNER_AGREEMENT_SECTIONS,
  DEFAULT_USER_AGREEMENT_SECTIONS,
  resolveAgreementSections,
  sectionsToMarkdown,
} from '@/lib/agreements/section-template-renderer'
import {
  MERGE_TAGS_OWNER_AGREEMENT,
  MERGE_TAGS_USER_AGREEMENT,
  MergeTagDefinition,
} from '@/lib/agreements/template-renderer'
import {
  MERGE_TAGS_EXTENSION_LETTER,
  DEFAULT_USER_EXTENSION_LETTER_SECTIONS,
  DEFAULT_OWNER_EXTENSION_LETTER_SECTIONS,
} from '@/lib/agreements/extension-template-renderer'
import { LegalDocumentViewer } from '@/lib/agreements/legal-document-viewer'
import { ExtensionLetterContentRenderer } from '@/components/agreements/extension-letter-content-renderer'
import { updateDocumentTemplate, resetDocumentTemplateToDefault } from './template-actions'
import {
  Plus,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  Save,
  RotateCcw,
  Eye,
  Edit3,
  GripVertical,
  Tag,
  Check,
  AlertCircle,
  CheckCircle2,
  Loader2,
  FileText,
  Search,
  SlidersHorizontal,
} from 'lucide-react'

interface Props {
  template: any
}

// Sample variables for live preview rendering
const SAMPLE_PREVIEW_VARS: Record<string, string> = {
  agreement_number: 'OAG-2026-889201',
  agreement_date: '25th November 2026',
  term_duration: '01 MONTH',
  start_date: '25/11/2026',
  end_date: '24/12/2026',
  handover_date: '25/11/2026',
  rental_start: '25/11/2026 09:00 AM',
  rental_end: '24/12/2026 06:00 PM',
  rental_period: '30 Days',
  owner_name: 'Sampath Wickramasinghe',
  owner_nic: '841920384V',
  owner_address: 'No. 42, Temple Road, Maharagama, Sri Lanka',
  owner_phone: '+94 77 123 4567',
  owner_email: 'sampath.w@example.com',
  lessee_name: 'Johnathan Doe (Pvt) Ltd',
  lessee_nic: '912049281V',
  lessee_address: 'No. 18, Galle Road, Colombo 03',
  lessee_phone: '+94 71 987 6543',
  vehicle_model: 'Toyota KDH 200 Super GL High Roof',
  vehicle_reg_no: 'WP CBA-7890',
  chassis_no: 'TRH200-0198421',
  engine_no: '1TR-FE-77291',
  monthly_rental: '350,000',
  total_rental: '350,000',
  daily_rate: '15,000',
  deposit_amount: '50,000',
  km_limit: '3,000',
  payment_day: '30th',
  monthly_km_quota: '3,000',
  excess_km_rate: '117',
  service_km: '5,000',
  renewal_charge: '3,000',
  bank_account_name: 'Sampath Wickramasinghe',
  bank_name: 'Commercial Bank of Ceylon',
  bank_branch: 'Maharagama Branch',
  bank_account_no: '800492018402',
  company_rep_name: 'HBNK Dissanayaka',
  company_rep_designation: 'Technical Officer',
  company_rep_nic: '881843935V',
  company_witness_name: 'Kavindu Senanayake',
  company_witness_nic: '961029482V',
  owner_witness_name: 'Dinesh Perera',
  owner_witness_nic: '852039182V',
  owner_witness_address: 'No. 12, Park Road, Nugegoda',
  owner_witness_phone: '+94 77 443 2211',
  special_remarks: 'All maintenance and tire wear will be inspected every 5,000 Km.',
  special_notes: 'Vehicle must be returned with full tank of fuel.',
  issue_date: '27th Nov 2026',
  extension_number: 'EXT-2026-000018',
  recipient_name: 'Sampath Wickramasinghe',
  extension_duration_label: '06 Months',
  new_end_date: '27th May 2027',
  renewal_amount: '350,000.00',
  currency: 'LKR',
  original_agreement_ref: 'OAG-2026-889201 dated 25th Aug 2026',
  custom_notes: 'All routine servicing intervals remain at every 5,000 Km.',
}

interface BuilderConfig {
  isOwner: boolean
  isExtension: boolean
  badgeLabel: string
  builderHeading: string
  builderSubtitle: string
  cardPrefix: string
  defaultSections: AgreementSection[]
  availableTags: MergeTagDefinition[]
}

function getBuilderConfig(documentType: string): BuilderConfig {
  if (documentType === 'user_extension_letter') {
    return {
      isOwner: false,
      isExtension: true,
      badgeLabel: 'User Extension Letter',
      builderHeading: 'Extension Letter Section Builder',
      builderSubtitle:
        'Customize the formal letterhead paragraphs and dynamic merge tags for Customer Rental Extension Letters.',
      cardPrefix: 'Section',
      defaultSections: DEFAULT_USER_EXTENSION_LETTER_SECTIONS,
      availableTags: MERGE_TAGS_EXTENSION_LETTER,
    }
  }
  if (documentType === 'owner_extension_letter') {
    return {
      isOwner: true,
      isExtension: true,
      badgeLabel: 'Owner Extension Letter',
      builderHeading: 'Extension Letter Section Builder',
      builderSubtitle:
        'Customize the formal letterhead paragraphs and dynamic merge tags for Vehicle Owner Extension Letters.',
      cardPrefix: 'Section',
      defaultSections: DEFAULT_OWNER_EXTENSION_LETTER_SECTIONS,
      availableTags: MERGE_TAGS_EXTENSION_LETTER,
    }
  }
  if (documentType === 'owner_agreement') {
    return {
      isOwner: true,
      isExtension: false,
      badgeLabel: 'Vehicle Owner Agreement',
      builderHeading: 'Section-by-Section Legal Builder',
      builderSubtitle:
        'Each clause is an independent card. Reorder, edit, insert dynamic merge tags, or add custom covenants.',
      cardPrefix: 'Clause',
      defaultSections: DEFAULT_OWNER_AGREEMENT_SECTIONS,
      availableTags: MERGE_TAGS_OWNER_AGREEMENT,
    }
  }
  return {
    isOwner: false,
    isExtension: false,
    badgeLabel: 'User Rental Agreement',
    builderHeading: 'Section-by-Section Legal Builder',
    builderSubtitle:
      'Each clause is an independent card. Reorder, edit, insert dynamic merge tags, or add custom covenants.',
    cardPrefix: 'Clause',
    defaultSections: DEFAULT_USER_AGREEMENT_SECTIONS,
    availableTags: MERGE_TAGS_USER_AGREEMENT,
  }
}

export default function SectionCardBuilder({ template }: Props) {
  const {
    isOwner,
    isExtension,
    badgeLabel,
    builderHeading,
    builderSubtitle,
    cardPrefix,
    defaultSections,
    availableTags,
  } = getBuilderConfig(template.document_type)

  const initialSections: AgreementSection[] =
    template.sections_json && Array.isArray(template.sections_json) && template.sections_json.length > 0
      ? template.sections_json
      : defaultSections

  const [sections, setSections] = useState<AgreementSection[]>(initialSections)
  const [displayName, setDisplayName] = useState(template.display_name || '')
  const [activeCardId, setActiveCardId] = useState<string | null>(initialSections[0]?.id || null)
  const [previewMode, setPreviewMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [tagSearch, setTagSearch] = useState('')
  const [selectedTagCategory, setSelectedTagCategory] = useState<string>('all')
  const [copiedTag, setCopiedTag] = useState<string | null>(null)

  // Map of textarea refs by section ID
  const textareaRefs = useRef<Record<string, HTMLTextAreaElement | null>>({})

  // Auto-adjust textarea height dynamically based on content (no inner scrollbars)
  const adjustTextareaHeight = (el: HTMLTextAreaElement | null) => {
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.max(100, el.scrollHeight)}px`
  }

  // Adjust all visible card textareas on mount, tab changes, or section count changes
  useEffect(() => {
    const timer = setTimeout(() => {
      sections.forEach((sec) => {
        const el = textareaRefs.current[sec.id]
        if (el) {
          adjustTextareaHeight(el)
        }
      })
    }, 50)
    return () => clearTimeout(timer)
  }, [sections.length, previewMode])

  const categories = [
    { id: 'all', label: 'All Tags' },
    { id: 'dates', label: 'Dates & Term' },
    { id: 'party', label: 'Parties' },
    { id: 'vehicle', label: 'Vehicle' },
    { id: 'financial', label: 'Financials' },
    { id: 'bank', label: 'Bank' },
    { id: 'signatories', label: 'Signatories' },
    { id: 'notes', label: 'Notes' },
  ].filter((c) => c.id === 'all' || availableTags.some((t) => t.category === c.id))

  const filteredTags = availableTags.filter((t) => {
    const matchesCategory = selectedTagCategory === 'all' || t.category === selectedTagCategory
    const matchesSearch =
      !tagSearch ||
      t.tag.toLowerCase().includes(tagSearch.toLowerCase()) ||
      t.label.toLowerCase().includes(tagSearch.toLowerCase())
    return matchesCategory && matchesSearch
  })

  // 1. Move Section Up
  const handleMoveUp = (index: number) => {
    if (index === 0) return
    setSections((prev) => {
      const next = [...prev]
      const temp = next[index - 1]
      next[index - 1] = next[index]
      next[index] = temp
      return next.map((s, idx) => ({ ...s, order: idx + 1 }))
    })
  }

  // 2. Move Section Down
  const handleMoveDown = (index: number) => {
    if (index === sections.length - 1) return
    setSections((prev) => {
      const next = [...prev]
      const temp = next[index + 1]
      next[index + 1] = next[index]
      next[index] = temp
      return next.map((s, idx) => ({ ...s, order: idx + 1 }))
    })
  }

  // 3. Duplicate Section
  const handleDuplicate = (index: number) => {
    const target = sections[index]
    const clone: AgreementSection = {
      ...target,
      id: `sec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: `${target.title} (Copy)`,
    }
    setSections((prev) => {
      const next = [...prev]
      next.splice(index + 1, 0, clone)
      return next.map((s, idx) => ({ ...s, order: idx + 1 }))
    })
    setActiveCardId(clone.id)
  }

  // 4. Delete Section
  const handleDelete = (id: string) => {
    if (sections.length <= 1) {
      alert('An agreement template must have at least one section.')
      return
    }
    if (!confirm('Are you sure you want to delete this section card?')) return
    setSections((prev) => {
      const next = prev.filter((s) => s.id !== id)
      return next.map((s, idx) => ({ ...s, order: idx + 1 }))
    })
  }

  // 5. Add New Section
  const handleAddSection = () => {
    const newSec: AgreementSection = {
      id: `sec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      order: sections.length + 1,
      title: `NEW CLAUSE ${sections.length + 1}`,
      body: '',
    }
    setSections((prev) => [...prev, newSec])
    setActiveCardId(newSec.id)

    setTimeout(() => {
      const el = textareaRefs.current[newSec.id]
      if (el) {
        el.focus()
        adjustTextareaHeight(el)
      }
    }, 50)
  }

  // 6. Update Section Fields
  const updateSection = (id: string, updates: Partial<AgreementSection>) => {
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)))
  }

  // 7. Insert Tag into currently focused or selected card
  const handleInsertTag = (tag: string, targetId?: string) => {
    const sectionId = targetId || activeCardId || sections[0]?.id
    if (!sectionId) return

    const textarea = textareaRefs.current[sectionId]
    const targetSection = sections.find((s) => s.id === sectionId)
    if (!targetSection) return

    if (!textarea) {
      updateSection(sectionId, { body: (targetSection.body ? targetSection.body + ' ' : '') + tag })
    } else {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const text = targetSection.body || ''
      const before = text.substring(0, start)
      const after = text.substring(end, text.length)
      const nextText = before + tag + after

      updateSection(sectionId, { body: nextText })

      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(start + tag.length, start + tag.length)
        adjustTextareaHeight(textarea)
      }, 10)
    }

    setCopiedTag(tag)
    setTimeout(() => setCopiedTag(null), 1200)
  }

  // 8. Save Template Action
  const handleSave = async () => {
    setSaving(true)
    setToast(null)

    const normalizedSections = sections.map((s, idx) => ({ ...s, order: idx + 1 }))
    const res = await updateDocumentTemplate(template.document_type, {
      display_name: displayName,
      sections_json: normalizedSections,
      body_content: sectionsToMarkdown(normalizedSections),
    })

    setSaving(false)
    if (res.success) {
      setToast({ type: 'success', text: 'Master Agreement Template saved successfully!' })
      setTimeout(() => setToast(null), 4000)
    } else {
      setToast({ type: 'error', text: res.error || 'Failed to save template.' })
    }
  }

  // 9. Reset to Official Default Legal Clauses
  const handleReset = async () => {
    const confirmMsg =
      'Are you sure you want to restore the official Thennakoon Tours legal agreement clauses and merge tags? Any custom modifications will be replaced by the system defaults.'

    if (!confirm(confirmMsg)) return

    setResetting(true)
    setToast(null)

    const res = await resetDocumentTemplateToDefault(template.document_type)
    setResetting(false)

    if (res.success && res.template) {
      const restored =
        res.template.sections_json && res.template.sections_json.length > 0
          ? res.template.sections_json
          : defaultSections
      setSections(restored)
      setDisplayName(res.template.display_name || displayName)
      setActiveCardId(restored[0]?.id || null)
      setToast({ type: 'success', text: 'Template successfully reset to official Thennakoon Tours legal defaults!' })
      setTimeout(() => setToast(null), 4000)
    } else {
      setToast({ type: 'error', text: res.error || 'Failed to reset template.' })
    }
  }

  // Resolved sections for live preview
  const resolvedPreviewSections = resolveAgreementSections(sections, SAMPLE_PREVIEW_VARS)

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                {badgeLabel}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                {sections.length} {cardPrefix}
                {sections.length === 1 ? '' : 's'}
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-1">{builderHeading}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">{builderSubtitle}</p>
          </div>

          {/* Mode Switcher & Save Button */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setPreviewMode(!previewMode)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                previewMode
                  ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-md font-black'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-750'
              }`}
            >
              {previewMode ? <Edit3 size={14} /> : <Eye size={14} />}
              {previewMode ? 'Back to Editor' : 'Live Document Preview'}
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 rounded-xl text-xs font-black bg-amber-400 text-slate-950 hover:bg-amber-300 transition-all flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {saving ? 'Saving...' : 'Save Master Template'}
            </button>
          </div>
        </div>

        {/* Template Display Name Input */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center gap-3">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">Template Name:</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Master Agreement Template Name"
            className="flex-1 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-400"
          />
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs animate-in fade-in duration-200 ${
            toast.type === 'success'
              ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/70 border-rose-500/40 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{toast.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="text-xs hover:opacity-75 cursor-pointer font-bold ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* PREVIEW MODE */}
      {previewMode ? (
        <div className="space-y-4">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye size={15} className="text-amber-400" />
              <span>
                <strong>Live Preview:</strong> Showing how your master agreement renders with sample operational data.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setPreviewMode(false)}
              className="text-xs font-bold text-amber-400 hover:underline cursor-pointer"
            >
              Return to Card Editor
            </button>
          </div>

          {isExtension ? (
            <div className="relative w-full max-w-[210mm] min-h-[297mm] mx-auto bg-white text-slate-900 shadow-2xl overflow-hidden rounded-sm">
              <img
                src="/documents/thennakoon-tours-letterhead.png"
                alt="Thennakoon Tours Official Letterhead"
                className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none z-0"
              />
              <div
                className="relative z-10 flex flex-col justify-between min-h-[297mm]"
                style={{
                  padding: '47mm 18mm 54mm 18mm',
                  fontFamily: 'Georgia, Cambria, "Times New Roman", Times, serif',
                }}
              >
                <ExtensionLetterContentRenderer sections={resolvedPreviewSections} />

                <div className="mt-10 pt-4 grid grid-cols-2 gap-12 font-sans text-slate-900">
                  <div className="flex flex-col">
                    <p className="text-[11px] text-slate-600 font-medium">Issued For &amp; On Behalf of</p>
                    <p className="text-[12.5px] font-bold text-slate-950">Thennakoon Tours (Pvt) Ltd</p>
                    <div className="h-16 flex items-end my-1">
                      <span className="text-[11px] italic text-slate-400 pb-2">
                        [Staff Digital Signature + Official Seal]
                      </span>
                    </div>
                    <div className="border-t border-slate-500 pt-1.5">
                      <p className="text-[12.5px] font-bold text-slate-950">
                        {SAMPLE_PREVIEW_VARS.company_rep_name}
                      </p>
                      <p className="text-[11px] text-slate-600 font-medium">
                        {SAMPLE_PREVIEW_VARS.company_rep_designation}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <p className="text-[11px] text-slate-600 font-medium">Acknowledged &amp; Accepted By</p>
                    <p className="text-[12.5px] font-bold text-slate-950">
                      {isOwner ? 'Vehicle Owner' : 'Customer / Authorized Signatory'}
                    </p>
                    <div className="h-16" />
                    <div className="border-t border-slate-500 pt-1.5 space-y-0.5">
                      <p className="text-[12.5px] font-bold text-slate-950">
                        {SAMPLE_PREVIEW_VARS.recipient_name}
                      </p>
                      <p className="text-[11px] text-slate-600 font-medium">Signature</p>
                      <p className="text-[11px] text-slate-600 pt-1">Date / NIC: ______________________</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* White Paper Simulation */
            <div
              className="w-full max-w-[210mm] mx-auto bg-white text-slate-900 shadow-2xl rounded-sm p-10 md:p-14 space-y-6 text-[12px] leading-[1.65] font-serif"
              style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", Times, serif' }}
            >
              {/* Formal Header */}
              <div className="border-b-2 border-slate-900 pb-4 text-center space-y-1">
                <h1 className="text-xl font-bold tracking-wide uppercase text-slate-900 font-sans">
                  THENNAKOON TOURS (PRIVATE) LIMITED
                </h1>
                <p className="text-[10px] text-slate-600 font-sans">
                  Company Registration No: <strong>PV 00312253</strong> • Registered under the Companies Act No. 07 of 2007
                </p>
                <p className="text-[10px] text-slate-600 font-sans">
                  Registered Office: No. 146/5A, Dutugamunu Street, Caldera Gardens, Kohuwala, Sri Lanka.
                </p>
              </div>

              {/* Rendered Sections Viewer */}
              <LegalDocumentViewer sections={resolvedPreviewSections} />
            </div>
          )}
        </div>
      ) : (
        /* SECTION CARDS BUILDER (GOOGLE-FORMS STYLE) */
        <div className="space-y-6">
          {/* Global Quick Merge Tag Palette Bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                <Tag size={14} className="text-amber-500" />
                <span>Click-to-Insert Merge Tags</span>
                <span className="text-[10px] text-slate-400 font-normal">
                  (Inserts tag at cursor in active card)
                </span>
              </div>

              {/* Tag Search Input */}
              <div className="relative w-full sm:w-60">
                <Search size={13} className="absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter merge tags..."
                  value={tagSearch}
                  onChange={(e) => setTagSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedTagCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    selectedTagCategory === cat.id
                      ? 'bg-amber-400/20 text-amber-700 dark:text-amber-300 border border-amber-400/40 font-bold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700/60 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Tag Pills */}
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
              {filteredTags.map((t) => {
                const isJustCopied = copiedTag === t.tag
                return (
                  <button
                    key={t.tag}
                    type="button"
                    onClick={() => handleInsertTag(t.tag)}
                    title={t.description || t.label}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-all flex items-center gap-1 cursor-pointer border ${
                      isJustCopied
                        ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-emerald-500/40 scale-105'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-amber-400 hover:text-amber-600 dark:hover:text-amber-300 hover:bg-amber-50/50 dark:hover:bg-slate-750'
                    }`}
                  >
                    {isJustCopied ? <Check size={11} className="text-emerald-500" /> : <Tag size={10} className="text-slate-400" />}
                    <span>{t.tag}</span>
                    <span className="text-[10px] text-slate-400 font-sans">({t.label})</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Cards List */}
          <div className="space-y-4">
            {sections.map((section, index) => {
              const isActive = activeCardId === section.id
              return (
                <div
                  key={section.id}
                  onClick={() => setActiveCardId(section.id)}
                  className={`relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-5 md:p-6 transition-all ${
                    isActive
                      ? 'border-l-4 border-l-amber-500 shadow-md ring-1 ring-amber-500/10'
                      : 'hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  {/* Card Header: Reordering, Section Title & Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 flex-1">
                      <div className="cursor-grab text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
                        <GripVertical size={16} />
                      </div>
                      <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-mono">
                        {cardPrefix} {index + 1}
                      </span>
                      <input
                        type="text"
                        value={section.title}
                        onChange={(e) => updateSection(section.id, { title: e.target.value })}
                        placeholder={
                          isExtension
                            ? 'Section Label (e.g. Extension Period & Charges)'
                            : 'Section Title (e.g. 1. TERM & COMMENCEMENT)'
                        }
                        className="flex-1 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/60 focus:bg-slate-50 dark:focus:bg-slate-800 text-slate-900 dark:text-white font-bold text-base border-b border-transparent focus:border-amber-500 px-2 py-1 rounded-md transition-colors focus:outline-none placeholder-slate-400"
                      />
                    </div>

                    {/* Action Buttons: Move Up, Move Down, Duplicate, Delete */}
                    <div className="flex items-center gap-1 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleMoveUp(index)
                        }}
                        disabled={index === 0}
                        title="Move Up"
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 disabled:opacity-30 disabled:hover:bg-slate-100 dark:disabled:hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <ChevronUp size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleMoveDown(index)
                        }}
                        disabled={index === sections.length - 1}
                        title="Move Down"
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 disabled:opacity-30 disabled:hover:bg-slate-100 dark:disabled:hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <ChevronDown size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDuplicate(index)
                        }}
                        title="Duplicate Section"
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                      >
                        <Copy size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(section.id)
                        }}
                        disabled={sections.length <= 1}
                        title="Delete Section"
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 hover:text-rose-600 dark:hover:text-rose-400 disabled:opacity-30 transition-colors cursor-pointer"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Card Body: Textarea */}
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                      <span>
                        {isExtension ? 'Letter Paragraph / Section Wording:' : 'Clause Wording & Legal Covenants:'}
                      </span>
                      {!isExtension ? (
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200">
                            <input
                              type="checkbox"
                              checked={Boolean(section.is_schedule)}
                              onChange={(e) => updateSection(section.id, { is_schedule: e.target.checked })}
                              className="rounded border-slate-300 dark:border-slate-700 text-amber-500 focus:ring-amber-400/20"
                            />
                            <span>Schedule / Table block</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200">
                            <input
                              type="checkbox"
                              checked={Boolean(section.is_signatories)}
                              onChange={(e) => updateSection(section.id, { is_signatories: e.target.checked })}
                              className="rounded border-slate-300 dark:border-slate-700 text-amber-500 focus:ring-amber-400/20"
                            />
                            <span>Signatures block</span>
                          </label>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400">
                          Signature &amp; Company Seal appear automatically at bottom of letterhead
                        </span>
                      )}
                    </div>

                    <textarea
                      ref={(el) => {
                        textareaRefs.current[section.id] = el
                        if (el) adjustTextareaHeight(el)
                      }}
                      value={section.body}
                      spellCheck={false}
                      onFocus={() => setActiveCardId(section.id)}
                      onChange={(e) => {
                        updateSection(section.id, { body: e.target.value })
                        adjustTextareaHeight(e.target)
                      }}
                      placeholder="Write standard legal wording and insert {{merge_tags}} here..."
                      className="w-full bg-slate-50/80 dark:bg-slate-950/60 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:border-amber-500 rounded-xl p-4 text-sm leading-relaxed overflow-hidden resize-none focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Active Card Merge Tag Shortcut Row */}
                  {isActive && (
                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                      <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Tag size={12} className="text-amber-500" />
                        Click-to-insert into this {cardPrefix.toLowerCase()}:
                      </span>
                      <div className="flex flex-wrap items-center gap-1">
                        {availableTags.slice(0, isExtension ? 10 : 6).map((t) => (
                          <button
                            key={t.tag}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleInsertTag(t.tag, section.id)
                            }}
                            title={t.description || t.label}
                            className="px-2 py-0.5 rounded bg-slate-100 hover:bg-amber-50 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 text-[10px] text-slate-700 dark:text-slate-300 font-medium hover:text-amber-600 dark:hover:text-amber-400 hover:border-amber-400 transition-colors whitespace-nowrap cursor-pointer"
                          >
                            + {t.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Bottom Floating Action Bar */}
          <div className="sticky bottom-6 z-20 bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700/90 rounded-2xl p-4 shadow-2xl backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAddSection}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Plus size={15} className="text-amber-500" />
                Add New Section Card
              </button>

              <button
                type="button"
                onClick={handleReset}
                disabled={resetting}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
              >
                {resetting ? <Loader2 size={15} className="animate-spin" /> : <RotateCcw size={15} />}
                Reset to Default Legal Template
              </button>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono hidden md:inline">
                {sections.length} total clauses
              </span>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-black bg-amber-400 text-slate-950 hover:bg-amber-300 transition-all flex items-center justify-center gap-2 shadow-xl shadow-amber-400/20 cursor-pointer disabled:opacity-50"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {saving ? 'Saving...' : 'Save Master Template'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
