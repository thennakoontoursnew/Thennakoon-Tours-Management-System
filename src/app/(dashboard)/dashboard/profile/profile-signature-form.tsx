'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PenTool, Upload, Trash2, CheckCircle, AlertCircle, Loader2, Save, UserCheck } from 'lucide-react'
import { updateStaffProfileDetailsAction } from '../users/user-actions'

interface ProfileSignatureFormProps {
  profile: {
    id: string
    full_name: string
    email: string
    role: string
    phone: string | null
    designation: string | null
    signature_url: string | null
  }
}

const DESIGNATION_SUGGESTIONS = [
  'Executive Operation',
  'Operations Manager',
  'Technical Officer',
  'Director',
  'Booking Coordinator',
  'Finance Officer',
]

export function ProfileSignatureForm({ profile }: ProfileSignatureFormProps) {
  const router = useRouter()
  const [fullName, setFullName] = useState(profile.full_name || '')
  const [phone, setPhone] = useState(profile.phone || '')
  const [designation, setDesignation] = useState(profile.designation || '')
  const [currentSigUrl, setCurrentSigUrl] = useState<string | null>(profile.signature_url || null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [removeSig, setRemoveSig] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const displaySignature = removeSig ? null : previewUrl || currentSigUrl

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    setError(null)
    if (!file) return

    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
    if (!validTypes.includes(file.type)) {
      setError('Invalid file format. Upload a PNG, JPG, or WEBP image.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB.')
      return
    }

    setSelectedFile(file)
    setRemoveSig(false)
    const reader = new FileReader()
    reader.onloadend = () => setPreviewUrl(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSaved(false)

    try {
      const fd = new FormData()
      fd.append('target_user_id', profile.id)
      fd.append('full_name', fullName)
      fd.append('phone', phone)
      fd.append('designation', designation)
      if (removeSig) fd.append('remove_signature', 'true')
      if (selectedFile) fd.append('signature_file', selectedFile)

      const res = await updateStaffProfileDetailsAction(fd)
      if (res.error) {
        setError(res.error)
      } else {
        if (res.signatureUrl !== undefined) {
          setCurrentSigUrl(res.signatureUrl)
        }
        setSelectedFile(null)
        setPreviewUrl(null)
        setRemoveSig(false)
        setSaved(true)
        router.refresh()
        setTimeout(() => setSaved(false), 4000)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-6 shadow-xs">
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2 font-semibold">
          <AlertCircle size={15} />
          <span>{error}</span>
        </div>
      )}
      {saved && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2 font-semibold">
          <CheckCircle size={15} />
          <span>Staff profile, designation, and digital signature saved successfully!</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
            Full Name
          </label>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-amber-400"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
            Phone Number
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+94 77 xxx xxxx"
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-amber-400"
          />
        </div>
      </div>

      {/* Official Designation */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
          Official Designation (Printed on Extension Letters & Agreements)
        </label>
        <input
          type="text"
          value={designation}
          onChange={(e) => setDesignation(e.target.value)}
          placeholder="e.g. Executive Operation"
          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-amber-400"
        />
        <div className="flex flex-wrap gap-1.5 pt-1">
          {DESIGNATION_SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setDesignation(s)}
              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/30 border border-slate-200 dark:border-slate-700 text-[11px] font-medium text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Staff Digital Signature */}
      <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
        <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <PenTool size={14} className="text-amber-500" />
          <span>Personal Digital Signature Image</span>
        </label>

        <div className="flex flex-col sm:flex-row items-start gap-5">
          <div className="w-full sm:w-64 h-32 rounded-xl bg-white dark:bg-slate-950 border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center p-3 overflow-hidden">
            {displaySignature ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={displaySignature}
                alt="Staff Digital Signature"
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <div className="text-center text-slate-400 text-xs space-y-1">
                <UserCheck size={20} className="mx-auto opacity-50" />
                <div className="font-semibold">No Signature Uploaded</div>
                <div className="text-[10px]">Transparent PNG / White background recommended</div>
              </div>
            )}
          </div>

          <div className="flex-1 space-y-3">
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={handleFileChange}
              className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-400 file:text-slate-950 hover:file:bg-amber-300 cursor-pointer"
            />
            {displaySignature && (
              <button
                type="button"
                onClick={() => {
                  setRemoveSig(true)
                  setSelectedFile(null)
                  setPreviewUrl(null)
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-500 hover:text-rose-600 cursor-pointer"
              >
                <Trash2 size={13} />
                <span>Remove Signature</span>
              </button>
            )}
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Your signature and designation are automatically embedded on Extension Letters issued under your name.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          <span>{saving ? 'Saving...' : 'Save Profile & Signature'}</span>
        </button>
      </div>
    </form>
  )
}
