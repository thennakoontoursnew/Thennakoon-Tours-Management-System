'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { generateAgreementPDF } from '@/lib/documents/agreement-pdf'
import { ArrowLeft, Download, Loader2 } from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function AgreementPreviewPage({ params }: PageProps) {
  const { id } = use(params)
  const [agreement, setAgreement] = useState<any>(null)
  const [companySettings, setCompanySettings] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [pdfDataUrl, setPdfDataUrl] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      const supabase = createClient()

      const { data: a } = await supabase
        .from('rental_agreements')
        .select('*, customer:customers(*), booking:bookings(*)')
        .eq('id', id)
        .single()

      const { data: settings } = await supabase
        .from('company_settings')
        .select('*')
        .limit(1)
        .single()

      if (a) {
        setAgreement(a)
        setCompanySettings(settings)

        const pdfDoc = await generateAgreementPDF(a, settings)
        const dataUrl = pdfDoc.output('dataurlstring')
        setPdfDataUrl(dataUrl)
      }
      setLoading(false)
    }

    loadData()
  }, [id])

  const handleDownload = async () => {
    if (!agreement) return
    const pdfDoc = await generateAgreementPDF(agreement, companySettings)
    pdfDoc.save(`Agreement-${agreement.agreement_number}.pdf`)
  }

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <Loader2 size={32} className="mx-auto text-amber-500 animate-spin" />
        <p className="text-xs font-bold text-slate-500">Generating Rental Agreement PDF...</p>
      </div>
    )
  }

  if (!agreement) {
    return <div className="p-8 text-center text-xs text-rose-500">Agreement not found.</div>
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/agreements"
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">Rental Agreement ({agreement.agreement_number})</h1>
            <p className="text-xs text-slate-500">Official letterhead background rendered.</p>
          </div>
        </div>
        <button
          onClick={handleDownload}
          className="px-4 py-2 bg-amber-400 text-slate-950 font-bold rounded-xl text-xs hover:bg-amber-300 transition-all flex items-center gap-1.5 shadow-sm"
        >
          <Download size={15} />
          <span>Download Agreement PDF</span>
        </button>
      </div>

      <div className="bg-slate-800 p-2 rounded-2xl border border-slate-700 shadow-xl overflow-hidden min-h-[700px]">
        {pdfDataUrl ? (
          <iframe src={pdfDataUrl} className="w-full h-[750px] rounded-xl bg-white" title="Agreement PDF" />
        ) : (
          <div className="p-12 text-center text-white text-xs">Failed to render PDF.</div>
        )}
      </div>
    </div>
  )
}
