'use client'

import { useState } from 'react'
import { uploadDriverDocument, deleteDriverDocument } from '../driver-actions'
import { Upload, FileText, Trash2, ExternalLink, Shield } from 'lucide-react'

interface DocumentItem {
  id: string
  document_type: string
  storage_path: string
  public_url?: string | null
  file_name?: string | null
  expiry_date?: string | null
}

interface Props {
  driverId: string
  documents: DocumentItem[]
  canEdit: boolean
}

export default function DriverDocumentVault({ driverId, documents, canEdit }: Props) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [documentType, setDocumentType] = useState('driving_license_front')
  const [expiryDate, setExpiryDate] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile) return

    setUploading(true)
    setError(null)

    const formData = new FormData()
    formData.append('driver_id', driverId)
    formData.append('document_type', documentType)
    formData.append('expiry_date', expiryDate)
    formData.append('file', selectedFile)

    const res = await uploadDriverDocument(formData)
    if (!res.success) {
      setError(res.error || 'Document upload failed.')
      setUploading(false)
      return
    }

    setSelectedFile(null)
    setExpiryDate('')
    setUploading(false)
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Shield size={18} className="text-amber-500" />
            Private Compliance Document Vault ({documents.length} Files)
          </h3>
          <p className="text-xs text-slate-400">Stored in private driver-documents bucket with signed URL access.</p>
        </div>
      </div>

      {canEdit && (
        <form onSubmit={handleUpload} className="bg-slate-50 dark:bg-slate-850 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Document Type *</label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="w-full p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700"
              >
                <option value="driving_license_front">Driving License Front</option>
                <option value="driving_license_back">Driving License Back</option>
                <option value="nic_front">NIC Front</option>
                <option value="nic_back">NIC Back</option>
                <option value="police_clearance">Police Clearance Certificate</option>
                <option value="medical_certificate">Medical Certificate</option>
                <option value="profile_photo">Profile Photo</option>
                <option value="other">Other Document</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Expiry Date (Optional)</label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Select File (PDF / Image) *</label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-amber-400 file:text-slate-950 file:font-bold"
              />
            </div>
          </div>

          {error && <p className="text-xs text-rose-500 font-semibold">{error}</p>}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={uploading || !selectedFile}
              className="px-4 py-2 bg-amber-400 text-slate-950 text-xs font-bold rounded-lg hover:bg-amber-300 transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <Upload size={14} />
              <span>{uploading ? 'Uploading Document...' : 'Upload Document'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Document List Table */}
      <div className="space-y-2">
        {documents && documents.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
            {documents.map((doc) => (
              <div key={doc.id} className="p-3 bg-white dark:bg-slate-900 flex items-center justify-between hover:bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <FileText className="text-amber-500" size={18} />
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 capitalize block">
                      {doc.document_type.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{doc.file_name || doc.storage_path}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {doc.public_url && (
                    <a
                      href={doc.public_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-amber-500 text-[11px] font-semibold rounded-lg flex items-center gap-1"
                    >
                      <ExternalLink size={12} />
                      <span>View</span>
                    </a>
                  )}
                  {canEdit && (
                    <button
                      onClick={() => {
                        if (confirm('Delete this compliance document?')) deleteDriverDocument(doc.id, driverId, doc.storage_path)
                      }}
                      className="p-1 text-slate-400 hover:text-rose-500 cursor-pointer"
                      title="Delete document"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-xs text-slate-400 py-4">No documents uploaded in vault.</p>
        )}
      </div>
    </div>
  )
}
