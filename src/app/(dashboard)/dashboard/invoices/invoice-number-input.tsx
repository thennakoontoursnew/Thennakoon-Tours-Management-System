'use client'

import { useState } from 'react'
import { Edit3, Check, RefreshCw } from 'lucide-react'

interface InvoiceNumberInputProps {
  value: string
  autoNumber: string
  onChange: (val: string) => void
  onResetAuto: () => void
  disabled?: boolean
  userRole?: string
}

export function InvoiceNumberInput({
  value,
  autoNumber,
  onChange,
  onResetAuto,
  disabled = false,
  userRole = 'owner',
}: InvoiceNumberInputProps) {
  const [isEditing, setIsEditing] = useState(false)

  const isAuthorized = ['owner', 'admin', 'finance', 'manager'].includes(userRole)
  const isManual = value && value !== autoNumber

  const handleToggle = () => {
    if (!isEditing) {
      setIsEditing(true)
    } else {
      setIsEditing(false)
      onResetAuto()
    }
  }

  return (
    <div className="space-y-1.5 w-full">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
          Invoice Number <span className="text-rose-500">*</span>
        </label>
        {isManual ? (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
            Manual Number
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500">
            Auto Generated
          </span>
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <div className="flex-1 min-w-0">
          <input
            type="text"
            value={value || autoNumber}
            onChange={(e) => onChange(e.target.value.toUpperCase().trim())}
            readOnly={!isEditing || disabled}
            placeholder="TT-IN-10001"
            className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-mono font-bold transition-all ${
              isEditing
                ? 'bg-white dark:bg-slate-900 border-amber-400 focus:outline-none ring-2 ring-amber-400/20 text-slate-900 dark:text-white'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 cursor-not-allowed'
            }`}
          />
        </div>

        {isAuthorized && !disabled && (
          <button
            type="button"
            onClick={handleToggle}
            className="shrink-0 px-4 py-2.5 rounded-xl bg-slate-900 text-white dark:bg-slate-800 text-xs font-bold hover:bg-slate-800 dark:hover:bg-slate-700 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
          >
            {isEditing ? (
              <>
                <RefreshCw size={13} />
                <span>Use Auto Number</span>
              </>
            ) : (
              <>
                <Edit3 size={13} />
                <span>Edit</span>
              </>
            )}
          </button>
        )}
      </div>

      {isEditing && (
        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
          You may change this number before saving. Duplicate invoice numbers are not allowed. Must start with <strong className="font-mono text-amber-500">TT-IN-</strong>.
        </p>
      )}
    </div>
  )
}
