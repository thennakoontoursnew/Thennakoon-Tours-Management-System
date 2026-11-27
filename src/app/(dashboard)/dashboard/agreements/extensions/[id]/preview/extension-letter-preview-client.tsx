'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Printer, Download, Loader2, FileText } from 'lucide-react'
import { formatCurrency, formatDateOrdinal } from '@/lib/utils/formatters'
import {
  generateExtensionLetterPDF,
  buildExtensionPdfFilename,
} from '@/lib/documents/extension-letter-pdf'
import { ExtensionLetterContentRenderer } from '@/components/agreements/extension-letter-content-renderer'

interface ExtensionLetterPreviewClientProps {
  extension: any
  companySettings?: any
  parentAgreement?: any
}

export function ExtensionLetterPreviewClient({
  extension,
  companySettings,
}: ExtensionLetterPreviewClientProps) {
  const [downloading, setDownloading] = useState(false)

  const pdfFilename = buildExtensionPdfFilename(extension)

  useEffect(() => {
    const prevTitle = document.title
    document.title = pdfFilename
    return () => {
      document.title = prevTitle
    }
  }, [pdfFilename])

  const isOwner = extension?.agreement_type === 'owner'
  const isIndefinite = extension?.extension_period_type === 'until_further_notice'
  const companyName = companySettings?.company_name || 'Thennakoon Tours (Pvt) Ltd'
  const letterheadSrc = companySettings?.letterhead_url || '/documents/thennakoon-tours-letterhead.png'
  const sealUrl = companySettings?.company_seal_url || null
  const regNo = extension?.vehicle_reg_no || 'N/A'
  const origRef = extension?.original_agreement_ref || 'Original Agreement'
  const durationLabel = extension?.extension_duration_label || 'further period'
  const newEndFormatted = formatDateOrdinal(extension?.new_end_date) || 'N/A'
  const amountFormatted =
    extension?.renewal_amount && Number(extension.renewal_amount) > 0
      ? formatCurrency(extension.renewal_amount, extension?.currency || 'LKR')
      : null

  const hasLockedSnapshot =
    (Array.isArray(extension?.rendered_sections_snapshot) &&
      extension.rendered_sections_snapshot.length > 0) ||
    Boolean(extension?.rendered_content_snapshot)

  const parentAgreementHref =
    isOwner && extension?.owner_agreement_id
      ? `/dashboard/agreements/owner/${extension.owner_agreement_id}`
      : extension?.user_agreement_id
      ? `/dashboard/agreements/${extension.user_agreement_id}/preview`
      : '/dashboard/agreements'

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPdf = async () => {
    setDownloading(true)
    try {
      const doc = await generateExtensionLetterPDF(extension, companySettings)
      doc.save(pdfFilename)
    } catch (err) {
      console.error('Failed to generate extension PDF:', err)
      window.print()
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 py-8 px-4 flex flex-col items-center print:bg-white print:p-0">
      <style jsx global>{`
        @page {
          size: A4 portrait;
          margin: 0;
        }
        @media print {
          html,
          body {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print,
          aside,
          header,
          nav {
            display: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
          }
        }
      `}</style>

      {/* Top Toolbar (Hidden on Print) */}
      <div className="w-full max-w-[210mm] flex flex-wrap items-center justify-between gap-3 mb-6 no-print">
        <div className="flex items-center gap-2">
          <Link
            href={parentAgreementHref}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft size={14} />
            <span>Back to Agreement</span>
          </Link>
          <Link
            href="/dashboard/agreements"
            className="px-3 py-2 rounded-xl bg-slate-800/70 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
          >
            Agreements Center
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <span className="font-mono text-xs text-amber-400 font-bold">
            {extension?.extension_number}
          </span>
          <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30 flex items-center gap-1">
            <FileText size={11} />
            <span>{isOwner ? 'Owner Extension Letter' : 'User Rental Extension Letter'}</span>
          </span>
          {hasLockedSnapshot && (
            <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Locked Template Snapshot
            </span>
          )}

          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={downloading}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-100 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-60"
          >
            {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            <span>{downloading ? 'Generating...' : 'Download PDF'}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-5 py-2 rounded-xl bg-amber-400 text-slate-950 font-black text-xs hover:bg-amber-300 transition-all cursor-pointer flex items-center gap-1.5 shadow-md"
          >
            <Printer size={14} />
            <span>Print / Save as PDF</span>
          </button>
        </div>
      </div>

      {/* Full-Bleed A4 Official Company Letterhead Canvas */}
      <div className="relative w-[210mm] min-h-[297mm] bg-white text-slate-900 shadow-2xl overflow-hidden print:shadow-none print:m-0">
        {/* Background Company Letterhead */}
        <img
          src={letterheadSrc}
          alt="Thennakoon Tours Official Letterhead"
          className="absolute inset-0 w-[210mm] h-[297mm] object-fill pointer-events-none select-none z-0"
        />

        {/* Safe Foreground Letter Content Area (clears header & footer artwork cleanly) */}
        <div
          className="relative z-10"
          style={{
            padding: '38mm 18mm 54mm 18mm',
            fontFamily: 'Georgia, Cambria, "Times New Roman", Times, serif',
          }}
        >
          {/* Letter Body Section (Immutable Template Snapshot or Legacy Fallback) */}
          {hasLockedSnapshot ? (
            <ExtensionLetterContentRenderer
              sections={extension?.rendered_sections_snapshot}
              content={extension?.rendered_content_snapshot}
            />
          ) : (
            <div className="space-y-2.5 text-[12.5px] leading-[1.55] text-slate-800">
              {/* Reference & Date Header */}
              <div className="flex items-center justify-between border-b border-slate-300/80 pb-1.5 mb-2 text-[12px] font-sans font-bold text-slate-900">
                <span>Ref: {extension?.extension_number}</span>
                <span>Date: {formatDateOrdinal(extension?.issue_date) || 'N/A'}</span>
              </div>

              {/* Recipient Block */}
              <div className="pt-0.5 font-sans">
                <p className="text-[12.5px] font-bold text-slate-900">
                  To: {extension?.recipient_name}
                </p>
              </div>

              {/* Subject Line */}
              <div className="pt-0.5 pb-0.5 mb-2">
                <h1 className="font-sans text-[13px] font-extrabold uppercase tracking-tight text-slate-950 underline underline-offset-4 decoration-slate-800">
                  {isOwner
                    ? `RE: EXTENSION OF VEHICLE OWNER AGREEMENT – VEHICLE NO: ${regNo}`
                    : `RE: EXTENSION OF VEHICLE RENTAL AGREEMENT – VEHICLE NO: ${regNo}`}
                </h1>
              </div>

              <p className="font-sans text-[12.5px] text-slate-900">
                Dear {extension?.recipient_name || 'Sir / Madam'},
              </p>

              {/* Formal Conditional Legal Wording */}
              {isOwner ? (
                <>
                  <p className="text-justify">
                    This letter formally confirms the mutual extension of the Vehicle Owner Agreement
                    between <strong className="text-slate-950">{companyName}</strong> and{' '}
                    <strong className="text-slate-950">{extension?.recipient_name}</strong> regarding the
                    vehicle bearing registration number <strong className="text-slate-950">{regNo}</strong>{' '}
                    (Reference Agreement No. <strong className="text-slate-950">{origRef}</strong>).
                  </p>

                  <p className="text-justify">
                    Both parties have mutually agreed to extend the operational engagement of the above
                    vehicle{' '}
                    {isIndefinite ? (
                      <strong className="text-slate-950">until further notice</strong>
                    ) : (
                      <>
                        for a further period of{' '}
                        <strong className="text-slate-950">{durationLabel}</strong> until{' '}
                        <strong className="text-slate-950">{newEndFormatted}</strong>
                      </>
                    )}
                    .
                    {amountFormatted && (
                      <>
                        {' '}
                        The agreed monthly owner rental amount during the extended term shall be{' '}
                        <strong className="text-slate-950">{amountFormatted}</strong>.
                      </>
                    )}
                  </p>

                  <p className="text-justify">
                    All original terms, conditions, revenue-share / monthly payment schedules, mileage
                    limits, and maintenance responsibilities set out in the principal Vehicle Owner
                    Agreement shall remain binding throughout the extended tenure.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-justify">
                    We are pleased to confirm the extension of your vehicle rental agreement with{' '}
                    <strong className="text-slate-950">{companyName}</strong> for the vehicle bearing
                    registration number <strong className="text-slate-950">{regNo}</strong> (originally
                    commenced under Agreement No. <strong className="text-slate-950">{origRef}</strong>).
                  </p>

                  <p className="text-justify">
                    By mutual consent, the rental period is hereby extended{' '}
                    {isIndefinite ? (
                      <>
                        <strong className="text-slate-950">until further notice</strong>, effective
                        immediately following the original expiry date
                      </>
                    ) : (
                      <>
                        for a further period of{' '}
                        <strong className="text-slate-950">{durationLabel}</strong>, with the revised
                        rental end date now set as{' '}
                        <strong className="text-slate-950">{newEndFormatted}</strong>
                      </>
                    )}
                    .
                    {amountFormatted && (
                      <>
                        {' '}
                        The agreed renewal/periodic rental charge shall be{' '}
                        <strong className="text-slate-950">{amountFormatted}</strong>.
                      </>
                    )}
                  </p>

                  <p className="text-justify">
                    All other terms, conditions, security deposit provisions, insurance obligations, and
                    covenants stated in the original Vehicle Rental Agreement shall remain unchanged and
                    continue in full force and effect during this extended period.
                  </p>
                </>
              )}

              {extension?.custom_notes && (
                <p className="text-justify bg-slate-50/80 border-l-2 border-slate-400 pl-3 py-1 text-[12px]">
                  <strong className="font-sans text-slate-900">
                    {isOwner ? 'Special Notes: ' : 'Additional Notes / Agreed Terms: '}
                  </strong>
                  {extension.custom_notes}
                </p>
              )}

              <p className="text-justify pt-0.5">
                Kindly sign and return a copy of this letter as your formal acknowledgment and
                acceptance of this extension.
              </p>
            </div>
          )}

          {/* Two-Column Signature & Company Seal Block */}
          <div className="mt-6 pt-2 grid grid-cols-2 gap-12 font-sans text-slate-900 break-inside-avoid page-break-inside-avoid">
            {/* Column 1: Company / Staff Digital Signature & Official Seal */}
            <div className="flex flex-col">
              <p className="text-[11px] text-slate-600 font-medium">Issued For &amp; On Behalf of</p>
              <p className="text-[12px] font-bold text-slate-950">{companyName}</p>

              <div className="relative h-[54px] flex items-end my-1">
                {extension?.issued_by_signature_url && (
                  <img
                    src={extension.issued_by_signature_url}
                    alt={`${extension.issued_by_name} Signature`}
                    className="h-[42px] max-w-[165px] object-contain object-left pb-0.5"
                  />
                )}

                {sealUrl && (
                  <img
                    src={sealUrl}
                    alt="Official Company Seal"
                    className={`h-[52px] w-[52px] object-contain opacity-90 pointer-events-none select-none ${
                      extension?.issued_by_signature_url ? '-ml-3' : ''
                    }`}
                  />
                )}
              </div>

              <div className="border-t border-dotted border-slate-500 pt-1.5">
                <p className="text-[12px] font-bold text-slate-950">
                  {extension?.issued_by_name}
                </p>
                <p className="text-[11px] text-slate-600 font-medium">
                  {extension?.issued_by_designation}
                </p>
              </div>
            </div>

            {/* Column 2: Recipient Acknowledgement Block */}
            <div className="flex flex-col">
              <p className="text-[11px] text-slate-600 font-medium">
                Acknowledged &amp; Accepted By
              </p>
              <p className="text-[12px] font-bold text-slate-950">
                {isOwner ? 'Vehicle Owner' : 'Customer / Authorized Signatory'}
              </p>

              <div className="relative h-[54px] flex items-end my-1">
                {extension?.recipient_signature_url && (
                  <img
                    src={extension.recipient_signature_url}
                    alt={`${extension.recipient_name} Signature`}
                    className="h-[42px] max-w-[165px] object-contain object-left pb-0.5"
                  />
                )}
              </div>

              <div className="border-t border-dotted border-slate-500 pt-1.5 space-y-0.5">
                <p className="text-[12px] font-bold text-slate-950">
                  {extension?.recipient_name}
                </p>
                <p className="text-[11px] text-slate-600 font-medium">Signature</p>
                <p className="text-[11px] text-slate-600 pt-0.5">
                  Date / NIC: ______________________
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
