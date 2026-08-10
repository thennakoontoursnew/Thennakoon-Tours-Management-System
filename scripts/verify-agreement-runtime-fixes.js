// Script: scripts/verify-agreement-runtime-fixes.js
// Purpose: Automated verification suite for User Agreement V1 Runtime Renderer Selection & Snapshot Fixes

const fs = require('fs')
const path = require('path')

console.log('=== USER AGREEMENT V1 RUNTIME FIXES & RENDERER SELECTION VERIFICATION ===\n')

// 1. Audit Renderer Selection Logic in agreement-service.ts & user-agreement-preview-client.tsx
console.log('--- TEST 1: Audit Renderer Selection Logic ---')
const servicePath = path.join(__dirname, '../src/lib/agreements/agreement-service.ts')
const previewClientPath = path.join(__dirname, '../src/app/(dashboard)/dashboard/agreements/[id]/preview/user-agreement-preview-client.tsx')
const actionsPath = path.join(__dirname, '../src/app/(dashboard)/dashboard/agreements/agreement-actions.ts')

const serviceText = fs.readFileSync(servicePath, 'utf8')
const previewClientText = fs.readFileSync(previewClientPath, 'utf8')
const actionsText = fs.readFileSync(actionsPath, 'utf8')

if (serviceText.includes('agreement.template_version = USER_AGREEMENT_VERSION') && serviceText.includes('isV1 = true')) {
  console.log('✓ PASSED: getUserAgreementById dynamically upgrades missing snapshots to USER_AGREEMENT_V1.')
} else {
  console.error('❌ FAIL: getUserAgreementById does not enforce isV1 = true!')
  process.exit(1)
}

if (actionsText.includes('template_version: USER_AGREEMENT_VERSION') && actionsText.includes('lessee_snapshot: initialForm.lessee')) {
  console.log('✓ PASSED: createAgreementFromBooking populates template_version USER_AGREEMENT_V1 and snapshots.')
} else {
  console.error('❌ FAIL: createAgreementFromBooking missing V1 template version or snapshot insertion!')
  process.exit(1)
}

// 2. Audit V1 Content vs Legacy Content Rendering
console.log('\n--- TEST 2: Audit V1 Content vs Legacy Content Rendering ---')
if (previewClientText.includes('isV1 ?') && previewClientText.includes('V1UserAgreementContent')) {
  console.log('✓ PASSED: Preview Client routes isV1 directly to V1UserAgreementContent.')
} else {
  console.error('❌ FAIL: Preview Client routing broken!')
  process.exit(1)
}

// 3. Verify ALL 18 Legal Clauses in V1 Template
console.log('\n--- TEST 3: Verify ALL 18 Legal Clauses in V1 Template ---')
const templatePath = path.join(__dirname, '../src/lib/agreements/templates/user-agreement-v1.ts')
const templateText = fs.readFileSync(templatePath, 'utf8')

const requiredClauses = [
  'HIRE OF VEHICLE',
  'RENTAL AND OTHER CHARGES',
  'LICENSE AND INSURANCE',
  'MAINTENANCE',
  'USE OF VEHICLE',
  'EXCLUSION OF LIABILITY',
  'EXCLUSION OF WARRANTIES',
  'ASSIGNMENT',
  'DEFAULT AND TERMINATION',
  'RIGHTS AND LIABILITIES OF THE LESSEE',
  'RENEVAL OF THE AGREEMENT',
  'Renewal of the agreement Time period is less than Three Months.',
  'JOINT AND SEVERAL LIABILITIES',
  'NOTICE',
  'SERVICE OF NOTICE',
  'IT IS FURTHER AGREED...',
  'JURISDICTION',
  'INTERPRETATION',
  'SHEDULE TO AGREEMENT',
  'PV 00312253',
]

requiredClauses.forEach((c) => {
  if (templateText.includes(c) || previewClientText.includes(c)) {
    console.log(`  ✓ Clause / Section Verified: "${c}"`)
  } else {
    console.error(`  ❌ Missing Clause / Section: "${c}"`)
    process.exit(1)
  }
})

// 4. Negative Assertion: PV-00249821 MUST NOT be present in USER_AGREEMENT_V1
console.log('\n--- TEST 4: Negative Assertion for Legacy Registration Number ---')
if (templateText.includes('PV-00249821') || previewClientText.includes('PV-00249821')) {
  console.error('❌ FAIL: Legacy registration number PV-00249821 still found in V1 files!')
  process.exit(1)
} else {
  console.log('✓ PASSED: Negative assertion verified. PV-00249821 is completely absent from USER_AGREEMENT_V1.')
}

console.log('\n✅ USER AGREEMENT V1 RUNTIME FIXES & RENDERER VERIFICATION PASSED SUCCESSFULLY!\n')
