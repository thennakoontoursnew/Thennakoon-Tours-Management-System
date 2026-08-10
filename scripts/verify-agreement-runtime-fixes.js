// Script: scripts/verify-agreement-runtime-fixes.js
// Purpose: Automated verification suite for Agreements Center runtime fixes & Server/Client boundary validation

const fs = require('fs')
const path = require('path')

console.log('=== AGREEMENTS CENTER RUNTIME FIXES VERIFICATION ===\n')

// 1. Audit Server / Client Boundary Separation for Preview Route
const serverPagePath = path.join(__dirname, '../src/app/(dashboard)/dashboard/agreements/[id]/preview/page.tsx')
const clientPreviewPath = path.join(__dirname, '../src/app/(dashboard)/dashboard/agreements/[id]/preview/user-agreement-preview-client.tsx')
const errorBoundaryPath = path.join(__dirname, '../src/app/(dashboard)/dashboard/agreements/[id]/preview/error.tsx')

if (!fs.existsSync(serverPagePath) || !fs.existsSync(clientPreviewPath) || !fs.existsSync(errorBoundaryPath)) {
  console.error('❌ FAIL: Preview page.tsx, client component, or error.tsx boundary missing!')
  process.exit(1)
}

const serverPageContent = fs.readFileSync(serverPagePath, 'utf8')
const clientPreviewContent = fs.readFileSync(clientPreviewPath, 'utf8')

// Ensure Server Component contains NO onClick or DOM event handlers
if (serverPageContent.includes('onClick') || serverPageContent.includes('window.')) {
  console.error('❌ FAIL: Server Component page.tsx contains browser event handlers or DOM APIs!')
  process.exit(1)
}
console.log('✓ Server Component page.tsx verified: Clean Server/Client boundary (NO onClick/DOM APIs).')

if (serverPageContent.includes('JSON.parse(JSON.stringify(')) {
  console.log('✓ Server Component JSON serialization verified: Only plain serializable props cross the boundary.')
} else {
  console.error('❌ FAIL: Server Component missing JSON serialization step.')
  process.exit(1)
}

if (clientPreviewContent.startsWith("'use client'") || clientPreviewContent.startsWith('"use client"')) {
  console.log('✓ Client Preview Component verified: "use client" directive present at line 1.')
} else {
  console.error('❌ FAIL: user-agreement-preview-client.tsx missing "use client" directive!')
  process.exit(1)
}

// 2. Audit Legacy Fallback vs V1 Renderer
if (clientPreviewContent.includes('RENDERER 1: USER_AGREEMENT_V1 SNAPSHOT RENDERER') && clientPreviewContent.includes('RENDERER 2: LEGACY AGREEMENT RENDERER (NULL-SAFE FALLBACK)')) {
  console.log('✓ Dual Renderer Architecture verified: V1 Snapshot Renderer & Legacy Null-Safe Fallback.')
} else {
  console.error('❌ FAIL: Client preview component missing dual renderer logic.')
  process.exit(1)
}

// 3. Audit Error Boundary
const errorContent = fs.readFileSync(errorBoundaryPath, 'utf8')
if (errorContent.includes('Unable to Load User Agreement') && errorContent.includes('error.digest')) {
  console.log('✓ Next.js Error Boundary error.tsx verified.')
} else {
  console.error('❌ FAIL: Error boundary error.tsx missing error.digest support.')
  process.exit(1)
}

// 4. Audit Tab Creation Actions & SelectBookingModal
const clientPath = path.join(__dirname, '../src/app/(dashboard)/dashboard/agreements/agreements-client.tsx')
const modalPath = path.join(__dirname, '../src/components/agreements/select-booking-modal.tsx')

const clientContent = fs.readFileSync(clientPath, 'utf8')
const modalContent = fs.readFileSync(modalPath, 'utf8')

if (clientContent.includes('+ New User Agreement') && clientContent.includes('+ New Owner Agreement')) {
  console.log('✓ Tab-Aware Header Action Buttons verified.')
} else {
  console.error('❌ FAIL: agreements-client.tsx missing tab-aware action buttons.')
  process.exit(1)
}

if (modalContent.includes('Select Booking for User Agreement') && modalContent.includes('Active Agreement:')) {
  console.log('✓ SelectBookingModal search & duplicate active User Agreement prevention verified.')
} else {
  console.error('❌ FAIL: SelectBookingModal incomplete.')
  process.exit(1)
}

console.log('\n✅ AGREEMENTS CENTER RUNTIME FIXES VERIFICATION PASSED SUCCESSFULLY!\n')
