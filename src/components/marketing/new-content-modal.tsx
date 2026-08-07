'use client'

import { useState } from 'react'
import { FileText, X } from 'lucide-react'

interface NewContentModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (contentData: any) => Promise<void>
}

export function NewContentModal({ isOpen, onClose, onSubmit }: NewContentModalProps) {
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState('')
  const [contentType, setContentType] = useState('Facebook Post')
  const [contentPillar, setContentPillar] = useState('Vehicle Showcase')
  const [plannedPublishAt, setPlannedPublishAt] = useState(new Date().toISOString().slice(0, 10))
  const [caption, setCaption] = useState('')
  const [script, setScript] = useState('')

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setLoading(true)
    try {
      await onSubmit({
        title,
        content_type: contentType,
        content_pillar: contentPillar,
        planned_publish_at: `${plannedPublishAt}T10:00:00.000Z`,
        caption,
        script,
        status: 'planned',
      })
      onClose()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl space-y-0">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <FileText size={20} />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white text-sm">Create Marketing Content Item</h2>
              <p className="text-[11px] text-slate-400">Plan social posts, reels, video scripts, and promo captions</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Content Title <span className="text-rose-500">*</span></label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. KDH Super GL Luxury Tour Showcase Reel"
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-semibold"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Format / Type</label>
              <select
                value={contentType}
                onChange={(e) => setContentType(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-semibold"
              >
                <option value="Facebook Post">Facebook Post</option>
                <option value="Instagram Reel">Instagram Reel</option>
                <option value="TikTok Video">TikTok Video</option>
                <option value="YouTube Short">YouTube Short</option>
                <option value="Google Business Post">Google Business Post</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Content Pillar</label>
              <select
                value={contentPillar}
                onChange={(e) => setContentPillar(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-semibold"
              >
                <option value="Vehicle Showcase">Vehicle Showcase</option>
                <option value="Travel Tips">Travel Tips</option>
                <option value="Behind The Scenes">Behind The Scenes</option>
                <option value="Offer / Promotion">Offer / Promotion</option>
                <option value="Customer Review">Customer Review</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Planned Publish Date</label>
            <input
              type="date"
              value={plannedPublishAt}
              onChange={(e) => setPlannedPublishAt(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-semibold"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Post Caption / Copy</label>
            <textarea
              rows={3}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write social post caption with hashtags..."
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-xs shadow-xs transition-all cursor-pointer"
            >
              {loading ? 'Saving...' : 'Plan Content'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
