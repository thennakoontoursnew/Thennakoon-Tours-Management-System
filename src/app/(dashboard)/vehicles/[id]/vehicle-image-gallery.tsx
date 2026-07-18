'use client'

import { useState } from 'react'
import { uploadVehicleImage, setPrimaryVehicleImage, deleteVehicleImage } from '../vehicle-actions'
import { Upload, Star, Trash2, Car, Image as ImageIcon } from 'lucide-react'

interface VehicleImage {
  id: string
  storage_path: string
  public_url: string
  alt_text?: string
  is_primary: boolean
}

interface Props {
  vehicleId: string
  images: VehicleImage[]
  canEdit: boolean
}

export default function VehicleImageGallery({ vehicleId, images, canEdit }: Props) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isPrimaryCheck, setIsPrimaryCheck] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile) return

    setUploading(true)
    setError(null)

    const formData = new FormData()
    formData.append('vehicle_id', vehicleId)
    formData.append('file', selectedFile)
    if (isPrimaryCheck) formData.append('is_primary', 'true')

    const res = await uploadVehicleImage(formData)
    if (!res.success) {
      setError(res.error || 'Upload failed.')
      setUploading(false)
      return
    }

    setSelectedFile(null)
    setUploading(false)
  }

  const primaryImage = images.find((img) => img.is_primary) || images[0]

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ImageIcon size={18} className="text-amber-500" />
            Vehicle Image Vault ({images.length} Photos)
          </h3>
          <p className="text-xs text-slate-400">Stored securely in Supabase Storage vehicle-images bucket.</p>
        </div>

        {canEdit && (
          <form onSubmit={handleUpload} className="flex flex-wrap items-center gap-2">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-100 dark:file:bg-slate-800 file:text-slate-700 dark:file:text-slate-300"
            />
            {selectedFile && (
              <label className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
                <input
                  type="checkbox"
                  checked={isPrimaryCheck}
                  onChange={(e) => setIsPrimaryCheck(e.target.checked)}
                />
                Primary
              </label>
            )}
            <button
              type="submit"
              disabled={uploading || !selectedFile}
              className="px-3 py-1.5 bg-amber-400 text-slate-950 text-xs font-bold rounded-lg hover:bg-amber-300 transition-all flex items-center gap-1 disabled:opacity-50 cursor-pointer"
            >
              <Upload size={14} />
              <span>{uploading ? 'Uploading...' : 'Upload'}</span>
            </button>
          </form>
        )}
      </div>

      {error && <p className="text-xs text-rose-500 font-semibold">{error}</p>}

      {/* Primary Banner & Gallery Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Featured Photo */}
        <div className="md:col-span-2 h-64 sm:h-80 rounded-2xl bg-slate-100 dark:bg-slate-850 overflow-hidden border border-slate-200 dark:border-slate-800 relative flex items-center justify-center">
          {primaryImage ? (
            <img src={primaryImage.public_url} alt="Primary vehicle" className="w-full h-full object-cover" />
          ) : (
            <div className="text-center space-y-2">
              <Car size={48} className="mx-auto text-slate-300" />
              <p className="text-xs text-slate-400">No images uploaded for this vehicle.</p>
            </div>
          )}
        </div>

        {/* Thumbnails */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">All Uploaded Media</h4>
          <div className="grid grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
            {images.map((img) => (
              <div key={img.id} className="relative group h-24 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200 dark:border-slate-700">
                <img src={img.public_url} alt="Vehicle thumbnail" className="w-full h-full object-cover" />
                {img.is_primary && (
                  <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-amber-400 text-slate-950 text-[9px] font-black rounded flex items-center gap-0.5">
                    <Star size={9} fill="currentColor" /> Primary
                  </span>
                )}
                {canEdit && (
                  <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    {!img.is_primary && (
                      <button
                        type="button"
                        onClick={() => setPrimaryVehicleImage(vehicleId, img.id)}
                        title="Make Primary"
                        className="p-1.5 bg-amber-400 text-slate-950 rounded-lg"
                      >
                        <Star size={14} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('Delete this image?')) deleteVehicleImage(img.id, vehicleId, img.storage_path)
                      }}
                      title="Delete Image"
                      className="p-1.5 bg-rose-500 text-white rounded-lg"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
