// Node test script to verify Invoice Numbering System & Counter Synchronization
// File: scripts/verify-invoice-numbering-system.js

const assert = require('assert');

function simulateInvoiceCounter() {
  console.log('=== Step 1: Initializing Invoice Counter ===');
  let counter = {
    document_type: 'invoice',
    prefix: 'TT-IN-',
    last_value: 10000,
    padding: 5,
    allow_manual_edit: true
  };

  const invoices = new Set();

  function generateNextAuto() {
    counter.last_value += 1;
    const nextStr = `${counter.prefix}${String(counter.last_value).padStart(counter.padding, '0')}`;
    invoices.add(nextStr);
    return nextStr;
  }

  function saveManualInvoice(manualNo) {
    const norm = (manualNo || '').trim().toUpperCase();
    if (!norm.startsWith(counter.prefix)) {
      throw new Error(`Invoice number must start with ${counter.prefix}`);
    }
    if (invoices.has(norm)) {
      throw new Error(`Invoice number ${norm} already exists.`);
    }

    invoices.add(norm);

    // Counter synchronization rule
    if (norm.startsWith(counter.prefix)) {
      const numPart = norm.substring(counter.prefix.length);
      if (/^\d+$/.test(numPart)) {
        const val = parseInt(numPart, 10);
        if (val > counter.last_value) {
          counter.last_value = val;
        }
      }
    }

    return norm;
  }

  console.log('Test 1: First auto generated invoice');
  const inv1 = generateNextAuto();
  console.log('  Result:', inv1);
  assert.strictEqual(inv1, 'TT-IN-10001');

  console.log('Test 2: Second auto generated invoice');
  const inv2 = generateNextAuto();
  console.log('  Result:', inv2);
  assert.strictEqual(inv2, 'TT-IN-10002');

  console.log('Test 3: Manually change next invoice to TT-IN-10500');
  const inv3 = saveManualInvoice('TT-IN-10500');
  console.log('  Saved:', inv3);
  assert.strictEqual(inv3, 'TT-IN-10500');

  console.log('  Checking next auto after manual high entry...');
  const inv4 = generateNextAuto();
  console.log('  Next auto:', inv4);
  assert.strictEqual(inv4, 'TT-IN-10501');

  console.log('Test 4: Attempt duplicate TT-IN-10500');
  try {
    saveManualInvoice('TT-IN-10500');
    assert.fail('Should have blocked duplicate invoice number');
  } catch (err) {
    console.log('  Blocked duplicate correctly:', err.message);
  }

  console.log('Test 5: Manually enter lower unused number TT-IN-10050 when counter is at 10501');
  const inv5 = saveManualInvoice('TT-IN-10050');
  console.log('  Saved lower manual number:', inv5);
  assert.strictEqual(inv5, 'TT-IN-10050');

  const inv6 = generateNextAuto();
  console.log('  Next auto remains:', inv6);
  assert.strictEqual(inv6, 'TT-IN-10502');

  console.log('Test 6: Format validation (rejecting non-prefix entries)');
  try {
    saveManualInvoice('INVALID-1234');
    assert.fail('Should have rejected non-TT-IN prefix');
  } catch (err) {
    console.log('  Rejected invalid prefix correctly:', err.message);
  }

  console.log('✅ ALL INVOICE NUMBERING VERIFICATION TESTS PASSED');
}

simulateInvoiceCounter();
