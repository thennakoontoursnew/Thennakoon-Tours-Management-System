'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { VehicleProfileTabs } from '@/components/fleet/vehicle-profile-tabs'
import { VehicleOdometerModal } from '@/components/fleet/vehicle-odometer-modal'
import { VehicleDocumentModal } from '@/components/fleet/vehicle-document-modal'
import { logOdometerAction, addVehicleDocumentAction } from './fleet-actions'

interface VehicleProfileClientWrapperProps {
  vehicle: any
  profileData: any
  userRole: string
  userId?: string
}

export function VehicleProfileClientWrapper({
  vehicle,
  profileData,
  userRole,
  userId,
}: VehicleProfileClientWrapperProps) {
  const router = useRouter()
  const [modalType, setModalType] = useState<'odometer' | 'document' | null>(null)

  const isOwner = userRole === 'owner'

  return (
    <>
      <VehicleProfileTabs
        vehicle={vehicle}
        allocations={profileData.allocations}
        currentBooking={profileData.currentBooking}
        nextBooking={profileData.nextBooking}
        odometerLogs={profileData.odometerLogs}
        documents={profileData.documents}
        photos={profileData.photos}
        maintenance={profileData.maintenance}
        returnChecks={profileData.returnChecks}
        financials={profileData.financials}
        userRole={userRole}
        onOpenOdometerModal={() => setModalType('odometer')}
        onOpenDocumentModal={() => setModalType('document')}
      />

      <VehicleOdometerModal
        isOpen={modalType === 'odometer'}
        vehicleId={vehicle.id}
        currentOdometer={Number(vehicle.current_mileage || 0)}
        isOwner={isOwner}
        onClose={() => setModalType(null)}
        onSubmit={async (newOdometer, sourceType, notes, isOwnerOverride) => {
          await logOdometerAction(vehicle.id, newOdometer, sourceType, notes, isOwnerOverride)
          router.refresh()
        }}
      />

      <VehicleDocumentModal
        isOpen={modalType === 'document'}
        vehicleId={vehicle.id}
        onClose={() => setModalType(null)}
        onSubmit={async (docData) => {
          await addVehicleDocumentAction(docData)
          router.refresh()
        }}
      />
    </>
  )
}
