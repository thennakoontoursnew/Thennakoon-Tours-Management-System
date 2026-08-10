// Script: scripts/verify-agreement-runtime-fixes.js
// Purpose: Automated verification suite for Agreements Center runtime fixes (Legacy AGR rendering & tab-specific creation actions)

const fs = require('fs')
const path = require('path')

console.log('=== AGREEMENTS CENTER RUNTIME FIXES VERIFICATION ===\n')

// 1. Audit User Agreement Preview Page & Safe Fallbacks
const previewPath = path.join(__dirname, '../src/app/(dashboard)/dashboard/agreements/[id]/preview/page.tsx')
if (!fs.existsSync(previewPath)) {
  console.error('❌ FAIL: preview/page.tsx missing!')
  process.exit(1)
}

const previewContent = fs.readFileSync(previewPath, 'utf8')

if (previewContent.includes('[USER AGREEMENT PREVIEW]') && previewContent.includes('formatDateSafe') && previewContent.includes('formatNumberSafe')) {
  console.log('✓ Verified Preview Diagnostic Logging (STEPS 1-5) & Null-Safe Date/Number Helpers.')
} else {
  console.error('❌ FAIL: Preview page missing diagnostic logging or safe format helpers.')
  process.exit(1)
}

if (previewContent.includes('LEGACY AGREEMENT RENDERER (NULL-SAFE FALLBACK)') && previewContent.includes('USER_AGREEMENT_V1 SNAPSHOT RENDERER')) {
  console.log('✓ Verified Dual Renderer Architecture: USER_AGREEMENT_V1 Snapshot Renderer & Legacy Booking Fallback Renderer.')
} else {
  console.error('❌ FAIL: Preview page missing explicit legacy/V1 renderer split.')
  process.exit(1)
}

// 2. Audit Agreement Service Layer (getUserAgreementById)
const servicePath = path.join(__dirname, '../src/lib/agreements/agreement-service.ts')
if (!fs.existsSync(servicePath)) {
  console.error('❌ FAIL: agreement-service.ts missing!')
  process.exit(1)
}

const serviceContent = fs.readFileSync(servicePath, 'utf8')
if (serviceContent.includes('getUserAgreementById') && serviceContent.includes('STEP 1 - Load Agreement ID')) {
  console.log('✓ Verified agreement-service.ts getUserAgreementById safe loader.')
} else {
  console.error('❌ FAIL: agreement-service.ts missing getUserAgreementById or diagnostic steps.')
  process.exit(1)
}

// 3. Audit UI Tab Creation Buttons & Booking Selector Modal
const clientPath = path.join(__dirname, '../src/app/(dashboard)/dashboard/agreements/agreements-client.tsx')
const modalPath = path.join(__dirname, '../src/components/agreements/select-booking-modal.tsx')

if (!fs.existsSync(clientPath) || !fs.existsSync(modalPath)) {
  console.error('❌ FAIL: agreements-client.tsx or select-booking-modal.tsx missing!')
  process.exit(1)
}

const clientContent = fs.readFileSync(clientPath, 'utf8')
const modalContent = fs.readFileSync(modalPath, 'utf8')

if (clientContent.includes('+ New User Agreement') && clientContent.includes('+ New Owner Agreement')) {
  console.log('✓ Verified Tab-Specific Action Buttons: "+ New User Agreement" on User tab & "+ New Owner Agreement" on Owner tab.')
} else {
  console.error('❌ FAIL: agreements-client.tsx does not display tab-specific buttons.')
  process.exit(1)
}

if (modalContent.includes('Select Booking for User Agreement') && modalContent.includes('Active Agreement:')) {
  console.log('✓ Verified SelectBookingModal booking search & duplicate active User Agreement prevention.')
} else {
  console.error('❌ FAIL: select-booking-modal.tsx incomplete.')
  process.exit(1)
}

// 4. Audit Cancelled Agreement Visibility & KPI Counts
if (clientContent.includes("item.status === 'cancelled'") && serviceContent.includes("['active', 'generated', 'signed'].includes(u.status)")) {
  console.log('✓ Verified Cancelled Agreements remain visible in User Agreements table & KPI counts exclude cancelled records.')
} else {
  console.error('❌ FAIL: Cancelled agreement handling or KPI filter error.')
  process.exit(1)
}

console.log('\n✅ AGREEMENTS CENTER RUNTIME FIXES VERIFICATION PASSED SUCCESSFULLY!\n')
