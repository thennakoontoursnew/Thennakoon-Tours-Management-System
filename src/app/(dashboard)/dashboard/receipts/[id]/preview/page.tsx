'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { generateReceiptPDF } from '@/lib/documents/receipt-pdf'
import { updateReceiptTerms } from '../../receipt-actions'
import { ArrowLeft, Download, Loader2, AlertTriangle, FileCheck, ExternalLink, Save } from 'lucide-react'

const DEFAULT_TERMS = `1. The Advance payment made is non-refundable, even if the vehicle is not collected.\n2. The full balance payment must be settled on the date of vehicle collection.`

interface PageProps {
  params: Promise<{ id: string }>
}

export default function ReceiptPreviewPage({ params }: PageProps) {
  const { id } = use(params)
  const [receipt, setReceipt] = useState<any>(null)
  const [companySettings, setCompanySettings] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null)

  const [termsText, setTermsText] = useState<string>('')
  const [savingTerms, setSavingTerms] = useState(false)
  const [termsSaved, setTermsSaved] = useState(false)

  useEffect(() => {
    async function loadData() {
      try {
        console.log('STEP 1 Receipt page opened: id=', id)

        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        if (!id || !uuidRegex.test(id)) {
          console.warn('STEP 1 - INVALID UUID', id)
          setErrorMsg('Invalid receipt ID format.')
          setLoading(false)
          return
        }

        const supabase = createClient()

        // STEP 2: Fetch Receipt by ID (UUID)
        const { data: r, error: rErr } = await supabase
          .from('receipts')
          .select('*')
          .eq('id', id)
          .maybeSingle()

        if (rErr || !r) {
          console.error('STEP 2 FAILED - Receipt not found', rErr)
          setErrorMsg('Receipt data missing or not found.')
          setLoading(false)
          return
        }

        console.log('receipt.id:', r.id)
        console.log('receipt.receipt_number:', r.receipt_number)

        // STEP 3: Fetch Customer
        let customer: any = null
        if (r.customer_id) {
          const { data: c } = await supabase
            .from('customers')
            .select('*')
            .eq('id', r.customer_id)
            .maybeSingle()
          customer = c || null
        }

        // STEP 4: Fetch Related Invoice
        let invoice: any = null
        if (r.invoice_id) {
          const { data: inv } = await supabase
            .from('invoices')
            .select('*')
            .eq('id', r.invoice_id)
            .maybeSingle()
          invoice = inv || null
        }

        // STEP 5: Fetch Related Booking
        let booking: any = null
        if (r.booking_id) {
          const { data: bk } = await supabase
            .from('bookings')
            .select('*')
            .eq('id', r.booking_id)
            .maybeSingle()
          booking = bk || null
        }

        // STEP 6: Fetch Company Settings
        const { data: settings } = await supabase
          .from('company_settings')
          .select('*')
          .limit(1)
          .maybeSingle()

        const initialTerms = r.terms_and_conditions || settings?.receipt_terms || DEFAULT_TERMS
        setTermsText(initialTerms)

        const fullReceiptData = {
          ...r,
          customer,
          invoice,
          booking,
          terms_and_conditions: initialTerms,
        }

        setReceipt(fullReceiptData)
        setCompanySettings(settings)

        // STEP 7: Render PDF Blob
        console.log('STEP 7 Rendering Receipt PDF Blob')
        const pdfDoc = await generateReceiptPDF(fullReceiptData, settings)
        const pdfBlob = pdfDoc.output('blob')
        const blobUrl = URL.createObjectURL(pdfBlob)
        setPdfBlobUrl(blobUrl)
      } catch (err: any) {
        console.error('RECEIPT PREVIEW EXCEPTION', err)
        setErrorMsg(err.message || 'An unexpected error occurred while rendering receipt PDF.')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [id])

  const handleSaveTerms = async () => {
    if (!id || !receipt) return
    setSavingTerms(true)
    setTermsSaved(false)

    const res = await updateReceiptTerms(id, termsText)
    if (res.success) {
      setTermsSaved(true)
      const updatedReceipt = { ...receipt, terms_and_conditions: termsText }
      setReceipt(updatedReceipt)

      const pdfDoc = await generateReceiptPDF(updatedReceipt, companySettings)
      const pdfBlob = pdfDoc.output('blob')
      if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl)
      setPdfBlobUrl(URL.createObjectURL(pdfBlob))

      setTimeout(() => setTermsSaved(false), 3000)
    } else {
      alert(res.error || 'Failed to update receipt terms.')
    }
    setSavingTerms(false)
  }

  const handleDownload = async () => {
    if (!receipt) return
    try {
      const pdfDoc = await generateReceiptPDF(receipt, companySettings)
      pdfDoc.save(`Receipt-${receipt.receipt_number || 'RCPT'}.pdf`)
    } catch (err) {
      console.error('Download receipt error:', err)
    }
  }

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <Loader2 size={32} className="mx-auto text-amber-500 animate-spin" />
        <p className="text-xs font-bold text-slate-500">Loading Official Payment Receipt PDF...</p>
      </div>
    )
  }

  if (errorMsg || !receipt) {
    return (
      <div className="max-w-md mx-auto my-16 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center space-y-4 shadow-xl">
        <AlertTriangle size={36} className="mx-auto text-rose-500" />
        <h2 className="text-base font-bold text-slate-900 dark:text-white">Receipt Data Missing</h2>
        <p className="text-xs text-slate-500">{errorMsg || 'The requested receipt data is missing or invalid.'}</p>
        <Link
          href="/dashboard/receipts"
          className="inline-block px-4 py-2 bg-amber-400 text-slate-950 font-bold rounded-xl text-xs hover:bg-amber-300 transition-all shadow-xs"
        >
          Back to Receipts
        </Link>
      </div>
    )
  }

  const custName = receipt.customer?.full_name || receipt.customer_name || 'Valued Customer'
  const receiptNo = receipt.receipt_number || 'RCPT'

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/receipts"
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">
              Receipt PDF ({receiptNo})
            </h1>
            <p className="text-xs text-slate-500">Official letterhead background rendered.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {pdfBlobUrl && (
            <a
              href={pdfBlobUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center gap-1.5 shadow-xs"
            >
              <ExternalLink size={14} />
              <span>Open in New Tab</span>
            </a>
          )}
          <button
            onClick={handleDownload}
            className="px-4 py-2 bg-amber-400 text-slate-950 font-bold rounded-xl text-xs hover:bg-amber-300 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Download size={15} />
            <span>Download Receipt PDF</span>
          </button>
        </div>
      </div>

      {/* Visible Data Summary Test Block */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-1">
        <div className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
          <FileCheck size={14} />
          <span>OFFICIAL PAYMENT RECEIPT PREVIEW DATA</span>
        </div>
        <div className="text-slate-700 dark:text-slate-300 space-x-4">
          <span>Receipt No: <strong className="font-mono">{receiptNo}</strong></span>
          <span>Customer: <strong>{custName}</strong></span>
          <span>Amount Received: <strong className="font-mono text-amber-500 font-bold">LKR {Number(receipt.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></span>
        </div>
      </div>

      {/* Editable Terms & Conditions Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Custom Receipt Terms & Conditions
          </label>
          {termsSaved && (
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              ✓ Terms Saved & PDF Updated!
            </span>
          )}
        </div>
        <textarea
          rows={3}
          value={termsText}
          onChange={(e) => setTermsText(e.target.value)}
          placeholder="1. The Advance payment made is non-refundable...\n2. Full balance payment due upon collection."
          className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl p-3 focus:outline-none focus:border-amber-400 font-mono leading-relaxed"
        />
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSaveTerms}
            disabled={savingTerms}
            className="px-3.5 py-1.5 bg-amber-400 text-slate-950 font-bold rounded-lg text-xs hover:bg-amber-300 disabled:opacity-50 cursor-pointer transition-all flex items-center gap-1.5 shadow-xs"
          >
            {savingTerms ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
            <span>Save & Refresh PDF</span>
          </button>
        </div>
      </div>

      {/* PDF Viewer Container */}
      <div className="bg-slate-800 p-2 rounded-2xl border border-slate-700 shadow-xl overflow-hidden min-h-[700px]">
        {pdfBlobUrl ? (
          <iframe
            src={pdfBlobUrl}
            className="w-full h-[750px] rounded-xl bg-white border-0"
            title="Payment Receipt PDF Viewer"
          />
        ) : (
          <div className="p-12 text-center text-white text-xs">Failed to render PDF preview blob.</div>
        )}
      </div>
    </div>
  )
}
