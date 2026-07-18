import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft, Plus, Folder, CheckCircle, XCircle } from 'lucide-react'
import CategoryDialog from './category-dialog'

export default async function VehicleCategoriesPage() {
  const supabase = await createClient()

  const { data: categories } = await supabase
    .from('vehicle_categories')
    .select('*, vehicles(id)')
    .order('display_order', { ascending: true })

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/vehicles"
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Vehicle Categories</h1>
            <p className="text-xs text-slate-500">Configure fleet classifications, descriptions, and display sequence.</p>
          </div>
        </div>
        <CategoryDialog />
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
        {categories && categories.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-850 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider">
                  <th className="py-3 px-4">Order</th>
                  <th className="py-3 px-4">Category Name</th>
                  <th className="py-3 px-4">Slug</th>
                  <th className="py-3 px-4">Assigned Vehicles</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-slate-700 dark:text-slate-300">
                {categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-850/50">
                    <td className="py-3 px-4 font-bold text-slate-400">#{cat.display_order}</td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{cat.name}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{cat.slug}</td>
                    <td className="py-3 px-4 font-semibold">{cat.vehicles?.length || 0} vehicles</td>
                    <td className="py-3 px-4">
                      {cat.is_active ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/10 text-slate-400 border border-slate-500/20">
                          Inactive
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center space-y-2">
            <Folder size={32} className="mx-auto text-slate-400" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No Categories Found</p>
          </div>
        )}
      </div>
    </div>
  )
}
