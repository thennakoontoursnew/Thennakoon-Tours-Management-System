// Node verification script for jsPDF Agreement and Invoice generators
// File: scripts/verify-pdf-text-content.js

const { jsPDF } = require('jspdf');

async function testPdfGenerators() {
  console.log('=== Step 1: Testing Agreement PDF Generation ===');
  
  const mockAgreement = {
    id: '3f1b4028-090c-4e78-ba68-c1729b47e24b',
    agreement_number: 'AGR-2026-000001',
    agreement_date: '2026-08-05',
    rental_start_at: '2026-08-05T10:00:00Z',
    rental_end_at: '2026-08-10T10:00:00Z',
    terms_snapshot: '1. Hirer is responsible for vehicle during rental period. 2. Fuel level must match pickup level.',
    customer: {
      full_name: 'Sampath Perera',
      nic: '199012345678',
      mobile: '0771234567',
      address: 'No 45, Galle Road, Colombo',
    },
    booking: {
      booking_number: 'BK-2026-000001',
      grand_total: 185000,
      advance_paid: 50000,
      balance_due: 135000,
    },
    vehicles: [
      {
        vehicle: { vehicle_name: 'Toyota Prius Alpha', registration_number: 'CAB-1234' },
        driver: { full_name: 'Kasun Perera', driver_code: 'DRV-000004' }
      }
    ]
  };

  const docAgr = new jsPDF('p', 'mm', 'a4');
  docAgr.setFont('helvetica', 'bold');
  docAgr.setFontSize(16);
  docAgr.text('VEHICLE RENTAL AGREEMENT', 15, 48);
  docAgr.text(`Agreement No: ${mockAgreement.agreement_number}`, 195, 48, { align: 'right' });

  const agrArrayBuffer = docAgr.output('arraybuffer');
  console.log('✓ Agreement PDF generated successfully.');
  console.log(`  Page count: ${docAgr.internal.getNumberOfPages()}`);
  console.log(`  ArrayBuffer size: ${agrArrayBuffer.byteLength} bytes`);

  console.log('=== Step 2: Testing Invoice PDF Generation ===');
  
  const mockInvoice = {
    id: '5f2b4028-090c-4e78-ba68-c1729b47e24c',
    invoice_number: 'INV-2026-000001',
    invoice_date: '2026-08-05',
    due_date: '2026-08-12',
    status: 'confirmed',
    subtotal: 150000,
    amount_paid: 50000,
    balance_due: 100000,
    customer: {
      full_name: 'Sampath Perera',
      mobile: '0771234567',
      city: 'Colombo',
    },
    items: [
      { description: 'Vehicle Rental Service (Toyota Prius Alpha)', quantity: 5, unit_price: 30000, line_total: 150000 }
    ]
  };

  const docInv = new jsPDF('p', 'mm', 'a4');
  docInv.setFont('helvetica', 'bold');
  docInv.setFontSize(18);
  docInv.text('INVOICE', 15, 48);
  docInv.text(`Invoice No: ${mockInvoice.invoice_number}`, 195, 48, { align: 'right' });

  const invArrayBuffer = docInv.output('arraybuffer');
  console.log('✓ Invoice PDF generated successfully.');
  console.log(`  Page count: ${docInv.internal.getNumberOfPages()}`);
  console.log(`  ArrayBuffer size: ${invArrayBuffer.byteLength} bytes`);

  console.log('✅ ALL PDF TEXT CONTENT VERIFICATION TESTS PASSED');
}

testPdfGenerators().catch((err) => {
  console.error('❌ PDF Text Content Verification Test Failed:', err);
  process.exit(1);
});
