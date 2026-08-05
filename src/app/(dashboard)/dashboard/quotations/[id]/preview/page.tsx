'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { generateQuotationPDF } from '@/lib/documents/quotation-pdf'
import { ArrowLeft, Download, Share2, Loader2, AlertCircle } from 'lucide-react'
import { buildWhatsAppQuotationMessage, buildWhatsAppQuotationUrl } from '@/lib/utils/formatters'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function QuotationPreviewPage({ params }: PageProps) {
  const { id } = use(params)
  const [quotation, setQuotation] = useState<any>(null)
  const [companySettings, setCompanySettings] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [renderError, setRenderError] = useState<string | null>(null)
  const [sharing, setSharing] = useState(false)

  useEffect(() => {
    let objectUrl: string | null = null

    async function loadData() {
      try {
        const supabase = createClient()

        const { data: q, error: qErr } = await supabase
          .from('quotations')
          .select('*, customer:customers(*), items:quotation_items(*)')
          .eq('id', id)
          .single()

        if (qErr || !q) {
          setRenderError('Quotation record could not be loaded.')
          setLoading(false)
          return
        }

        const { data: settings } = await supabase
          .from('company_settings')
          .select('*')
          .limit(1)
          .maybeSingle()

        setQuotation(q)
        setCompanySettings(settings)

        const pdfDoc = await generateQuotationPDF(q, settings)
        const blob = pdfDoc.output('blob')

        if (blob.size < 5000) {
          setRenderError('PDF generation produced an incomplete document.')
          setLoading(false)
          return
        }

        objectUrl = URL.createObjectURL(blob)
        setPdfUrl(objectUrl)
      } catch (err: any) {
        console.error('Error generating PDF preview:', err)
        setRenderError(err.message || 'Unable to generate quotation preview.')
      } finally {
        setLoading(false)
      }
    }

    loadData()

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [id])

  const handleDownload = async () => {
    if (!quotation) return
    try {
      const pdfDoc = await generateQuotationPDF(quotation, companySettings)
      pdfDoc.save(`Quotation-${quotation.quotation_number}.pdf`)
    } catch (err: any) {
      console.error('Download PDF Error:', err)
      alert('Failed to download PDF. Please try again.')
    }
  }

  const handleDownloadAndWhatsAppShare = async () => {
    if (!quotation || sharing) return
    try {
      console.log('STEP 1 - Button Clicked')
      setSharing(true)

      console.log('STEP 2 - Starting PDF Download')
      const pdfDoc = await generateQuotationPDF(quotation, companySettings)
      const filename = `Quotation-${quotation.quotation_number}.pdf`
      pdfDoc.save(filename)

      console.log('STEP 3 - Building WhatsApp Message')
      const companyName = quotation.company_name_snapshot || companySettings?.company_name || 'Thennakoon Tours'
      const messageText = buildWhatsAppQuotationMessage(quotation, companyName)

      const waUrl = buildWhatsAppQuotationUrl(quotation, companyName)
      console.log('STEP 4 - WhatsApp URL', waUrl)

      if (!waUrl.includes('text=')) {
        throw new Error('WhatsApp URL validation failed: missing text= parameter')
      }

      console.log('STEP 5 - Opening WhatsApp')
      window.open(waUrl, '_blank')
    } catch (err: any) {
      console.error('WhatsApp PDF Share Error:', err)
      alert('Failed to generate PDF for WhatsApp. Please try downloading directly.')
    } finally {
      setSharing(false)
    }
  }

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <Loader2 size={32} className="mx-auto text-amber-500 animate-spin" />
        <p className="text-xs font-bold text-slate-500">Generating Official PDF Document...</p>
      </div>
    )
  }

  if (renderError || !quotation) {
    return (
      <div className="p-8 max-w-md mx-auto my-12 text-center space-y-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
        <AlertCircle size={32} className="mx-auto text-rose-500" />
        <h2 className="text-sm font-bold text-slate-900 dark:text-white">{renderError || 'Quotation not found.'}</h2>
        <Link href="/dashboard/quotations" className="inline-block px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold">
          Back to Quotations List
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/dashboard/quotations/${quotation.id}`}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">PDF Preview ({quotation.quotation_number})</h1>
            <p className="text-xs text-slate-500">Official Thennakoon Tours A4 document preview.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleDownloadAndWhatsAppShare}
            disabled={sharing}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
          >
            {sharing ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Share2 size={15} />
            )}
            <span>Download PDF & Open WhatsApp</span>
          </button>
          <button
            onClick={handleDownload}
            className="px-4 py-2 bg-amber-400 text-slate-950 font-bold rounded-xl text-xs hover:bg-amber-300 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Download size={15} />
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      {/* WhatsApp Baseline Explanation Banner */}
      <div className="bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 p-3.5 rounded-xl text-xs flex items-center gap-2 font-medium">
        <AlertCircle size={16} className="shrink-0 text-amber-500" />
        <span>WhatsApp Web cannot attach files automatically. The PDF will be downloaded first; please attach it in WhatsApp.</span>
      </div>

      {/* PDF Viewer Frame */}
      <div className="bg-slate-800 p-2 rounded-2xl border border-slate-700 shadow-xl overflow-hidden min-h-[700px]">
        {pdfUrl ? (
          <iframe src={pdfUrl} className="w-full h-[750px] rounded-xl bg-white" title="Quotation PDF" />
        ) : (
          <div className="p-12 text-center text-white text-xs">Failed to render PDF.</div>
        )}
      </div>
    </div>
  )
}
