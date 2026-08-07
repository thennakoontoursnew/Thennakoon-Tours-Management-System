import { createClient } from '@/lib/supabase/server'
import { Folder, Image as ImageIcon, Video, FileText } from 'lucide-react'

export const metadata = {
  title: 'Content Library — Thennakoon Tours',
}

export default async function ContentLibraryPage() {
  const supabase = await createClient()

  const { data: assets } = await supabase
    .from('marketing_assets')
    .select('*')
    .eq('is_archived', false)
    .order('created_at', { ascending: false })

  const items = assets || []

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Marketing Content Library</h1>
        <p className="text-slate-500 text-xs mt-1">Centralized media repository for vehicle photos, tour videos, brand assets, and creative templates.</p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 shadow-xs">
        <h2 className="text-xs font-bold uppercase tracking-wider text-amber-500 border-b border-slate-100 dark:border-slate-800 pb-3">
          Media Asset Repository
        </h2>

        {items.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {items.map((asset: any) => (
              <div key={asset.id} className="bg-slate-50 dark:bg-slate-850 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="h-28 bg-slate-200 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-400">
                  <ImageIcon size={24} />
                </div>
                <div className="font-bold text-slate-900 dark:text-white text-xs truncate">{asset.title}</div>
                <div className="text-[10px] text-slate-400 font-mono">{asset.asset_type} • {asset.category}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-slate-400 italic">No media assets in Content Library repository.</div>
        )}
      </div>
    </div>
  )
}
