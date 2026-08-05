'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FileText, Loader2, CheckCircle2 } from 'lucide-react'
import { createAgreementFromBooking } from '../../agreements/agreement-actions'

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
  const [loading, setLoading] = useState(false)

  if (existingAgreementId) {
    return (
      <Link
        href={`/dashboard/agreements/${existingAgreementId}/preview`}
        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all"
      >
        <CheckCircle2 size={15} />
        <span>View Agreement ({existingAgreementNumber || 'AGR'})</span>
      </Link>
    )
  }

  const handleGenerate = async () => {
    if (loading) return
    const confirmed = window.confirm('Generate official rental agreement for this booking?')
    if (!confirmed) return

    try {
      setLoading(true)
      const res = await createAgreementFromBooking(bookingId)

      if (!res.success || !res.agreementId) {
        alert(`Agreement Generation Failed: ${res.error || 'Unknown error'}`)
        setLoading(false)
        return
      }

      router.push(`/dashboard/agreements/${res.agreementId}/preview`)
    } catch (err: any) {
      alert(`Agreement Generation Exception: ${err.message || 'An error occurred.'}`)
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleGenerate}
      disabled={loading}
      className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
    >
      {loading ? <Loader2 size={15} className="animate-spin" /> : <FileText size={15} />}
      <span>{loading ? 'Generating Agreement...' : 'Generate Agreement'}</span>
    </button>
  )
}
