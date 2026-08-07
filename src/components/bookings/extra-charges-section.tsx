'use client'

import { useState } from 'react'
import { Plus, DollarSign, ReceiptText, Tag } from 'lucide-react'

interface BookingCharge {
  id: string
  charge_type: string
  description: string
  quantity: number
  unit_amount: number
  amount: number
  status: string
}

interface ExtraChargesSectionProps {
  charges: BookingCharge[]
  onAddCharge: (newCharge: any) => Promise<void>
}

export function ExtraChargesSection({ charges, onAddCharge }: ExtraChargesSectionProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [loading, setLoading] = useState(false)
  const [chargeType, setChargeType] = useState('fuel_shortage')
  const [description, setDescription] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [unitAmount, setUnitAmount] = useState(1000)

  const chargeList = charges || []
  const totalExtraCharges = chargeList.reduce((acc, c) => acc + Number(c.amount || 0), 0)

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!description.trim()) {
      alert('Description is required.')
      return
    }

    setLoading(true)
    try {
      await onAddCharge({
        charge_type: chargeType,
        description,
        quantity,
        unit_amount: unitAmount,
        amount: quantity * unitAmount,
        status: 'pending',
      })
      setDescription('')
      setIsAdding(false)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 shadow-xs">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-2 h-5 bg-amber-400 rounded-full"></div>
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white text-sm">Additional Booking Charges</h2>
            <p className="text-[11px] text-slate-400">Structured extra KM, fuel, damage & fee records</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono font-black text-amber-500 text-sm">
            LKR {totalExtraCharges.toLocaleString()}
          </span>
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
          >
            <Plus size={14} />
            <span>Add Charge</span>
          </button>
        </div>
      </div>

      {/* Add Charge Form Inline */}
      {isAdding && (
        <form onSubmit={handleAdd} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Charge Type</label>
              <select
                value={chargeType}
                onChange={(e) => setChargeType(e.target.value)}
                className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-white"
              >
                <option value="extra_km">Extra Mileage (KM)</option>
                <option value="fuel_shortage">Fuel Shortage</option>
                <option value="damage">Vehicle Damage</option>
                <option value="late_return">Late Return Fee</option>
                <option value="cleaning">Special Cleaning</option>
                <option value="toll">Highway Toll</option>
                <option value="parking">Parking Expense</option>
                <option value="other">Other Charge</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Fuel 25% shortage refuel fee..."
                className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Quantity</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Unit Amount (LKR)</label>
              <input
                type="number"
                min="0"
                value={unitAmount}
                onChange={(e) => setUnitAmount(Number(e.target.value))}
                className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Total (LKR)</label>
              <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl font-mono font-bold text-amber-500 text-sm">
                {(quantity * unitAmount).toLocaleString()}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-1.5 bg-amber-400 text-slate-950 font-bold rounded-lg text-xs hover:bg-amber-300"
            >
              Save Charge
            </button>
          </div>
        </form>
      )}

      {/* Charge List */}
      <div className="space-y-2 text-xs">
        {chargeList.length > 0 ? (
          chargeList.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 uppercase">
                    {c.charge_type.replace('_', ' ')}
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">{c.description}</span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  {c.quantity} × LKR {Number(c.unit_amount).toLocaleString()}
                </span>
              </div>

              <div className="text-right">
                <span className="font-mono font-bold text-slate-900 dark:text-white text-sm block">
                  LKR {Number(c.amount).toLocaleString()}
                </span>
                <span className="text-[10px] text-amber-500 uppercase font-semibold">{c.status}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="py-6 text-center text-xs text-slate-400">No extra charges added yet.</div>
        )}
      </div>
    </div>
  )
}
