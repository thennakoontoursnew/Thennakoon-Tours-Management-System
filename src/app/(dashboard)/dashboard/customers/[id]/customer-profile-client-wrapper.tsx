'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CustomerProfileTabs } from '@/components/crm/customer-profile-tabs'
import { CustomerNoteModal } from '@/components/crm/customer-note-modal'
import { CustomerDocumentModal } from '@/components/crm/customer-document-modal'
import { addCustomerNoteAction, addCustomerDocumentAction } from './crm-actions'

interface CustomerProfileClientWrapperProps {
  customer: any
  profileData: any
  userRole: string
}

export function CustomerProfileClientWrapper({
  customer,
  profileData,
  userRole,
}: CustomerProfileClientWrapperProps) {
  const router = useRouter()
  const [modalType, setModalType] = useState<'note' | 'document' | null>(null)

  return (
    <>
      <CustomerProfileTabs
        customer={customer}
        quotations={profileData.quotations}
        bookings={profileData.bookings}
        agreements={profileData.agreements}
        invoices={profileData.invoices}
        payments={profileData.payments}
        documents={profileData.documents}
        notes={profileData.notes}
        leads={profileData.leads}
        financials={profileData.financials}
        stats={profileData.stats}
        userRole={userRole}
        onOpenNoteModal={() => setModalType('note')}
        onOpenDocumentModal={() => setModalType('document')}
      />

      <CustomerNoteModal
        isOpen={modalType === 'note'}
        customerId={customer.id}
        onClose={() => setModalType(null)}
        onSubmit={async ({ note, note_type, is_important }) => {
          await addCustomerNoteAction(customer.id, note, note_type, is_important)
          router.refresh()
        }}
      />

      <CustomerDocumentModal
        isOpen={modalType === 'document'}
        customerId={customer.id}
        onClose={() => setModalType(null)}
        onSubmit={async (docData) => {
          await addCustomerDocumentAction(customer.id, docData)
          router.refresh()
        }}
      />
    </>
  )
}
