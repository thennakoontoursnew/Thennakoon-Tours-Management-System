'use client'

import { useRef, useState } from 'react'
import { PenTool, Upload, Trash2, Loader2, AlertCircle } from 'lucide-react'
import { uploadEntitySignatureAction } from '@/lib/actions/signature-upload-action'

interface SignatureUploadFieldProps {
  label?: string
  helperText?: string
  value?: string | null
  onChange: (url: string | null) => void
  entityFolder: 'owners' | 'customers'
  entityId?: string
  compact?: boolean
}

export function SignatureUploadField({
  label = 'Saved E-Signature (Optional)',
  helperText = 'Transparent PNG recommended (Max 5MB). Auto-fills future Agreements & Extension Letters.',
  value,
  onChange,
  entityFolder,
  entityId,
  compact = false,
}: SignatureUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)
    if (!['image/png', 'image/jpeg', 'image/jpg', 'image/webp'].includes(file.type)) {
      setError('Please select a PNG, JPG, or WEBP image.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Signature image exceeds 5MB limit.')
      return
    }

    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('signature_file', file)
      fd.append('entity_folder', entityFolder)
      if (entityId) fd.append('entity_id', entityId)

      const res = await uploadEntitySignatureAction(fd)
      if (res.success && res.signatureUrl) {
        onChange(res.signatureUrl)
      } else {
        setError(res.error || 'Failed to upload E-signature.')
      }
    } catch (err: any) {
      setError(err.message || 'Upload failed.')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div
      className={`${
        compact ? 'p-3 rounded-xl' : 'p-4 rounded-2xl'
      } bg-slate-50/80 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 space-y-2.5`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <PenTool size={13} className="text-amber-500" />
            <span>{label}</span>
          </label>
          <p className="text-[11px] text-slate-400 mt-0.5">{helperText}</p>
        </div>

        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-amber-400 hover:text-amber-600 dark:hover:text-amber-400 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
            <span>{uploading ? 'Uploading...' : value ? 'Replace Signature' : 'Upload E-Signature'}</span>
          </button>

          {value && (
            <button
              type="button"
              disabled={uploading}
              onClick={() => onChange(null)}
              className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 cursor-pointer"
              title="Remove Saved E-Signature"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-1.5 font-medium">
          <AlertCircle size={13} />
          <span>{error}</span>
        </div>
      )}

      <div className="w-full max-w-xs h-16 rounded-xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center p-2 overflow-hidden">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="Saved E-Signature" className="max-h-full max-w-full object-contain" />
        ) : (
          <span className="text-[11px] text-slate-400">No E-signature uploaded yet</span>
        )}
      </div>
    </div>
  )
}
