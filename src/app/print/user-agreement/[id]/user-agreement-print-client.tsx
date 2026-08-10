'use client'

import { useEffect } from 'react'
import { UserAgreementDocument } from '@/app/(dashboard)/dashboard/agreements/[id]/preview/user-agreement-preview-client'
import { Printer, X } from 'lucide-react'

interface UserAgreementPrintClientProps {
  agreement: any
  isV1: boolean
  booking?: any
  customer?: any
  vehicle?: any
  companySettings?: any
}

export function UserAgreementPrintClient({
  agreement,
  isV1,
  booking,
  customer,
  vehicle,
  companySettings,
}: UserAgreementPrintClientProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.print()
      }
    }, 600)
    return () => clearTimeout(timer)
  }, [])

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print()
    }
  }

  const handleClose = () => {
    if (typeof window !== 'undefined') {
      window.close()
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8 flex flex-col items-center print:p-0 print:bg-white print:text-black">
      {/* Strict Document-Only Print CSS */}
      <style jsx global>{`
        @media print {
          @page {
            size: 8.5in 14in portrait;
            margin: 15mm 15mm 15mm 15mm;
          }
          html, body {
            background: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .no-print,
          .app-shell-ui {
            display: none !important;
          }
        }
      `}</style>

      {/* FLOATING ACTION BAR FOR DEDICATED PRINT ROUTE (NO DASHBOARD LAYOUT) */}
      <div className="w-full max-w-4xl flex items-center justify-between gap-4 mb-6 print:hidden no-print bg-slate-800 p-3 rounded-2xl border border-slate-700 shadow-lg">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-amber-400 font-bold">{agreement.agreement_number}</span>
          <span className="text-xs text-slate-300">Document-Only Print View</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs hover:bg-amber-300 cursor-pointer flex items-center gap-1.5"
          >
            <Printer size={14} />
            <span>Print / Save PDF</span>
          </button>
          <button
            onClick={handleClose}
            className="px-3 py-2 rounded-xl bg-slate-700 text-slate-300 hover:bg-slate-600 font-bold text-xs cursor-pointer flex items-center gap-1"
          >
            <X size={14} />
            <span>Close</span>
          </button>
        </div>
      </div>

      {/* PURE DOCUMENT CANVAS */}
      <UserAgreementDocument
        agreement={agreement}
        isV1={isV1}
        booking={booking}
        customer={customer}
        vehicle={vehicle}
        companySettings={companySettings}
      />
    </div>
  )
}
