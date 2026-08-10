'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FileText, Loader2, CheckCircle2 } from 'lucide-react'

interface GenerateAgreementButtonProps {
  bookingId: string
  existingAgreementId?: string | null
  existingAgreementNumber?: string | null
}

export default function GenerateAgreementButton({
  bookingId,
  existingAgreementId,
  existingAgreementNumber,
}: GenerateAgreementButtonProps) {
  const router = useRouter()

  if (existingAgreementId) {
    return (
      <Link
        href={`/dashboard/agreements/${existingAgreementId}/preview`}
        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all"
      >
        <CheckCircle2 size={15} />
        <span>View User Agreement ({existingAgreementNumber || 'AGR'})</span>
      </Link>
    )
  }

  return (
    <Link
      href={`/dashboard/agreements/new?booking_id=${bookingId}`}
      className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
    >
      <FileText size={15} />
      <span>Generate User Agreement</span>
    </Link>
  )
}
