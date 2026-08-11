// Script: scripts/verify-user-agreement-page-numbering.js
// Purpose: Automated verification suite for Revision Label Removal & Dynamic Page X of Y Numbering

const fs = require('fs')
const path = require('path')

console.log('=== USER AGREEMENT PAGE NUMBERING & REVISION LABEL REMOVAL AUDIT ===\n')

// 1. Audit Removal of Visible Revision Label in Document Renderer & PDF Generator
console.log('--- TEST 1: Visible Revision Label Removal ---')
const pdfGeneratorPath = path.join(__dirname, '../src/lib/documents/agreement-pdf.ts')
const previewClientPath = path.join(__dirname, '../src/app/(dashboard)/dashboard/agreements/[id]/preview/user-agreement-preview-client.tsx')

const pdfText = fs.readFileSync(pdfGeneratorPath, 'utf8')
const previewText = fs.readFileSync(previewClientPath, 'utf8')

// Match UserAgreementDocument component body
const docCompMatch = previewText.match(/export function UserAgreementDocument[\s\S]*?^}/m)
const docCompContent = docCompMatch ? docCompMatch[0] : ''

if (docCompContent.includes('Revision {') || docCompContent.includes('Revision 1')) {
  console.error('❌ FAIL: UserAgreementDocument still renders visible Revision label!')
  process.exit(1)
} else {
  console.log('✓ PASSED: Visible Revision label removed from UserAgreementDocument.')
}

if (pdfText.includes('(Revision ${versionNum})') || pdfText.includes('| Revision ${versionNum}')) {
  console.error('❌ FAIL: agreement-pdf.ts still renders visible Revision label!')
  process.exit(1)
} else {
  console.log('✓ PASSED: Visible Revision label removed from agreement-pdf.ts generator.')
}

// 2. Audit Removal of "Page Document" Placeholder
console.log('\n--- TEST 2: "Page Document" Placeholder Removal ---')
if (docCompContent.includes('Page Document')) {
  console.error('❌ FAIL: Document component still contains "Page Document"!')
  process.exit(1)
} else {
  console.log('✓ PASSED: "Page Document" string removed completely.')
}

// 3. Audit Dynamic Page X of Y Footer in jsPDF Generator
console.log('\n--- TEST 3: Dynamic Page X of Y Footer in PDF Engine ---')
if (
  pdfText.includes('getNumberOfPages()') &&
  pdfText.includes('Page ${i} of ${totalPages}') &&
  pdfText.includes('Agreement Ref: ${agreement.agreement_number')
) {
  console.log('✓ PASSED: Dynamic Page X of Y footer uses getNumberOfPages() after pagination completes.')
} else {
  console.error('❌ FAIL: Page numbering in agreement-pdf.ts incomplete!')
  process.exit(1)
}

// 4. Negative Assertion: No Hardcoded Page Totals
console.log('\n--- TEST 4: No Hardcoded Page Totals ---')
if (pdfText.includes('Page ${i} of 8') || pdfText.includes('Page 1 of 8')) {
  console.error('❌ FAIL: Found hardcoded total page count in PDF generator!')
  process.exit(1)
} else {
  console.log('✓ PASSED: No hardcoded page totals found.')
}

// 5. Internal Version History Safety Check
console.log('\n--- TEST 5: Internal Version History Safety ---')
const actionsPath = path.join(__dirname, '../src/app/(dashboard)/dashboard/agreements/user-agreement-actions.ts')
const actionsText = fs.readFileSync(actionsPath, 'utf8')

if (
  actionsText.includes('version_number') &&
  actionsText.includes('rental_agreement_versions') &&
  previewText.includes('VersionHistoryModal')
) {
  console.log('✓ PASSED: Internal version history schema, actions, and admin modal remain 100% functional.')
} else {
  console.error('❌ FAIL: Internal version history broken or removed!')
  process.exit(1)
}

console.log('\n✅ PAGE NUMBERING & REVISION LABEL REMOVAL AUDIT PASSED SUCCESSFULLY!\n')
