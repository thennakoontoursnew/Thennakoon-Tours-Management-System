'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { generateReceiptPDF } from '@/lib/documents/receipt-pdf'
import { ArrowLeft, Download, Loader2, AlertCircle } from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function ReceiptPreviewPage({ params }: PageProps) {
  const { id } = use(params)
  const [receipt, setReceipt] = useState<any>(null)
  const [companySettings, setCompanySettings] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pdfDataUrl, setPdfDataUrl] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        const supabase = createClient()

        const { data: r, error: rErr } = await supabase
          .from('receipts')
          .select('*, customer:customers(*), invoice:invoices(*), booking:bookings(*)')
          .eq('id', id)
          .maybeSingle()

        if (rErr || !r) {
          setError('Payment receipt record not found.')
          setLoading(false)
          return
        }

        const { data: settings } = await supabase
          .from('company_settings')
          .select('*')
          .limit(1)
          .maybeSingle()

        setReceipt(r)
        setCompanySettings(settings)

        const pdfDoc = await generateReceiptPDF(r, settings)
        const dataUrl = pdfDoc.output('dataurlstring')
        setPdfDataUrl(dataUrl)
      } catch (err: any) {
        console.error('Error generating receipt preview:', err)
        setError(err.message || 'Failed to render receipt PDF.')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [id])

  const handleDownload = async () => {
    if (!receipt) return
    try {
      const pdfDoc = await generateReceiptPDF(receipt, companySettings)
      pdfDoc.save(`Receipt-${receipt.receipt_number || 'Document'}.pdf`)
    } catch (err) {
      console.error('Download receipt error:', err)
    }
  }

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <Loader2 size={32} className="mx-auto text-amber-500 animate-spin" />
        <p className="text-xs font-bold text-slate-500">Generating Payment Receipt PDF...</p>
      </div>
    )
  }

  if (error || !receipt) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center space-y-4">
        <div className="p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <AlertCircle size={32} className="mx-auto text-rose-500" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Receipt Preview Error</h2>
          <p className="text-xs text-slate-500">{error || 'Receipt not found.'}</p>
          <div className="pt-2">
            <Link
              href="/dashboard/receipts"
              className="px-4 py-2 bg-amber-400 text-slate-950 font-bold text-xs rounded-xl hover:bg-amber-300 transition-colors inline-block"
            >
              Return to Receipts Directory
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/receipts"
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">Receipt PDF ({receipt.receipt_number || 'Document'})</h1>
            <p className="text-xs text-slate-500">Official letterhead background rendered.</p>
          </div>
        </div>
        <button
          onClick={handleDownload}
          className="px-4 py-2 bg-amber-400 text-slate-950 font-bold rounded-xl text-xs hover:bg-amber-300 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
        >
          <Download size={15} />
          <span>Download Receipt PDF</span>
        </button>
      </div>

      <div className="bg-slate-800 p-2 rounded-2xl border border-slate-700 shadow-xl overflow-hidden min-h-[700px]">
        {pdfDataUrl ? (
          <iframe src={pdfDataUrl} className="w-full h-[750px] rounded-xl bg-white" title="Receipt PDF" />
        ) : (
          <div className="p-12 text-center text-white text-xs">Failed to render PDF.</div>
        )}
      </div>
    </div>
  )
}
