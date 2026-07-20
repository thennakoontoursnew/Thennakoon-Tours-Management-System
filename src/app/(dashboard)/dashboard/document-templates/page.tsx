import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import TemplateForm from './template-form'
import { FileSpreadsheet, Receipt, FileText, CheckCircle2, ShieldAlert } from 'lucide-react'

interface PageProps {
  searchParams: Promise<{ type?: string }>
}

export default async function DocumentTemplatesPage({ searchParams }: PageProps) {
  const { type = 'quotation' } = await searchParams
  const supabase = await createClient()

  const { data: templates } = await supabase
    .from('document_templates')
    .select('*')
    .order('document_type')

  const activeTemplate = templates?.find((t) => t.document_type === type) || templates?.[0]

  const tabs = [
    { type: 'quotation', label: 'Quotation Template', icon: FileSpreadsheet },
    { type: 'invoice', label: 'Invoice Template', icon: Receipt },
    { type: 'receipt', label: 'Receipt Template', icon: CheckCircle2 },
    { type: 'rental_agreement', label: 'Rental Agreement Template', icon: FileText },
  ]

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Document Templates</h1>
        <p className="text-xs text-slate-500">Configure default special notes, messages, bank instructions, and prepared-by signatures.</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = (type || 'quotation') === tab.type
          return (
            <Link
              key={tab.type}
              href={`/dashboard/document-templates?type=${tab.type}`}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                isActive
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
            </Link>
          )
        })}
      </div>

      {/* Notice */}
      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 flex items-center gap-2">
        <ShieldAlert size={18} className="shrink-0" />
        <span>
          <strong>Template Safety Rules:</strong> Saved template settings auto-fill new document forms. Saving a document stores an immutable snapshot in the document record. Updating templates here will <strong>never</strong> modify previously issued documents.
        </span>
      </div>

      {/* Template Form */}
      {activeTemplate ? (
        <TemplateForm key={activeTemplate.document_type} template={activeTemplate} />
      ) : (
        <div className="p-8 text-center text-xs text-slate-400">Template not found.</div>
      )}
    </div>
  )
}
