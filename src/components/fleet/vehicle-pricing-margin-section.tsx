'use client'

import { Calculator, Car, UserCheck, TrendingUp, AlertTriangle } from 'lucide-react'

interface VehiclePricingFormValues {
  daily_rate: number
  weekly_rate: number
  monthly_rate: number
  refundable_deposit: number
  allowed_km_per_day: number
  extra_km_charge: number
  owner_daily_rate_self: number
  owner_monthly_rate_self: number
  owner_daily_rate_with_driver: number
  owner_monthly_rate_with_driver: number
  selling_daily_rate_with_driver: number
  selling_monthly_rate_with_driver: number
  driver_bata_per_day: number
  monthly_km_quota: number
  owner_excess_km_rate: number
  service_interval_km: number
}

interface VehiclePricingMarginSectionProps {
  isOwnerLeased: boolean
  formData: VehiclePricingFormValues
  onNumberChange: (name: string, val: number) => void
}

function ProfitMarginBadge({ label, profit, selling }: { label: string; profit: number; selling: number }) {
  const pct = selling > 0 ? (profit / selling) * 100 : 0
  const isNegative = profit < 0
  const isZero = profit === 0 && selling === 0

  return (
    <div
      className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center justify-between gap-2 ${
        isNegative
          ? 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
          : isZero
          ? 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
          : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
      }`}
    >
      <span className="flex items-center gap-1.5 text-[11px]">
        {isNegative ? <AlertTriangle size={14} /> : <TrendingUp size={14} />}
        <span>{label}:</span>
      </span>
      <span className="font-mono font-black">
        LKR {profit.toLocaleString('en-US', { maximumFractionDigits: 2 })}{' '}
        {selling > 0 ? `(${pct.toFixed(1)}%)` : ''}
      </span>
    </div>
  )
}

export function VehiclePricingMarginSection({
  isOwnerLeased,
  formData,
  onNumberChange,
}: VehiclePricingMarginSectionProps) {
  const selfDailyCost = Number(formData.owner_daily_rate_self || 0)
  const selfDailySelling = Number(formData.daily_rate || 0)
  const selfDailyProfit = selfDailySelling - selfDailyCost

  const selfMonthlyCost = Number(formData.owner_monthly_rate_self || 0)
  const selfMonthlySelling = Number(formData.monthly_rate || 0)
  const selfMonthlyProfit = selfMonthlySelling - selfMonthlyCost

  const driverDailyOwnerCost = Number(formData.owner_daily_rate_with_driver || 0)
  const driverBata = Number(formData.driver_bata_per_day || 0)
  const driverDailySelling = Number(formData.selling_daily_rate_with_driver || 0)
  const driverDailyProfit = driverDailySelling - (driverDailyOwnerCost + driverBata)

  const driverMonthlyCost = Number(formData.owner_monthly_rate_with_driver || 0)
  const driverMonthlySelling = Number(formData.selling_monthly_rate_with_driver || 0)
  const driverMonthlyProfit = driverMonthlySelling - driverMonthlyCost

  const handleNum = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    onNumberChange(name, parseFloat(value) || 0)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
          <Calculator size={15} />
          <span>Section B: Dual Pricing & Live Profit Margin Matrix (Self-Drive vs. With Driver)</span>
        </h3>
        <span className="text-[11px] text-slate-400">
          {isOwnerLeased ? 'Compare Owner Payout vs. Company Selling Rate' : 'Company Asset Pricing (Owner Cost optional / LKR 0)'}
        </span>
      </div>

      {/* Side-by-Side Dual Rate & Margin Blocks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* BLOCK 1: WITHOUT DRIVER (SELF-DRIVE) */}
        <div className="p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-700/60 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-400/20 text-amber-600 dark:text-amber-400">
                <Car size={15} />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wide">
                  Without Driver (Self-Drive)
                </h4>
                <p className="text-[10px] text-slate-500">Customer drives directly • Used as primary quotation/booking default</p>
              </div>
            </div>
          </div>

          {/* Daily Basis */}
          <div className="space-y-2 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Daily Basis</span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Owner Daily Cost (LKR)
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  name="owner_daily_rate_self"
                  value={formData.owner_daily_rate_self}
                  onChange={handleNum}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Our Selling Daily Rate (LKR) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  required
                  name="daily_rate"
                  value={formData.daily_rate}
                  onChange={handleNum}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-amber-500 font-mono font-bold"
                />
              </div>
            </div>
            <ProfitMarginBadge label="Net Daily Profit" profit={selfDailyProfit} selling={selfDailySelling} />
          </div>

          {/* Monthly Basis */}
          <div className="space-y-2 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Monthly Basis</span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Owner Monthly Cost (LKR)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  name="owner_monthly_rate_self"
                  value={formData.owner_monthly_rate_self}
                  onChange={handleNum}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Our Selling Monthly Rate (LKR)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  name="monthly_rate"
                  value={formData.monthly_rate}
                  onChange={handleNum}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-amber-500 font-mono font-bold"
                />
              </div>
            </div>
            <ProfitMarginBadge label="Net Monthly Profit" profit={selfMonthlyProfit} selling={selfMonthlySelling} />
          </div>

          {/* Mileage & Deposit */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Allowed KM / Day</label>
              <input
                type="number"
                min="0"
                name="allowed_km_per_day"
                value={formData.allowed_km_per_day}
                onChange={handleNum}
                className="w-full p-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Extra KM Charge (Selling)</label>
              <input
                type="number"
                min="0"
                name="extra_km_charge"
                value={formData.extra_km_charge}
                onChange={handleNum}
                className="w-full p-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Owner Excess KM Rate</label>
              <input
                type="number"
                min="0"
                name="owner_excess_km_rate"
                value={formData.owner_excess_km_rate}
                onChange={handleNum}
                className="w-full p-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Refundable Deposit (LKR)</label>
              <input
                type="number"
                min="0"
                step="1000"
                name="refundable_deposit"
                value={formData.refundable_deposit}
                onChange={handleNum}
                className="w-full p-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none font-mono font-bold"
              />
            </div>
          </div>
        </div>

        {/* BLOCK 2: WITH DRIVER (CHAUFFEUR-DRIVEN) */}
        <div className="p-5 rounded-2xl bg-blue-50/40 dark:bg-blue-950/15 border border-blue-200/80 dark:border-blue-800/50 space-y-4">
          <div className="flex items-center justify-between border-b border-blue-200/60 dark:border-blue-800/40 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-600 dark:text-blue-400">
                <UserCheck size={15} />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wide">
                  With Driver (Chauffeur-Driven)
                </h4>
                <p className="text-[10px] text-slate-500">Chauffeur / driver supplied • Tracks Driver Bata separately</p>
              </div>
            </div>
          </div>

          {/* Daily Basis (With Driver) */}
          <div className="space-y-2 p-3 rounded-xl bg-white dark:bg-slate-900 border border-blue-100 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Daily Basis (With Driver)</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Owner Daily Cost (LKR)
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  name="owner_daily_rate_with_driver"
                  value={formData.owner_daily_rate_with_driver}
                  onChange={handleNum}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Driver Bata / Day (LKR)
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  name="driver_bata_per_day"
                  value={formData.driver_bata_per_day}
                  onChange={handleNum}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Our Selling Daily Rate (LKR)
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  name="selling_daily_rate_with_driver"
                  value={formData.selling_daily_rate_with_driver}
                  onChange={handleNum}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-blue-500 font-mono font-bold"
                />
              </div>
            </div>
            <ProfitMarginBadge
              label="Net Daily Profit (After Owner & Bata)"
              profit={driverDailyProfit}
              selling={driverDailySelling}
            />
          </div>

          {/* Monthly Basis (With Driver) */}
          <div className="space-y-2 p-3 rounded-xl bg-white dark:bg-slate-900 border border-blue-100 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Monthly Basis (With Driver)</span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Owner Monthly Cost (LKR)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  name="owner_monthly_rate_with_driver"
                  value={formData.owner_monthly_rate_with_driver}
                  onChange={handleNum}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Our Selling Monthly Rate (LKR)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  name="selling_monthly_rate_with_driver"
                  value={formData.selling_monthly_rate_with_driver}
                  onChange={handleNum}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-blue-500 font-mono font-bold"
                />
              </div>
            </div>
            <ProfitMarginBadge
              label="Net Monthly Profit"
              profit={driverMonthlyProfit}
              selling={driverMonthlySelling}
            />
          </div>

          {/* Weekly Rate & Agreement/Service Terms */}
          <div className="grid grid-cols-3 gap-3 pt-1">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Weekly Rate (Selling)</label>
              <input
                type="number"
                min="0"
                step="500"
                name="weekly_rate"
                value={formData.weekly_rate}
                onChange={handleNum}
                className="w-full p-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Monthly KM Quota</label>
              <input
                type="number"
                min="0"
                step="100"
                name="monthly_km_quota"
                value={formData.monthly_km_quota}
                onChange={handleNum}
                className="w-full p-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Service Interval (KM)</label>
              <input
                type="number"
                min="0"
                step="500"
                name="service_interval_km"
                value={formData.service_interval_km}
                onChange={handleNum}
                className="w-full p-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none font-mono"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
