'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Fuel, Plus, Trash2, Filter, TrendingDown, AlertCircle, Car, Gauge } from 'lucide-react'
import { createFuelLogAction, deleteFuelLogAction } from './fuel-actions'

interface FuelLog {
  id: string
  vehicle_id: string
  log_date: string
  fuel_type: string
  liters: number
  cost_per_liter: number
  total_cost: number
  odometer_reading?: number
  station_name?: string
  station_location?: string
  receipt_number?: string
  notes?: string
  vehicle?: { vehicle_name: string; registration_number: string }
  driver?: { full_name: string }
}

interface Vehicle {
  id: string
  vehicle_name: string
  registration_number: string
  fuel_type?: string
}

interface Driver {
  id: string
  full_name: string
}

interface FuelTrackingClientProps {
  fuelLogs: FuelLog[]
  vehicles: Vehicle[]
  drivers: Driver[]
  analytics: {
    totalCost: number
    totalLiters: number
    avgCostPerLiter: number
    logsThisMonth: number
    costThisMonth: number
  }
}

const FUEL_TYPES = ['diesel', 'petrol', 'electric', 'hybrid', 'cng', 'lpg']

function FuelLogModal({
  isOpen, onClose, vehicles, drivers
}: {
  isOpen: boolean
  onClose: () => void
  vehicles: Vehicle[]
  drivers: Driver[]
}) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const today = new Date().toISOString().slice(0, 10)

  const [form, setForm] = useState({
    vehicle_id: '',
    driver_id: '',
    log_date: today,
    fuel_type: 'diesel',
    liters: '',
    cost_per_liter: '',
    odometer_reading: '',
    station_name: '',
    station_location: '',
    receipt_number: '',
    notes: '',
  })

  if (!isOpen) return null

  const totalCost = form.liters && form.cost_per_liter
    ? (Number(form.liters) * Number(form.cost_per_liter)).toFixed(2)
    : '0.00'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.vehicle_id) { setError('Please select a vehicle'); return }
    if (!form.liters || !form.cost_per_liter) { setError('Liters and cost per liter are required'); return }
    setSaving(true)
    setError('')

    try {
      const result = await createFuelLogAction(form)
      if (result?.error) { setError(result.error); return }
      router.refresh()
      onClose()
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 p-5 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-400/10 rounded-lg">
              <Fuel size={18} className="text-emerald-600" />
            </div>
            <h2 className="font-black text-slate-900 dark:text-white text-base">Log Fuel Entry</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-xl font-bold">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-600 dark:text-rose-400 text-sm">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Vehicle <span className="text-rose-500">*</span></label>
              <select
                required
                value={form.vehicle_id}
                onChange={(e) => setForm({ ...form, vehicle_id: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              >
                <option value="">Select vehicle...</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>{v.vehicle_name} ({v.registration_number})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Date <span className="text-rose-500">*</span></label>
              <input
                required
                type="date"
                value={form.log_date}
                onChange={(e) => setForm({ ...form, log_date: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Driver</label>
              <select
                value={form.driver_id}
                onChange={(e) => setForm({ ...form, driver_id: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              >
                <option value="">No driver</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>{d.full_name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Fuel Type</label>
              <select
                value={form.fuel_type}
                onChange={(e) => setForm({ ...form, fuel_type: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              >
                {FUEL_TYPES.map((t) => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Liters <span className="text-rose-500">*</span></label>
              <input
                required
                type="number"
                min="0.1"
                step="0.01"
                value={form.liters}
                onChange={(e) => setForm({ ...form, liters: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">LKR / Liter <span className="text-rose-500">*</span></label>
              <input
                required
                type="number"
                min="0.01"
                step="0.01"
                value={form.cost_per_liter}
                onChange={(e) => setForm({ ...form, cost_per_liter: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Total Cost Preview */}
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Total Cost</span>
            <span className="font-mono font-black text-emerald-700 dark:text-emerald-400 text-lg">LKR {Number(totalCost).toLocaleString()}</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Odometer (KM)</label>
              <input
                type="number"
                min="0"
                value={form.odometer_reading}
                onChange={(e) => setForm({ ...form, odometer_reading: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                placeholder="Current KM reading"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Receipt No.</label>
              <input
                type="text"
                value={form.receipt_number}
                onChange={(e) => setForm({ ...form, receipt_number: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                placeholder="Receipt number"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Station Name</label>
              <input
                type="text"
                value={form.station_name}
                onChange={(e) => setForm({ ...form, station_name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                placeholder="Fuel station"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Location</label>
              <input
                type="text"
                value={form.station_location}
                onChange={(e) => setForm({ ...form, station_location: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                placeholder="City / area"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Notes</label>
              <input
                type="text"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                placeholder="Optional notes"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-all">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="px-5 py-2 rounded-xl text-sm font-bold bg-emerald-500 text-white hover:bg-emerald-400 transition-all disabled:opacity-50">
              {saving ? 'Saving...' : 'Log Fuel Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function FuelTrackingClient({ fuelLogs, vehicles, drivers, analytics }: FuelTrackingClientProps) {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [vehicleFilter, setVehicleFilter] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const filtered = fuelLogs.filter((log) => {
    if (!vehicleFilter) return true
    return log.vehicle_id === vehicleFilter
  })

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this fuel log entry?')) return
    setDeletingId(id)
    try {
      await deleteFuelLogAction(id)
      router.refresh()
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <>
      <FuelLogModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        vehicles={vehicles}
        drivers={drivers}
      />

      <div className="space-y-6 max-w-6xl mx-auto pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Fuel Tracking</h1>
            <p className="text-slate-500 text-xs mt-1">Monitor vehicle refueling, consumption, and fleet fuel costs.</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-emerald-500 text-white hover:bg-emerald-400 transition-all shadow-sm"
          >
            <Plus size={16} />
            Log Fuel Entry
          </button>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Fuel Cost</span>
            <span className="font-mono font-black text-slate-900 dark:text-white text-lg">LKR {analytics.totalCost.toLocaleString()}</span>
          </div>
          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <span className="text-[10px] font-bold uppercase text-emerald-500 block">Total Liters</span>
            <span className="font-mono font-black text-emerald-500 text-lg">{analytics.totalLiters.toLocaleString(undefined, { maximumFractionDigits: 1 })} L</span>
          </div>
          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <span className="text-[10px] font-bold uppercase text-amber-500 block">Avg Cost / Liter</span>
            <span className="font-mono font-black text-amber-500 text-lg">LKR {analytics.avgCostPerLiter.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
          </div>
          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <span className="text-[10px] font-bold uppercase text-blue-500 block">This Month</span>
            <span className="font-mono font-black text-blue-500 text-lg">{analytics.logsThisMonth} Logs</span>
          </div>
          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <span className="text-[10px] font-bold uppercase text-purple-500 block">Month Cost</span>
            <span className="font-mono font-black text-purple-500 text-lg">LKR {analytics.costThisMonth.toLocaleString()}</span>
          </div>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-slate-500">
            <Filter size={14} />
          </div>
          <select
            value={vehicleFilter}
            onChange={(e) => setVehicleFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
          >
            <option value="">All Vehicles</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>{v.vehicle_name} ({v.registration_number})</option>
            ))}
          </select>
          <span className="text-xs text-slate-400">{filtered.length} entries</span>
        </div>

        {/* Fuel Logs Table */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                <Fuel size={24} className="text-slate-400" />
              </div>
              <p className="text-slate-500 text-sm font-medium">No fuel logs yet</p>
              <p className="text-slate-400 text-xs mt-1">Start logging fuel entries to track fleet consumption and costs.</p>
              <button onClick={() => setShowModal(true)} className="mt-4 px-4 py-2 text-sm font-bold bg-emerald-500 text-white rounded-xl hover:bg-emerald-400 transition-all">
                <Plus size={14} className="inline mr-1" /> Log First Entry
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                    <th className="text-left text-[10px] font-bold uppercase text-slate-400 px-4 py-3">Date</th>
                    <th className="text-left text-[10px] font-bold uppercase text-slate-400 px-4 py-3">Vehicle</th>
                    <th className="text-left text-[10px] font-bold uppercase text-slate-400 px-4 py-3">Driver</th>
                    <th className="text-right text-[10px] font-bold uppercase text-slate-400 px-4 py-3">Liters</th>
                    <th className="text-right text-[10px] font-bold uppercase text-slate-400 px-4 py-3">Cost/L</th>
                    <th className="text-right text-[10px] font-bold uppercase text-slate-400 px-4 py-3">Total</th>
                    <th className="text-right text-[10px] font-bold uppercase text-slate-400 px-4 py-3">Odometer</th>
                    <th className="text-left text-[10px] font-bold uppercase text-slate-400 px-4 py-3">Station</th>
                    <th className="text-right text-[10px] font-bold uppercase text-slate-400 px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filtered.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-mono text-xs text-slate-900 dark:text-white">{log.log_date}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Car size={13} className="text-slate-400 shrink-0" />
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white text-xs">{log.vehicle?.vehicle_name || '—'}</div>
                            <div className="text-[10px] text-slate-400">{log.vehicle?.registration_number}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">
                        {log.driver?.full_name || <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{Number(log.liters).toLocaleString()} L</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-mono text-xs text-slate-600 dark:text-slate-400">LKR {Number(log.cost_per_liter).toFixed(2)}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-mono font-bold text-slate-900 dark:text-white">LKR {Number(log.total_cost).toLocaleString()}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {log.odometer_reading ? (
                          <span className="font-mono text-xs text-slate-600 dark:text-slate-400 flex items-center justify-end gap-1">
                            <Gauge size={11} /> {Number(log.odometer_reading).toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs text-slate-600 dark:text-slate-400">{log.station_name || '—'}</div>
                        {log.station_location && <div className="text-[10px] text-slate-400">{log.station_location}</div>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleDelete(log.id)}
                          disabled={deletingId === log.id}
                          className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                          title="Delete fuel log"
                        >
                          {deletingId === log.id ? '...' : <Trash2 size={14} />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Total ({filtered.length} entries)</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                      {filtered.reduce((s, l) => s + Number(l.liters), 0).toLocaleString(undefined, { maximumFractionDigits: 1 })} L
                    </td>
                    <td></td>
                    <td className="px-4 py-3 text-right font-mono font-black text-slate-900 dark:text-white">
                      LKR {filtered.reduce((s, l) => s + Number(l.total_cost), 0).toLocaleString()}
                    </td>
                    <td colSpan={3}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
