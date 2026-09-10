'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { generateInvoicePDF } from '@/lib/documents/invoice-pdf'
import { ArrowLeft, Download, Loader2, AlertTriangle, FileCheck } from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function InvoicePreviewPage({ params }: PageProps) {
  const { id } = use(params)
  const [invoice, setInvoice] = useState<any>(null)
  const [companySettings, setCompanySettings] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        console.log('STEP 1 Invoice page opened: id=', id)

        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        if (!id || !uuidRegex.test(id)) {
          console.warn('STEP 1 - INVALID UUID', id)
          setErrorMsg('Invalid invoice ID format.')
          setLoading(false)
          return
        }

        const supabase = createClient()

        // STEP 2: Fetch Invoice by ID (UUID)
        const { data: inv, error: iErr } = await supabase
          .from('invoices')
          .select('*')
          .eq('id', id)
          .maybeSingle()

        if (iErr || !inv) {
          console.error('STEP 2 FAILED - Invoice not found', iErr)
          setErrorMsg('Invoice data missing')
          setLoading(false)
          return
        }

        console.log('invoice.id:', inv.id)
        console.log('invoice.invoice_number:', inv.invoice_number)
        console.log('STEP 2 Invoice loaded', inv.invoice_number)

        // STEP 3: Fetch Customer
        let customer: any = null
        if (inv.customer_id) {
          const { data: c } = await supabase
            .from('customers')
            .select('*')
            .eq('id', inv.customer_id)
            .maybeSingle()
          customer = c || null
        }
        console.log('STEP 3 Customer loaded', customer?.full_name || 'N/A')

        // STEP 4: Fetch Invoice Items
        let items: any[] = []
        const { data: itemsData } = await supabase
          .from('invoice_items')
          .select('*')
          .eq('invoice_id', id)
        items = itemsData || []
        console.log('STEP 4 Items loaded', items.length)

        // STEP 5: Fetch Company Settings
        const { data: settings } = await supabase
          .from('company_settings')
          .select('*')
          .limit(1)
          .maybeSingle()
        console.log('STEP 5 Company loaded')

        const fullInvoiceData = {
          ...inv,
          customer,
          items,
        }

        setInvoice(fullInvoiceData)
        setCompanySettings(settings)

        // STEP 6: Render PDF
        console.log('STEP 6 Rendering PDF')
        const pdfDoc = await generateInvoicePDF(fullInvoiceData, settings)
        const pdfBlob = pdfDoc.output('blob')
        const blobUrl = URL.createObjectURL(pdfBlob)
        setPdfBlobUrl(blobUrl)
      } catch (err: any) {
        console.error('INVOICE PREVIEW EXCEPTION', err)
        setErrorMsg(err.message || 'An unexpected error occurred.')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [id])

  const handleDownload = async () => {
    if (!invoice) return
    const pdfDoc = await generateInvoicePDF(invoice, companySettings)
    const cleanDocNum = invoice.invoice_number || `INVOICE-${invoice.id.slice(0, 8)}`
    pdfDoc.save(`${cleanDocNum}.pdf`)
  }

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <Loader2 size={32} className="mx-auto text-amber-500 animate-spin" />
        <p className="text-xs font-bold text-slate-500">Loading Official Invoice PDF...</p>
      </div>
    )
  }

  if (errorMsg || !invoice) {
    return (
      <div className="max-w-md mx-auto my-16 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center space-y-4 shadow-xl">
        <AlertTriangle size={36} className="mx-auto text-rose-500" />
        <h2 className="text-base font-bold text-slate-900 dark:text-white">Invoice Data Missing</h2>
        <p className="text-xs text-slate-500">{errorMsg || 'The requested invoice data is missing or invalid.'}</p>
        <Link
          href="/dashboard/invoices"
          className="inline-block px-4 py-2 bg-amber-400 text-slate-950 font-bold rounded-xl text-xs hover:bg-amber-300 transition-all shadow-xs"
        >
          Back to Invoices
        </Link>
      </div>
    )
  }

  const custName = invoice.customer?.full_name || 'Valued Customer'

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/dashboard/invoices/${invoice.id}`}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">
              Invoice PDF ({invoice.invoice_number})
            </h1>
            <p className="text-xs text-slate-500">Official letterhead background rendered.</p>
          </div>
        </div>
        <button
          onClick={handleDownload}
          className="px-4 py-2 bg-amber-400 text-slate-950 font-bold rounded-xl text-xs hover:bg-amber-300 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
        >
          <Download size={15} />
          <span>Download Invoice PDF</span>
        </button>
      </div>

      {/* Visible Data Summary Test Block */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-1">
        <div className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
          <FileCheck size={14} />
          <span>OFFICIAL INVOICE PREVIEW DATA</span>
        </div>
        <div className="text-slate-700 dark:text-slate-300 space-x-4">
          <span>Invoice No: <strong className="font-mono">{invoice.invoice_number}</strong></span>
          <span>Customer: <strong>{custName}</strong></span>
          <span>Grand Total: <strong className="font-mono text-amber-500 font-bold">LKR {Number(invoice.grand_total || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></span>
        </div>
      </div>

      {/* PDF Viewer Container */}
      <div className="bg-slate-800 p-2 rounded-2xl border border-slate-700 shadow-xl overflow-hidden min-h-[700px]">
        {pdfBlobUrl ? (
          <iframe src={pdfBlobUrl} className="w-full h-[750px] rounded-xl bg-white" title="Invoice PDF Viewer" />
        ) : (
          <div className="p-12 text-center text-white text-xs">Failed to render PDF preview blob.</div>
        )}
      </div>
    </div>
  )
}
