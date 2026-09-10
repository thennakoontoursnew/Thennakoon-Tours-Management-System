'use client'

import { useState, useEffect } from 'react'
import { Plus, X, Trash2, FileText, ChevronDown, ChevronUp } from 'lucide-react'

import { getNextVoucherNumberAction, getCurrentUserProfilePreparedByAction } from '@/app/(dashboard)/dashboard/invoices/finance-actions'

export interface ExpenseBreakdownRow {
  description: string
  amount: number
}

export interface NewExpenseModalProps {
  isOpen: boolean
  onClose: () => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSubmit: (expenseData: any) => Promise<void>
}

export function NewExpenseModal({ isOpen, onClose, onSubmit }: NewExpenseModalProps) {
  const [loading, setLoading] = useState(false)
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10))
  const [category, setCategory] = useState('fuel')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [supplierName, setSupplierName] = useState('')
  const [referenceNumber, setReferenceNumber] = useState('')

  // Structured Voucher & Owner Statement fields
  const [isVoucherMode, setIsVoucherMode] = useState(false)
  const [voucherNumber, setVoucherNumber] = useState('')
  const [billName, setBillName] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [bankName, setBankName] = useState('')
  const [branchName, setBranchName] = useState('')
  
  const [additions, setAdditions] = useState<ExpenseBreakdownRow[]>([])
  const [deductions, setDeductions] = useState<ExpenseBreakdownRow[]>([])
  
  const [remark, setRemark] = useState('')
  const [specialNotice, setSpecialNotice] = useState('')
  const [preparedBy, setPreparedBy] = useState('Finance Officer')
  const [approvedBy, setApprovedBy] = useState('K. Thennakoon (Managing Director)')
  const [isAuthorized, setIsAuthorized] = useState(true)

  // Auto-generate sequential voucher number (VN-10001) & load logged-in user profile on modal open
  useEffect(() => {
    if (isOpen) {
      getNextVoucherNumberAction()
        .then((vNum) => setVoucherNumber(vNum))
        .catch(() => setVoucherNumber('VN-10001'))

      getCurrentUserProfilePreparedByAction()
        .then((prof) => {
          if (prof.formatted) setPreparedBy(prof.formatted)
        })
        .catch(() => {})
    }
  }, [isOpen])

  // Automatically enable voucher mode if category is owner_statement
  useEffect(() => {
    if (category === 'owner_statement') {
      setIsVoucherMode(true)
      if (!billName) setBillName('Owner Statement & Monthly Settlement')
    }
  }, [category, billName])

  // Calculate Net Balance dynamically when additions or deductions change
  const totalAdditions = additions.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
  const totalDeductions = deductions.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
  const calculatedNet = totalAdditions - totalDeductions

  // Sync main amount if in voucher mode with itemized breakdown
  useEffect(() => {
    if (isVoucherMode && (additions.length > 0 || deductions.length > 0)) {
      setAmount(String(calculatedNet >= 0 ? calculatedNet : 0))
    }
  }, [isVoucherMode, calculatedNet, additions.length, deductions.length])

  if (!isOpen) return null

  const handleAddAddition = () => {
    setAdditions([...additions, { description: '', amount: 0 }])
  }

  const handleRemoveAddition = (index: number) => {
    setAdditions(additions.filter((_, i) => i !== index))
  }

  const handleUpdateAddition = (index: number, field: 'description' | 'amount', value: string | number) => {
    const next = [...additions]
    next[index] = { ...next[index], [field]: value }
    setAdditions(next)
  }

  const handleAddDeduction = () => {
    setDeductions([...deductions, { description: '', amount: 0 }])
  }

  const handleRemoveDeduction = (index: number) => {
    setDeductions(deductions.filter((_, i) => i !== index))
  }

  const handleUpdateDeduction = (index: number, field: 'description' | 'amount', value: string | number) => {
    const next = [...deductions]
    next[index] = { ...next[index], [field]: value }
    setDeductions(next)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const numAmount = isVoucherMode && (additions.length > 0 || deductions.length > 0)
      ? calculatedNet
      : Number(amount)

    if (isNaN(numAmount) || !description.trim()) {
      alert('Please fill in a valid description and amount.')
      return
    }

    setLoading(true)
    try {
      await onSubmit({
        expense_date: expenseDate,
        category,
        description,
        amount: numAmount,
        payment_method: paymentMethod,
        supplier_name: supplierName || customerName || undefined,
        reference_number: referenceNumber || undefined,
        voucher_number: isVoucherMode ? voucherNumber : undefined,
        bill_name: isVoucherMode ? billName : undefined,
        customer_name: isVoucherMode ? customerName : undefined,
        account_number: isVoucherMode ? accountNumber : undefined,
        bank_name: isVoucherMode ? bankName : undefined,
        branch_name: isVoucherMode ? branchName : undefined,
        add_payments_breakdown: isVoucherMode && additions.length > 0 ? additions : undefined,
        deduction_breakdown: isVoucherMode && deductions.length > 0 ? deductions : undefined,
        net_balance: isVoucherMode ? numAmount : undefined,
        remark: isVoucherMode ? remark : undefined,
        special_notice: isVoucherMode ? specialNotice : undefined,
        prepared_by: preparedBy || undefined,
        approved_by: isAuthorized ? (approvedBy || 'K. Thennakoon (Managing Director)') : 'Pending Approval',
      })
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to record expense.'
      alert(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full my-8 overflow-hidden shadow-2xl space-y-0">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
              <Plus size={20} />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white text-sm">Record Operating Expense / Owner Statement</h2>
              <p className="text-[11px] text-slate-400">Log fuel, maintenance, owner payout statements, or administrative costs</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Expense Date <span className="text-rose-500">*</span></label>
              <input
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Category <span className="text-rose-500">*</span></label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-semibold"
              >
                <option value="fuel">Fuel / Petrol / Diesel</option>
                <option value="maintenance">Routine Vehicle Service</option>
                <option value="repair">Emergency Vehicle Repair</option>
                <option value="driver_allowance">Driver Allowance / Food</option>
                <option value="accommodation">Accommodation / Hotel</option>
                <option value="toll_parking">Highway Toll / Parking</option>
                <option value="office">Office Supplies / Admin</option>
                <option value="marketing">Marketing / Advertising</option>
                <option value="utilities">Utilities / Telecom</option>
                <option value="insurance">Insurance / Licensing</option>
                <option value="owner_statement">Owner Statement (Voucher)</option>
                <option value="other">Other Expense</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                Amount (LKR) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 15000"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-sm text-slate-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-semibold"
              >
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="card">Company Card</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Description / Particulars <span className="text-rose-500">*</span></label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Diesel fuel refill for Toyota KDH WP-6542 or Monthly Owner Payout"
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Supplier / Payee</label>
              <input
                type="text"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                placeholder="e.g. Ceypetco Filling Station or Vehicle Owner"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Bill / Receipt Ref</label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="e.g. REC-8877"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Toggle for Structured Voucher Details */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setIsVoucherMode(!isVoucherMode)}
              className="w-full p-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/20 text-amber-600 dark:text-amber-400 font-bold flex items-center justify-between cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2">
                <FileText size={16} />
                <span>Detailed Payment Voucher & Banking Breakdown</span>
              </div>
              {isVoucherMode ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>

          {/* Expanded Voucher Breakdown Section */}
          {isVoucherMode && (
            <div className="p-4 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-2xl space-y-4 animate-in fade-in duration-200">
              <h3 className="font-bold text-slate-800 dark:text-slate-200 text-xs border-b border-slate-200 dark:border-slate-700 pb-2">
                Structured Voucher & Owner Statement Details
              </h3>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Voucher No</label>
                  <input
                    type="text"
                    value={voucherNumber}
                    onChange={(e) => setVoucherNumber(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Bill Name</label>
                  <input
                    type="text"
                    value={billName}
                    onChange={(e) => setBillName(e.target.value)}
                    placeholder="e.g. Owner Statement Settlement"
                    className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Customer / Payee</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. K. A. Perera"
                    className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>
              </div>

              {/* Bank Account Info */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="Commercial Bank"
                    className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Branch Name</label>
                  <input
                    type="text"
                    value={branchName}
                    onChange={(e) => setBranchName(e.target.value)}
                    placeholder="Kohuwala Branch"
                    className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Account Number</label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="8004556100"
                    className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-bold"
                  />
                </div>
              </div>

              {/* Add Payments (+ Line Items) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">Add Payments / Earnings (+)</span>
                  <button
                    type="button"
                    onClick={handleAddAddition}
                    className="text-[10px] font-bold px-2 py-1 bg-emerald-500/10 text-emerald-600 rounded-lg hover:bg-emerald-500/20 cursor-pointer"
                  >
                    + Add Item
                  </button>
                </div>
                {additions.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Item Description (e.g. Base Hire Rate)"
                      value={item.description}
                      onChange={(e) => handleUpdateAddition(idx, 'description', e.target.value)}
                      className="flex-1 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                    />
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Amount"
                      value={item.amount || ''}
                      onChange={(e) => handleUpdateAddition(idx, 'amount', Number(e.target.value))}
                      className="w-28 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-right"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveAddition(idx)}
                      className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Deductions (- Line Items) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400">Deductions (-)</span>
                  <button
                    type="button"
                    onClick={handleAddDeduction}
                    className="text-[10px] font-bold px-2 py-1 bg-rose-500/10 text-rose-600 rounded-lg hover:bg-rose-500/20 cursor-pointer"
                  >
                    + Add Deduction
                  </button>
                </div>
                {deductions.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Deduction Description (e.g. Repair Deduction)"
                      value={item.description}
                      onChange={(e) => handleUpdateDeduction(idx, 'description', e.target.value)}
                      className="flex-1 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                    />
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Amount"
                      value={item.amount || ''}
                      onChange={(e) => handleUpdateDeduction(idx, 'amount', Number(e.target.value))}
                      className="w-28 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-right text-rose-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveDeduction(idx)}
                      className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Remarks & Signatures */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Remarks</label>
                  <textarea
                    rows={2}
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                    placeholder="General remarks or notes"
                    className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Special Notice</label>
                  <textarea
                    rows={2}
                    value={specialNotice}
                    onChange={(e) => setSpecialNotice(e.target.value)}
                    placeholder="Special terms or notice to beneficiary"
                    className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-rose-500 font-medium"
                  />
                </div>
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 dark:text-slate-300 text-xs">
                  <input
                    type="checkbox"
                    checked={isAuthorized}
                    onChange={(e) => setIsAuthorized(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Authorize & Approve Voucher (Disbursement Authorized)</span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Prepared By</label>
                  <input
                    type="text"
                    value={preparedBy}
                    onChange={(e) => setPreparedBy(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Approved By</label>
                  <input
                    type="text"
                    disabled={!isAuthorized}
                    value={isAuthorized ? approvedBy : 'Pending Approval'}
                    onChange={(e) => setApprovedBy(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs disabled:opacity-60 disabled:bg-slate-100 dark:disabled:bg-slate-800"
                  />
                </div>
              </div>
            </div>
          )}

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
              className="px-5 py-2 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl text-xs shadow-xs transition-all cursor-pointer"
            >
              {loading ? 'Saving...' : 'Record Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
