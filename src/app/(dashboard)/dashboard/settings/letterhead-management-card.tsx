'use client'

import { useState } from 'react'
import { Upload, RotateCcw, CheckCircle, AlertCircle, Image as ImageIcon, Loader2 } from 'lucide-react'
import { uploadCompanyLetterheadAction, removeCompanyLetterheadAction } from './settings-actions'

interface LetterheadManagementCardProps {
  currentLetterheadUrl?: string | null
}

export function LetterheadManagementCard({ currentLetterheadUrl }: LetterheadManagementCardProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const activeImageSrc = previewUrl || (currentLetterheadUrl ? `${currentLetterheadUrl}${currentLetterheadUrl.includes('?') ? '&' : '?'}v=${Date.now()}` : '/documents/thennakoon-tours-letterhead.png?v=20260909_seal')
  const isCustomAsset = Boolean(currentLetterheadUrl || previewUrl)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    setSuccessMsg(null)
    setErrorMsg(null)

    if (!file) return

    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
    if (!validTypes.includes(file.type)) {
      setErrorMsg('Invalid file format. Please upload a PNG or JPEG image.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('File size exceeds 5MB limit. Please upload a smaller image.')
      return
    }

    setSelectedFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleUpload = async () => {
    if (!selectedFile) return
    setUploading(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const res = await uploadCompanyLetterheadAction(formData)
      if (res.error) {
        setErrorMsg(res.error)
      } else {
        setSuccessMsg('Letterhead updated successfully! All new PDFs and print views will now use this letterhead.')
        setSelectedFile(null)
        setPreviewUrl(null)
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred while uploading.')
    } finally {
      setUploading(false)
    }
  }

  const handleReset = async () => {
    if (!confirm('Are you sure you want to reset the company letterhead to the built-in default asset?')) return
    setResetting(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    try {
      const res = await removeCompanyLetterheadAction()
      if (res.error) {
        setErrorMsg(res.error)
      } else {
        setSuccessMsg('Company letterhead reset to built-in default asset successfully.')
        setSelectedFile(null)
        setPreviewUrl(null)
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred while resetting.')
    } finally {
      setResetting(false)
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 overflow-hidden shadow-sm">
      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2 h-5 bg-amber-400 rounded-full"></div>
          <h2 className="font-bold text-slate-900 dark:text-white text-sm">Official Company Letterhead Management</h2>
        </div>
        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
          isCustomAsset
            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
        }`}>
          {isCustomAsset ? 'Custom Active Asset' : 'Built-in Default Asset'}
        </span>
      </div>

      <div className="p-6 space-y-5">
        {/* Success Alert */}
        {successMsg && (
          <div className="flex items-center gap-2 p-3.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
            <CheckCircle size={16} className="shrink-0 text-emerald-500" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="flex items-center gap-2 p-3.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-600 dark:text-rose-400 text-xs font-semibold">
            <AlertCircle size={16} className="shrink-0 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Controls & Details */}
          <div className="flex-1 space-y-4">
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Dynamic Document Background
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Upload your official company letterhead (A4 portrait ratio). Once uploaded, all generated PDFs (Invoices, Quotations, Receipts, Agreements) and Web Print views will instantly render this letterhead background.
              </p>
            </div>

            {/* Applicable Documents Tags */}
            <div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                Applied to Generated Documents
              </p>
              <div className="flex flex-wrap gap-1.5">
                {['Commercial Invoices', 'Quotations', 'Payment Receipts', 'Vehicle Rental Agreements', 'Customer Statements'].map((doc) => (
                  <span
                    key={doc}
                    className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-0.5 rounded-full font-medium"
                  >
                    {doc}
                  </span>
                ))}
              </div>
            </div>

            {/* File Upload Control */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Upload New Letterhead Asset (.PNG or .JPG, Max 5MB)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={handleFileChange}
                  className="block w-full text-xs text-slate-500 dark:text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-500/10 file:text-amber-600 dark:file:text-amber-400 hover:file:bg-amber-500/20 cursor-pointer"
                />
              </div>
              <p className="text-[10px] text-slate-400">Recommended dimensions: 2480 × 3508 pixels (300 DPI A4 portrait).</p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-3">
              <button
                type="button"
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-amber-400 text-slate-950 hover:bg-amber-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
              >
                {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                <span>{uploading ? 'Uploading Asset...' : 'Upload & Save Letterhead'}</span>
              </button>

              {currentLetterheadUrl && (
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={resetting || uploading}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all disabled:opacity-50"
                >
                  {resetting ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
                  <span>{resetting ? 'Resetting...' : 'Reset to Default'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Letterhead Live Preview */}
          <div className="shrink-0 w-full sm:w-48 lg:w-52 space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Live Preview</p>
              {selectedFile && (
                <span className="text-[9px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded">Unsaved Draft</span>
              )}
            </div>
            <div className="border-2 border-amber-400/30 rounded-xl overflow-hidden shadow-md bg-slate-50 dark:bg-slate-950 p-1.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeImageSrc}
                alt="Active Company Letterhead Preview"
                className="w-full h-auto max-h-72 object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
