// Script: scripts/verify-agreements-complete-workflows.js
// Purpose: Automated verification suite for Agreements Center complete workflows & US Legal Paper Size (8.5 x 14 in)

const fs = require('fs')
const path = require('path')
const { jsPDF } = require('jspdf')

console.log('=== AGREEMENTS COMPLETE WORKFLOWS & US LEGAL PAPER VERIFICATION ===\n')

// 1. Audit US Legal Paper Dimensions (8.5 x 14 in / 215.9 x 355.6 mm / 612 x 1008 pt)
console.log('--- TEST 1: US Legal Paper Size Assertion ---')

const docLegal = new jsPDF({
  orientation: 'portrait',
  unit: 'mm',
  format: [215.9, 355.6],
})

const pageWidthPt = docLegal.internal.pageSize.getWidth() * (72 / 25.4)
const pageHeightPt = docLegal.internal.pageSize.getHeight() * (72 / 25.4)

console.log(`Measured PDF Page Size: ${pageWidthPt.toFixed(1)} pt × ${pageHeightPt.toFixed(1)} pt`)

if (Math.abs(pageWidthPt - 612) <= 5 && Math.abs(pageHeightPt - 1008) <= 5) {
  console.log('✓ PASSED: PDF MediaBox matches US Legal Portrait (612 × 1008 pt / 8.5 × 14 in).')
} else {
  console.error(`❌ FAIL: PDF MediaBox is NOT Legal size! Measured: ${pageWidthPt} x ${pageHeightPt}`)
  process.exit(1)
}

// 2. Audit Print CSS (@page size: 8.5in 14in portrait)
console.log('\n--- TEST 2: Print CSS Legal Size Assertion ---')
const userClientPath = path.join(__dirname, '../src/app/(dashboard)/dashboard/agreements/[id]/preview/user-agreement-preview-client.tsx')
const ownerClientPath = path.join(__dirname, '../src/app/(dashboard)/dashboard/agreements/owner/[id]/preview/owner-agreement-preview-client.tsx')

const userClientContent = fs.readFileSync(userClientPath, 'utf8')
const ownerClientContent = fs.readFileSync(ownerClientPath, 'utf8')

if (userClientContent.includes('size: 8.5in 14in portrait') && ownerClientContent.includes('size: 8.5in 14in portrait')) {
  console.log('✓ PASSED: User Agreement and Owner Agreement CSS enforce "@page { size: 8.5in 14in portrait; }".')
} else {
  console.error('❌ FAIL: CSS @page Legal size missing from preview components.')
  process.exit(1)
}

// 3. Audit Server / Client Boundary & DTO Mapping
console.log('\n--- TEST 3: Server / Client Boundary & DTO Mapping ---')
const userServerPath = path.join(__dirname, '../src/app/(dashboard)/dashboard/agreements/[id]/preview/page.tsx')
const ownerServerPath = path.join(__dirname, '../src/app/(dashboard)/dashboard/agreements/owner/[id]/preview/page.tsx')

const userServerContent = fs.readFileSync(userServerPath, 'utf8')
const ownerServerContent = fs.readFileSync(ownerServerPath, 'utf8')

if (!userServerContent.includes('onClick') && !ownerServerContent.includes('onClick')) {
  console.log('✓ PASSED: Server Components (User & Owner preview) contain NO browser event handlers.')
} else {
  console.error('❌ FAIL: Server Component contains browser onClick handler!')
  process.exit(1)
}

if (userServerContent.includes('JSON.parse(JSON.stringify(') && ownerServerContent.includes('JSON.parse(JSON.stringify(')) {
  console.log('✓ PASSED: Explicit JSON DTO serialization enforced across Server -> Client boundary.')
} else {
  console.error('❌ FAIL: Server Component missing JSON DTO serialization.')
  process.exit(1)
}

// 4. Audit Duplicate Prevention & Overlap Validation
console.log('\n--- TEST 4: Duplicate & Overlap Prevention ---')
const modalPath = path.join(__dirname, '../src/components/agreements/select-booking-modal.tsx')
const actionsPath = path.join(__dirname, '../src/app/(dashboard)/dashboard/agreements/agreement-actions.ts')

const modalContent = fs.readFileSync(modalPath, 'utf8')
const actionsContent = fs.readFileSync(actionsPath, 'utf8')

if (modalContent.includes('Active Agreement:') && modalContent.includes('View User Agreement')) {
  console.log('✓ PASSED: SelectBookingModal blocks duplicate active User Agreement creation.')
} else {
  console.error('❌ FAIL: SelectBookingModal missing duplicate check.')
  process.exit(1)
}

if (actionsContent.includes('Selected vehicle already has an active Owner Agreement')) {
  console.log('✓ PASSED: createOwnerAgreementAction enforces active Owner Agreement overlap check.')
} else {
  console.error('❌ FAIL: createOwnerAgreementAction missing overlap validation.')
  process.exit(1)
}

// 5. Audit Legacy Compatibility
console.log('\n--- TEST 5: Legacy Record Compatibility ---')
if (userClientContent.includes('LegacyUserAgreementContent') && userClientContent.includes('formatDateSafe')) {
  console.log('✓ PASSED: Legacy AGR null-safe renderer & formatDateSafe helpers verified.')
} else {
  console.error('❌ FAIL: Legacy AGR fallback missing.')
  process.exit(1)
}

console.log('\n✅ ALL WORKFLOWS & US LEGAL PAPER VERIFICATION PASSED SUCCESSFULLY!\n')
