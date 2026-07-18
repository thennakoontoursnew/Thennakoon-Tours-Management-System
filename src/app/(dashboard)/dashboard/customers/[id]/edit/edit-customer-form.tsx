'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { updateCustomer, archiveCustomer } from '../../customer-actions'
import { ArrowLeft, Save, AlertCircle, Archive } from 'lucide-react'

interface Props {
  customer: any
}

export default function EditCustomerForm({ customer }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    customer_type: customer.customer_type || 'individual',
    full_name: customer.full_name || '',
    company_name: customer.company_name || '',
    nic: customer.nic || '',
    passport_number: customer.passport_number || '',
    nationality: customer.nationality || '',
    date_of_birth: customer.date_of_birth || '',
    gender: customer.gender || '',
    mobile: customer.mobile || '',
    whatsapp: customer.whatsapp || '',
    email: customer.email || '',
    address_line_1: customer.address_line_1 || '',
    address_line_2: customer.address_line_2 || '',
    city: customer.city || '',
    country: customer.country || 'Sri Lanka',
    driving_license_number: customer.driving_license_number || '',
    driving_license_expiry: customer.driving_license_expiry || '',
    source: customer.source || 'walk_in',
    status: customer.status || 'active',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await updateCustomer(customer.id, formData as any)
    if (!res.success) {
      setError(res.error || 'Failed to update customer.')
      setLoading(false)
      return
    }

    router.push(`/dashboard/customers/${customer.id}`)
  }

  const handleArchive = async () => {
    if (!confirm('Are you sure you want to archive this customer record?')) return
    const res = await archiveCustomer(customer.id)
    if (res.success) router.push('/dashboard/customers')
    else alert(res.error)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={`/dashboard/customers/${customer.id}`}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Edit Customer ({customer.customer_code})</h1>
            <p className="text-xs text-slate-500">Update contact, identity, or status information.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleArchive}
          className="px-3 py-2 rounded-xl border border-rose-500/20 text-rose-500 text-xs font-semibold hover:bg-rose-500/10 transition-colors flex items-center gap-1.5"
        >
          <Archive size={15} />
          <span>Archive Customer</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-6">
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-500 border-b border-slate-100 dark:border-slate-800 pb-2">
            1. Classification & Status
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Customer Type *</label>
              <select
                name="customer_type"
                value={formData.customer_type}
                onChange={handleChange}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
              >
                <option value="individual">Individual</option>
                <option value="company">Corporate Company</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Full Name *</label>
              <input
                type="text"
                name="full_name"
                required
                value={formData.full_name}
                onChange={handleChange}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Account Status *</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="blacklisted">Blacklisted</option>
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-500 border-b border-slate-100 dark:border-slate-800 pb-2">
            2. Contact & Identity Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Mobile Phone *</label>
              <input
                type="text"
                name="mobile"
                required
                value={formData.mobile}
                onChange={handleChange}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">WhatsApp</label>
              <input
                type="text"
                name="whatsapp"
                value={formData.whatsapp}
                onChange={handleChange}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">NIC Number</label>
              <input
                type="text"
                name="nic"
                value={formData.nic}
                onChange={handleChange}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Passport Number</label>
              <input
                type="text"
                name="passport_number"
                value={formData.passport_number}
                onChange={handleChange}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Driving License Number</label>
              <input
                type="text"
                name="driving_license_number"
                value={formData.driving_license_number}
                onChange={handleChange}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
          <Link
            href={`/dashboard/customers/${customer.id}`}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-amber-400 text-slate-950 text-xs font-bold hover:bg-amber-300 transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            <Save size={16} />
            <span>{loading ? 'Saving...' : 'Update Customer'}</span>
          </button>
        </div>
      </form>
    </div>
  )
}
