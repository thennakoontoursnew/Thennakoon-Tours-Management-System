'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DriverProfileTabs } from '@/components/drivers/driver-profile-tabs'
import { DriverLeaveModal } from '@/components/drivers/driver-leave-modal'
import { addDriverLeaveAction } from './driver-actions'

interface DriverProfileClientWrapperProps {
  driver: any
  profileData: any
  userRole: string
}

export function DriverProfileClientWrapper({
  driver,
  profileData,
  userRole,
}: DriverProfileClientWrapperProps) {
  const router = useRouter()
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false)

  return (
    <>
      <DriverProfileTabs
        driver={driver}
        assignments={profileData.assignments}
        currentBooking={profileData.currentBooking}
        nextBooking={profileData.nextBooking}
        documents={profileData.documents}
        leaves={profileData.leaves}
        incidents={profileData.incidents}
        notes={profileData.notes}
        stats={profileData.stats}
        userRole={userRole}
        onOpenLeaveModal={() => setIsLeaveModalOpen(true)}
        onOpenNoteModal={() => {}}
      />

      <DriverLeaveModal
        isOpen={isLeaveModalOpen}
        driverId={driver.id}
        onClose={() => setIsLeaveModalOpen(false)}
        onSubmit={async (leaveData) => {
          await addDriverLeaveAction(driver.id, leaveData)
          router.refresh()
        }}
      />
    </>
  )
}
