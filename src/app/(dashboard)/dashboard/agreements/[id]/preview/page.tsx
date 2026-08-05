'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { generateAgreementPDF } from '@/lib/documents/agreement-pdf'
import { ArrowLeft, Download, Loader2, AlertTriangle } from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function AgreementPreviewPage({ params }: PageProps) {
  const { id } = use(params)
  const [agreement, setAgreement] = useState<any>(null)
  const [companySettings, setCompanySettings] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [pdfDataUrl, setPdfDataUrl] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        console.log('STEP 1 Agreement page opened: id=', id)

        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        if (!id || !uuidRegex.test(id)) {
          console.warn('STEP 1 - INVALID UUID', id)
          setErrorMsg('Invalid agreement ID format.')
          setLoading(false)
          return
        }

        const supabase = createClient()

        // STEP 2: Fetch Agreement by ID (UUID)
        const { data: agr, error: aErr } = await supabase
          .from('rental_agreements')
          .select('*')
          .eq('id', id)
          .maybeSingle()

        if (aErr || !agr) {
          console.error('STEP 2 FAILED - Agreement not found', aErr)
          setErrorMsg('Agreement not found.')
          setLoading(false)
          return
        }
        console.log('STEP 2 Agreement loaded', agr.agreement_number)

        // STEP 3: Fetch Linked Booking
        let booking: any = null
        if (agr.booking_id) {
          const { data: b } = await supabase
            .from('bookings')
            .select('*')
            .eq('id', agr.booking_id)
            .maybeSingle()
          booking = b || null
        }
        console.log('STEP 3 Booking loaded', booking?.booking_number || 'N/A')

        // STEP 4: Fetch Customer
        let customer: any = null
        const custId = agr.customer_id || booking?.customer_id
        if (custId) {
          const { data: c } = await supabase
            .from('customers')
            .select('*')
            .eq('id', custId)
            .maybeSingle()
          customer = c || null
        }
        console.log('STEP 4 Customer loaded', customer?.full_name || 'N/A')

        // Fetch Booking Vehicles & Vehicles & Drivers
        let vehiclesList: any[] = []
        if (booking?.id) {
          const { data: bvs } = await supabase
            .from('booking_vehicles')
            .select('*, vehicle:vehicles(*), driver:drivers(*)')
            .eq('booking_id', booking.id)
          vehiclesList = bvs || []
        }

        // STEP 5: Fetch Company Settings
        const { data: settings } = await supabase
          .from('company_settings')
          .select('*')
          .limit(1)
          .maybeSingle()
        console.log('STEP 5 Company loaded')

        const fullAgreementData = {
          ...agr,
          customer,
          booking,
          vehicles: vehiclesList,
        }

        setAgreement(fullAgreementData)
        setCompanySettings(settings)

        // STEP 6: Render PDF
        console.log('STEP 6 Rendering PDF')
        const pdfDoc = await generateAgreementPDF(fullAgreementData, settings)
        const dataUrl = pdfDoc.output('dataurlstring')
        setPdfDataUrl(dataUrl)
      } catch (err: any) {
        console.error('AGREEMENT PREVIEW EXCEPTION', err)
        setErrorMsg(err.message || 'An unexpected error occurred.')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [id])

  const handleDownload = async () => {
    if (!agreement) return
    const pdfDoc = await generateAgreementPDF(agreement, companySettings)
    pdfDoc.save(`Agreement-${agreement.agreement_number || 'AGR'}.pdf`)
  }

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <Loader2 size={32} className="mx-auto text-amber-500 animate-spin" />
        <p className="text-xs font-bold text-slate-500">Loading Rental Agreement PDF...</p>
      </div>
    )
  }

  if (errorMsg || !agreement) {
    return (
      <div className="max-w-md mx-auto my-16 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center space-y-4 shadow-xl">
        <AlertTriangle size={36} className="mx-auto text-rose-500" />
        <h2 className="text-base font-bold text-slate-900 dark:text-white">Agreement Not Found</h2>
        <p className="text-xs text-slate-500">{errorMsg || 'The requested rental agreement does not exist or has been removed.'}</p>
        <Link
          href="/dashboard/bookings"
          className="inline-block px-4 py-2 bg-amber-400 text-slate-950 font-bold rounded-xl text-xs hover:bg-amber-300 transition-all shadow-xs"
        >
          Back to Bookings
        </Link>
      </div>
    )
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
            <h1 className="text-xl font-black text-slate-900 dark:text-white">
              Rental Agreement ({agreement.agreement_number})
            </h1>
            <p className="text-xs text-slate-500">Official letterhead background rendered.</p>
          </div>
        </div>
        <button
          onClick={handleDownload}
          className="px-4 py-2 bg-amber-400 text-slate-950 font-bold rounded-xl text-xs hover:bg-amber-300 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
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
