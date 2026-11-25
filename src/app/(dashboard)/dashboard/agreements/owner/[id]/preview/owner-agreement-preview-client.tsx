'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Printer, ShieldCheck, FileText, Lock } from 'lucide-react'
import { LegalDocumentViewer } from '@/lib/agreements/legal-document-viewer'

interface OwnerAgreementPreviewClientProps {
  agreement: any
  owner?: any
  vehicles?: any[]
}

function getOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

function formatToOrdinalDate(dateStr?: string | null): string {
  if (!dateStr) return '_______________'
  try {
    const d = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T00:00:00')
    if (isNaN(d.getTime())) return dateStr
    const day = getOrdinal(d.getDate())
    const month = d.toLocaleString('en-US', { month: 'long' })
    const year = d.getFullYear()
    return `${day} ${month} ${year}`
  } catch {
    return dateStr
  }
}

function formatToSlashDate(dateStr?: string | null): string {
  if (!dateStr) return 'DD/MM/YYYY'
  try {
    const d = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T00:00:00')
    if (isNaN(d.getTime())) return dateStr
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    return `${day}/${month}/${year}`
  } catch {
    return dateStr
  }
}

export function OwnerAgreementPreviewClient({
  agreement,
  owner,
  vehicles = [],
}: OwnerAgreementPreviewClientProps) {
  const data = agreement?.agreement_data || {}
  const firstCovered = vehicles?.[0]?.vehicle || {}

  // 1. Term & Execution details
  const executionDateFormatted =
    data.execution_date_formatted ||
    formatToOrdinalDate(data.execution_date || agreement.activated_at || agreement.created_at)

  const termDuration = data.term_duration || '01 MONTH'
  const startDateFormatted =
    data.start_date_formatted || formatToSlashDate(data.start_date || agreement.agreement_start_date)
  const endDateFormatted =
    data.end_date_formatted || (agreement.agreement_end_date ? formatToSlashDate(agreement.agreement_end_date) : 'PERPETUAL')
  const handoverDateFormatted =
    data.handover_date_formatted || formatToSlashDate(data.handover_date || data.start_date || agreement.agreement_start_date)
  const initialAgreementFormatted =
    data.initial_agreement_date_formatted || (data.initial_agreement_date ? formatToSlashDate(data.initial_agreement_date) : null)

  // 2. Owner details
  const ownerFullName = data.owner?.full_name || owner?.full_name || 'Vehicle Owner'
  const ownerNic = data.owner?.national_id || owner?.national_id || '_______________'
  const ownerAddress = data.owner?.address || owner?.address || '_______________'
  const ownerPhone = data.owner?.phone || owner?.mobile || owner?.whatsapp || '_______________'
  const ownerEmail = data.owner?.email || owner?.email || '_______________'

  // 3. Vehicle details
  const vehicleMakeModel =
    data.vehicle?.make_model ||
    [firstCovered?.brand, firstCovered?.model].filter(Boolean).join(' ') ||
    firstCovered?.vehicle_name ||
    'Motor Vehicle'
  const vehicleRegNo = data.vehicle?.registration_number || firstCovered?.registration_number || 'WP CBA-XXXX'
  const vehicleChassis = data.vehicle?.chassis_number || firstCovered?.chassis_number || 'N/A'
  const vehicleEngine = data.vehicle?.engine_number || firstCovered?.engine_number || 'N/A'

  // 4. Financials
  const rawRental = data.financials?.monthly_rental ?? agreement.fixed_monthly_amount ?? 350000
  const monthlyRentalNum = typeof rawRental === 'number' ? rawRental : Number(String(rawRental).replace(/[^0-9.]/g, '')) || 350000
  const monthlyRentalFormatted = monthlyRentalNum.toLocaleString()
  const monthlyQuotaKm = (data.financials?.monthly_mileage_quota_km || 3000).toLocaleString()
  const excessRate = data.financials?.excess_mileage_rate_per_km || 117
  const serviceInterval = (data.financials?.service_interval_km || 5000).toLocaleString()
  const paymentDay = data.financials?.payment_day_of_month || '30th'
  const renewalFee = (data.financials?.renewal_charge || 3000).toLocaleString()
  const noticeDays = data.financials?.termination_notice_days || agreement.termination_notice_days || 30

  // 5. Bank Details
  const bankAccHolder = data.bank_details?.account_holder_name || owner?.full_name || ownerFullName
  const bankName = data.bank_details?.bank_name || owner?.bank_name || '_______________'
  const bankBranch = data.bank_details?.bank_branch || owner?.bank_branch || '_______________'
  const bankAccountNo = data.bank_details?.bank_account_number || owner?.bank_account_number || '_______________'

  // 6. Signatories & Witnesses
  const companyRepName = data.signatories?.company_rep_name || 'HBNK Dissanayaka'
  const companyRepDesignation = data.signatories?.company_rep_designation || 'Technical Officer'
  const companyRepNic = data.signatories?.company_rep_nic || '881843935V'
  const companyWitnessName = data.signatories?.company_witness_name || ''
  const companyWitnessNic = data.signatories?.company_witness_nic || ''

  const ownerWitnessName = data.signatories?.owner_witness_name || ''
  const ownerWitnessNic = data.signatories?.owner_witness_nic || ''
  const ownerWitnessAddress = data.signatories?.owner_witness_address || ''
  const ownerWitnessContact = data.signatories?.owner_witness_contact || ''
  const ownerWitnessCompany = data.signatories?.owner_witness_company || ''

  // 7. Special remarks
  const specialRemarks = data.special_remarks || agreement.special_conditions || ''

  // Document title dynamic override for clean PDF saving
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const cleanDocTitle = `${agreement?.agreement_number || vehicleRegNo}-Owner-Agreement.pdf`
      document.title = cleanDocTitle
    }
  }, [agreement?.agreement_number, vehicleRegNo])

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print()
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-3 sm:p-6 md:p-8 flex flex-col items-center">
      {/* Print CSS forcing clean document rendering without web chrome */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 18mm 18mm 18mm 18mm;
          }
          body {
            background: white !important;
            color: #0f172a !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .no-print {
            display: none !important;
          }
          .page-break-before {
            page-break-before: always;
          }
          .avoid-break {
            page-break-inside: avoid;
            break-inside: avoid;
          }
        }
      `}</style>

      {/* Top Interactive Toolbar (Hidden during print) */}
      <div className="w-full max-w-4xl flex items-center justify-between mb-6 no-print">
        <Link
          href={`/dashboard/agreements/owner/${agreement.id}`}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-colors flex items-center gap-1.5"
        >
          <ArrowLeft size={15} /> Back to Details
        </Link>
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-amber-400 font-bold">{agreement.agreement_number}</span>
          {agreement.rendered_sections_snapshot?.length > 0 || agreement.rendered_content_snapshot ? (
            <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <Lock size={11} /> Immutable Legal Snapshot Locked
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Official 10-Clause Legal Contract (A4/Legal)
            </span>
          )}
          <button
            onClick={handlePrint}
            className="px-5 py-2 rounded-xl bg-amber-400 text-slate-950 font-black text-xs hover:bg-amber-300 transition-all cursor-pointer flex items-center gap-1.5 shadow-md"
          >
            <Printer size={15} /> Print / Save as PDF
          </button>
        </div>
      </div>

      {/* Formal Legal Document Paper Container */}
      <div
        className="relative w-full max-w-[210mm] bg-white text-slate-900 shadow-2xl rounded-sm p-10 md:p-14 space-y-6 text-[12px] leading-[1.65] font-serif print:p-0 print:shadow-none print:w-full print:max-w-none"
        style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", Times, serif' }}
      >
        {/* Document Header */}
        <div className="border-b-2 border-slate-900 pb-4 text-center space-y-1">
          <h1 className="text-xl font-bold tracking-wide uppercase text-slate-900 font-sans">
            THENNAKOON TOURS (PRIVATE) LIMITED
          </h1>
          <p className="text-[10px] text-slate-600 font-sans tracking-tight">
            Company Registration No: <strong>PV 00312253</strong> • Registered under the Companies Act No. 07 of 2007
          </p>
          <p className="text-[10px] text-slate-600 font-sans">
            Registered Office: No. 146/5A, Dutugamunu Street, Caldera Gardens, Kohuwala, Sri Lanka.
          </p>
          <p className="text-[10px] text-slate-600 font-sans">
            Hotline: +94 112 823 723 / +94 777 273 820 / +94 777 474 938 • Email: thennakoontours2023@gmail.com
          </p>
        </div>

        {/* Document Title & Reference Bar */}
        <div className="flex items-center justify-between border-b border-slate-300 py-2 text-[11px] font-sans">
          <div>
            <span className="font-bold text-slate-700">DOCUMENT: </span>
            <span className="font-black uppercase tracking-wider text-slate-900">VEHICLE RENTAL AGREEMENT</span>
          </div>
          <div className="text-right">
            <span className="font-bold text-slate-700">AGREEMENT REF: </span>
            <span className="font-mono font-bold text-slate-900">{agreement.agreement_number}</span>
          </div>
        </div>

        {agreement.rendered_sections_snapshot && Array.isArray(agreement.rendered_sections_snapshot) && agreement.rendered_sections_snapshot.length > 0 ? (
          <LegalDocumentViewer sections={agreement.rendered_sections_snapshot} />
        ) : agreement.rendered_content_snapshot ? (
          <LegalDocumentViewer content={agreement.rendered_content_snapshot} />
        ) : (
          <>
            {/* Preamble */}
            <div className="text-justify space-y-3">
          <p>
            This <strong>VEHICLE RENTAL AGREEMENT</strong> (hereinafter referred to as the <strong>&quot;Agreement&quot;</strong>) is
            made and entered into on this <strong>{executionDateFormatted}</strong> by and between:
          </p>

          <div className="pl-4 border-l-2 border-slate-300 space-y-2.5 my-2">
            <p>
              1. <strong>THENNAKOON TOURS (PRIVATE) LIMITED</strong>, a company duly incorporated and operating under the
              laws of the Democratic Socialist Republic of Sri Lanka, bearing Company Registration Number <strong>PV 00312253</strong>,
              and having its registered office at No. 146/5A, Dutugamunu Street, Caldera Gardens, Kohuwala, Sri Lanka (hereinafter
              referred to as the <strong>&quot;Company&quot;</strong> or <strong>&quot;Thennakoon Tours&quot;</strong>, which term shall where the
              context so requires or admits include its successors-in-title and permitted assigns) of the <strong>FIRST PART</strong>; and
            </p>
            <p>
              2. <strong>{ownerFullName.toUpperCase()}</strong>, holding National Identity Card / Passport Number{' '}
              <strong>{ownerNic}</strong>, and residing at <strong>{ownerAddress}</strong> (hereinafter referred to as the{' '}
              <strong>&quot;Owner&quot;</strong>, which term shall where the context so requires or admits include their heirs,
              executors, administrators, and permitted assigns) of the <strong>SECOND PART</strong>.
            </p>
          </div>

          <p className="text-[11px] italic text-slate-600">
            (The Company and the Owner are hereinafter collectively referred to as the &quot;Parties&quot; and individually as a &quot;Party&quot;.)
          </p>

          <p>
            <strong>WHEREAS</strong> the Owner is the absolute, registered, and lawful owner of the passenger motor vehicle
            morefully described in the Schedule hereunder written;
          </p>
          <p>
            <strong>AND WHEREAS</strong> the Company operates a tourist transport, corporate vehicle rental, and passenger fleet
            service in Sri Lanka and has agreed to take on commercial hire the said motor vehicle from the Owner on the terms, covenants,
            and conditions hereinafter set forth;
          </p>
          <p className="font-bold text-center pt-1 uppercase tracking-wider text-[11px] font-sans">
            NOW THEREFORE IT IS MUTUALLY AGREED BY AND BETWEEN THE PARTIES AS FOLLOWS:
          </p>
        </div>

        {/* 1. TERM */}
        <div className="space-y-1.5 text-justify">
          <h2 className="font-sans font-bold text-slate-900 uppercase tracking-wide text-[12px] border-b border-slate-200 pb-0.5">
            1. TERM & COMMENCEMENT
          </h2>
          <p>
            <strong>1.1 Handover:</strong> The Owner hereby hands over physical possession and commercial custody of the
            motor vehicle described in the Schedule hereunder to the Company on <strong>{handoverDateFormatted}</strong> (the{' '}
            <strong>&quot;Handover Date&quot;</strong>).
          </p>
          <p>
            <strong>1.2 Duration:</strong> This Agreement shall be effective for an agreed fixed term of{' '}
            <strong>{termDuration}</strong>, commencing from <strong>{startDateFormatted}</strong> and expiring on{' '}
            <strong>{endDateFormatted}</strong> (the <strong>&quot;Term&quot;</strong>), unless terminated earlier in strict compliance
            with the provisions of Clause 6 herein.
          </p>
          <p>
            <strong>1.3 Renewal & Precedence:</strong>{' '}
            {initialAgreementFormatted ? (
              <span>
                This Agreement supersedes, replaces, and extinguishes in its entirety the initial vehicle rental agreement
                previously entered into between the Parties on <strong>{initialAgreementFormatted}</strong>.
              </span>
            ) : (
              <span>
                This Agreement constitutes the primary legal contract governing the commercial lease of the vehicle.
              </span>
            )}{' '}
            The Parties may mutually renew or extend this Agreement prior to the expiration of the Term upon written mutual agreement,
            subject to an administrative and document preparation fee of <strong>Rs. {renewalFee}/-</strong> payable upon each renewal.
          </p>
        </div>

        {/* 2. REPRESENTATIONS AND WARRANTIES OF THE OWNER */}
        <div className="space-y-1.5 text-justify">
          <h2 className="font-sans font-bold text-slate-900 uppercase tracking-wide text-[12px] border-b border-slate-200 pb-0.5">
            2. REPRESENTATIONS AND WARRANTIES OF THE OWNER
          </h2>
          <p>
            <strong>2.1 Title and Ownership:</strong> The Owner warrants and guarantees that they are the absolute registered owner
            of the vehicle or possess full and unencumbered legal authority, power of attorney, or statutory authorization from the
            registered owner to enter into this Agreement and lease the vehicle to the Company.
          </p>
          <p>
            <strong>2.2 Freedom from Encumbrances:</strong> The Owner warrants that the vehicle is free from any undisclosed liens,
            pledges, court attachments, judicial confiscations, sequestration orders, or ownership disputes that could hinder,
            impede, or disturb the peaceful commercial possession and operational use of the vehicle by the Company.
          </p>
          <p>
            <strong>2.3 Roadworthiness:</strong> The Owner warrants that the vehicle is mechanically sound, roadworthy, clean, and in
            safe operating condition at the time of handover, conforming to all statutory motor traffic safety regulations in Sri Lanka.
          </p>
        </div>

        {/* 3. OBLIGATIONS AND RIGHTS OF THE OWNER */}
        <div className="space-y-1.5 text-justify">
          <h2 className="font-sans font-bold text-slate-900 uppercase tracking-wide text-[12px] border-b border-slate-200 pb-0.5">
            3. OBLIGATIONS AND RIGHTS OF THE OWNER
          </h2>
          <p>
            <strong>3.1 Comprehensive Insurance:</strong> The Owner shall ensure that the vehicle maintains throughout the Term a
            valid, comprehensive motor insurance policy issued by an authorized insurer in Sri Lanka, explicitly endorsed to cover
            commercial passenger transport, tourist hiring, and third-party liabilities.
          </p>
          <p>
            <strong>3.2 Scheduled Routine Servicing:</strong> The Owner shall bear the entire financial cost of routine periodic
            servicing, engine oil replacements, filter replacements, and standard manufacturer-prescribed maintenance required at
            every <strong>{serviceInterval} Km</strong> service interval.
          </p>
          <p>
            <strong>3.3 Major Mechanical Repairs & Consumables:</strong> The Owner shall be exclusively responsible for fair
            wear-and-tear mechanical repairs, replacements of the vehicle battery, tires, gearbox, transmission, cooling systems, and
            major engine repairs not resulting from direct driver abuse, collision negligence, or gross misconduct by Company personnel.
          </p>
          <p>
            <strong>3.4 Breakdown Transport & Recovery:</strong> In the event of a mechanical or electrical failure arising from
            pre-existing mechanical wear or inherent component failure, the Owner shall promptly bear all vehicle carrier, flatbed
            transport, and towing expenses incurred in transporting the vehicle to an authorized service station.
          </p>
          <p className="bg-slate-50 p-2 border-l-2 border-slate-400 font-medium">
            <strong>3.5 Strict Non-Contact & Non-Interference Covenant:</strong> The Owner unequivocally covenants that neither the
            Owner, nor any of their agents, relatives, employees, or associates, shall at any time during or immediately following
            the rental period directly or indirectly contact, solicit, communicate with, negotiate with, or interfere with any tourist,
            guest, corporate client, or customer utilizing the vehicle. Any breach of this covenant constitutes a fundamental breach
            of contract, entitling the Company to immediate termination and full compensation for commercial damages.
          </p>
          <p>
            <strong>3.6 Fuel & Service Mileage:</strong> The fuel level upon final return of the vehicle to the Owner shall match the
            fuel level documented at the time of handover. Mileage traveled solely for the purpose of routine servicing or repairs
            mandated by the Owner shall be excluded from the Company&apos;s monthly quota calculation.
          </p>
          <p>
            <strong>3.7 Statutory Documents:</strong> The Owner shall timely renew and maintain the vehicle&apos;s annual Revenue License,
            Vehicle Emission Test Certificate, and Fitness Certificate at their own cost.
          </p>
          <p>
            <strong>3.8 GPS Telematics & Fleet Monitoring:</strong> The Owner grants express consent to the Company to install,
            maintain, and monitor GPS tracking devices, telematics sensors, and security equipment on the vehicle.
          </p>
        </div>

        {/* 4. OBLIGATIONS AND RIGHTS OF THENNAKOON TOURS */}
        <div className="space-y-1.5 text-justify avoid-break">
          <h2 className="font-sans font-bold text-slate-900 uppercase tracking-wide text-[12px] border-b border-slate-200 pb-0.5">
            4. OBLIGATIONS AND RIGHTS OF THENNAKOON TOURS (THE COMPANY)
          </h2>
          <p>
            <strong>4.1 Commercial Operations:</strong> The Company shall utilize the vehicle for lawful tourist transportation,
            corporate hire, self-drive, and chauffeur-driven rental operations within the geographical territory of Sri Lanka.
          </p>
          <p>
            <strong>4.2 Monthly Mileage Quota & Excess Tracking:</strong> The Company agrees to a standard monthly mileage quota of{' '}
            <strong>{monthlyQuotaKm} Km</strong> per billing month. Any cumulative mileage exceeding this quota shall be recorded and
            remitted to the Owner at the agreed excess rate of <strong>Rs. {excessRate}/= per Km</strong>.
          </p>
          <p>
            <strong>4.3 Branding & Accessories:</strong> The Company shall have the right to affix removable magnetic decals, corporate
            logos, and operational accessories necessary for tourism transport operations.
          </p>
          <p>
            <strong>4.4 Force Majeure & Operational Disruption:</strong> In the event of island-wide curfews, natural disasters,
            pandemics, civil unrest, or state-mandated travel restrictions that halt commercial tourism, the agreed monthly rental
            shall be prorated strictly according to the actual operational days in that billing cycle.
          </p>
          <p>
            <strong>4.5 Qualified Drivers:</strong> The Company covenants that the vehicle shall be operated only by experienced
            drivers possessing valid Sri Lankan driving licenses and proper commercial certifications.
          </p>
          <p>
            <strong>4.6 Service Coordination:</strong> The Company shall diligently monitor odometer intervals and coordinate
            preventative maintenance every <strong>{serviceInterval} Km</strong> on behalf of the Owner.
          </p>
          <p>
            <strong>4.7 Vehicle Return:</strong> Upon the expiration or lawful termination of this Agreement, the Company shall return
            the vehicle to the Owner in good operational condition, normal wear and tear excepted.
          </p>
        </div>

        {/* 5. PAYMENT TERMS & BANK REMITTANCE */}
        <div className="space-y-1.5 text-justify avoid-break">
          <h2 className="font-sans font-bold text-slate-900 uppercase tracking-wide text-[12px] border-b border-slate-200 pb-0.5">
            5. PAYMENT TERMS & BANK REMITTANCE
          </h2>
          <p>
            <strong>5.1 Agreed Monthly Rental:</strong> The Company agrees to pay the Owner an agreed monthly rental of{' '}
            <strong>Rs. {monthlyRentalFormatted}/-</strong> for the vehicle.
          </p>
          <p>
            <strong>5.2 Settlement Date:</strong> The monthly rental shall be paid on or before the <strong>{paymentDay}</strong> of
            each calendar month for the preceding operational period.
          </p>
          <p>
            <strong>5.3 Designated Bank Account:</strong> All monthly rental payments and excess mileage settlements shall be remitted
            via direct bank transfer to the Owner&apos;s nominated bank account specified below:
          </p>

          <div className="my-2 p-3 bg-slate-50 border border-slate-300 rounded font-sans text-[11px] grid grid-cols-2 gap-2">
            <div>
              <span className="text-slate-500 font-semibold block">Account Holder Name:</span>
              <span className="font-bold text-slate-900">{bankAccHolder}</span>
            </div>
            <div>
              <span className="text-slate-500 font-semibold block">Bank Name:</span>
              <span className="font-bold text-slate-900">{bankName}</span>
            </div>
            <div>
              <span className="text-slate-500 font-semibold block">Branch:</span>
              <span className="font-bold text-slate-900">{bankBranch}</span>
            </div>
            <div>
              <span className="text-slate-500 font-semibold block">Account Number:</span>
              <span className="font-mono font-bold text-slate-900">{bankAccountNo}</span>
            </div>
          </div>

          <p>
            <strong>5.4 Excess Mileage Settlement:</strong> Any excess mileage over <strong>{monthlyQuotaKm} Km</strong> during the
            calendar month shall be settled at <strong>Rs. {excessRate}/= per Km</strong> and included with the monthly payout.
          </p>
          <p>
            <strong>5.5 Deductions for Off-Road Downtime:</strong> If the vehicle is immobilized due to unresolved mechanical
            breakdown, delayed parts authorization by the Owner, or expired statutory documents, the daily pro-rata rental for each day
            the vehicle remains off-road shall be deducted from the monthly rental payout.
          </p>
          <p>
            <strong>5.6 Renewal Processing Charge:</strong> A document processing charge of <strong>Rs. {renewalFee}/-</strong> shall be
            deducted upon mutual renewal or extension of this Agreement.
          </p>
        </div>

        {/* 6. TERMINATION */}
        <div className="space-y-1.5 text-justify avoid-break">
          <h2 className="font-sans font-bold text-slate-900 uppercase tracking-wide text-[12px] border-b border-slate-200 pb-0.5">
            6. TERMINATION
          </h2>
          <p>
            <strong>6.1 Notice of Termination:</strong> Either Party may terminate this Agreement without cause by serving{' '}
            <strong>{noticeDays} days&apos;</strong> prior written notice to the other Party.
          </p>
          <p>
            <strong>6.2 Immediate Termination:</strong> The Company shall be entitled to terminate this Agreement forthwith without
            penalty if the vehicle is seized or encumbered, if the Owner breaches the non-contact covenant in Clause 3.5, or if the
            Owner fails to maintain valid comprehensive commercial insurance.
          </p>
          <p>
            <strong>6.3 Final Settlement:</strong> Upon termination, the Company shall return the vehicle to the Owner and settle all
            dues up to the date of physical handover, less any authorized deductions.
          </p>
        </div>

        {/* 7. INDEMNITY */}
        <div className="space-y-1.5 text-justify avoid-break">
          <h2 className="font-sans font-bold text-slate-900 uppercase tracking-wide text-[12px] border-b border-slate-200 pb-0.5">
            7. INDEMNITY & LIABILITY
          </h2>
          <p>
            <strong>7.1 Owner Indemnity:</strong> The Owner agrees to defend, indemnify, and hold harmless the Company, its directors,
            and employees from and against any third-party claims, fines, or losses resulting from pre-existing mechanical defects, title
            defects, or statutory non-compliance existing prior to handover.
          </p>
          <p>
            <strong>7.2 Company Indemnity:</strong> The Company shall indemnify the Owner against direct liabilities or penalties
            arising directly from gross negligence, reckless driving, or willful misconduct of Company-appointed drivers during the
            active operational custody of the vehicle.
          </p>
        </div>

        {/* 8. NON-EXCLUSIVITY & STATUS */}
        <div className="space-y-1.5 text-justify avoid-break">
          <h2 className="font-sans font-bold text-slate-900 uppercase tracking-wide text-[12px] border-b border-slate-200 pb-0.5">
            8. RELATIONSHIP OF PARTIES
          </h2>
          <p>
            This Agreement is established on a commercial hiring basis. Nothing contained herein shall be deemed or construed to create
            a partnership, joint venture, agency, or employer-employee relationship between the Parties.
          </p>
        </div>

        {/* 9. MISCELLANEOUS & GOVERNING LAW */}
        <div className="space-y-1.5 text-justify avoid-break">
          <h2 className="font-sans font-bold text-slate-900 uppercase tracking-wide text-[12px] border-b border-slate-200 pb-0.5">
            9. MISCELLANEOUS & GOVERNING LAW
          </h2>
          <p>
            <strong>9.1 Notices:</strong> All formal notices shall be sent by registered post or electronic mail to the addresses
            stated in the preamble hereof. Notice to the Company shall be copied to{' '}
            <span className="font-mono text-[11px]">thennakoontours2023@gmail.com</span>.
          </p>
          <p>
            <strong>9.2 Entire Agreement:</strong> This Agreement, together with the Schedule hereto and any written amendments
            executed by both Parties, constitutes the complete and exclusive agreement between the Parties.
          </p>
          <p>
            <strong>9.3 Severability:</strong> If any provision of this Agreement is held invalid or unenforceable, the remaining
            provisions shall remain in full force and effect.
          </p>
          <p>
            <strong>9.4 Governing Law:</strong> This Agreement shall be governed by, construed, and enforced in accordance with the
            Laws of the Democratic Socialist Republic of Sri Lanka. Any legal disputes arising hereunder shall be subject to the
            exclusive jurisdiction of the competent courts of Colombo, Sri Lanka.
          </p>
        </div>

        {/* SCHEDULE */}
        <div className="pt-2 avoid-break">
          <h2 className="font-sans font-bold text-slate-900 uppercase tracking-wide text-[12px] text-center border-b-2 border-slate-900 pb-1 mb-2">
            THE SCHEDULE ABOVE REFERRED TO (PARTICULARS OF THE MOTOR VEHICLE)
          </h2>
          <table className="w-full border-collapse border border-slate-400 text-[11px] font-sans">
            <tbody>
              <tr className="border-b border-slate-300">
                <td className="p-2 font-bold bg-slate-100 w-1/3 border-r border-slate-300">Make and Model:</td>
                <td className="p-2 font-semibold text-slate-900">{vehicleMakeModel}</td>
              </tr>
              <tr className="border-b border-slate-300">
                <td className="p-2 font-bold bg-slate-100 border-r border-slate-300">Vehicle Registration Number:</td>
                <td className="p-2 font-mono font-black text-slate-900">{vehicleRegNo}</td>
              </tr>
              <tr className="border-b border-slate-300">
                <td className="p-2 font-bold bg-slate-100 border-r border-slate-300">Chassis Number:</td>
                <td className="p-2 font-mono text-slate-900">{vehicleChassis}</td>
              </tr>
              <tr className="border-b border-slate-300">
                <td className="p-2 font-bold bg-slate-100 border-r border-slate-300">Engine Number:</td>
                <td className="p-2 font-mono text-slate-900">{vehicleEngine}</td>
              </tr>
              <tr className="border-b border-slate-300">
                <td className="p-2 font-bold bg-slate-100 border-r border-slate-300">Agreed Monthly Rental:</td>
                <td className="p-2 font-bold text-slate-900">Rs. {monthlyRentalFormatted}/- per month</td>
              </tr>
              <tr className="border-b border-slate-300">
                <td className="p-2 font-bold bg-slate-100 border-r border-slate-300">Monthly Mileage Quota:</td>
                <td className="p-2 text-slate-900">{monthlyQuotaKm} Km per calendar month</td>
              </tr>
              <tr className="border-b border-slate-300">
                <td className="p-2 font-bold bg-slate-100 border-r border-slate-300">Excess Mileage Rate:</td>
                <td className="p-2 font-bold text-slate-900">Rs. {excessRate}/= per Km over quota</td>
              </tr>
              <tr>
                <td className="p-2 font-bold bg-slate-100 border-r border-slate-300">Routine Service Interval:</td>
                <td className="p-2 text-slate-900">Every {serviceInterval} Km (Cost borne by Vehicle Owner)</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* SECTION 10: SPECIAL REMARKS (Conditional) */}
        {specialRemarks && (
          <div className="space-y-1.5 text-justify avoid-break pt-2">
            <h2 className="font-sans font-bold text-slate-900 uppercase tracking-wide text-[12px] border-b border-slate-200 pb-0.5">
              10. SPECIAL REMARKS & SPECIFIC COVENANTS
            </h2>
            <div className="p-3 bg-slate-50 border border-slate-300 rounded font-sans text-[11px] leading-relaxed whitespace-pre-wrap">
              {specialRemarks}
            </div>
          </div>
        )}

        {/* SIGNATURE AND WITNESS BLOCK */}
        <div className="pt-8 avoid-break space-y-6">
          <p className="text-center italic text-[11px]">
            IN WITNESS WHEREOF the Parties hereto have set their hands hereunto and to one other of the same tenor and date as
            hereinabove written.
          </p>

          <div className="grid grid-cols-2 gap-8 font-sans text-[11px]">
            {/* FIRST PARTY: COMPANY */}
            <div className="border border-slate-300 rounded p-4 space-y-4">
              <div className="border-b border-slate-200 pb-2">
                <p className="font-bold uppercase text-slate-900">For and on behalf of</p>
                <p className="font-black text-slate-900">THENNAKOON TOURS (PVT) LTD</p>
              </div>

              <div className="pt-10 border-b border-slate-400"></div>
              <div className="space-y-1 text-[11px]">
                <p>
                  <strong>Authorized Signatory:</strong> {companyRepName}
                </p>
                <p>
                  <strong>Designation:</strong> {companyRepDesignation}
                </p>
                <p>
                  <strong>NIC No:</strong> {companyRepNic}
                </p>
                <p>
                  <strong>Date:</strong> _______________________
                </p>
              </div>

              {/* Company Witness */}
              <div className="pt-3 border-t border-dashed border-slate-300 space-y-2">
                <p className="font-bold text-[10px] uppercase text-slate-500">Witness for Company:</p>
                <div className="pt-6 border-b border-slate-400"></div>
                <p>
                  <strong>Signature:</strong> ___________________
                </p>
                <p>
                  <strong>Name:</strong> {companyWitnessName || '_______________________________'}
                </p>
                <p>
                  <strong>NIC:</strong> {companyWitnessNic || '_______________________________'}
                </p>
              </div>
            </div>

            {/* SECOND PARTY: OWNER */}
            <div className="border border-slate-300 rounded p-4 space-y-4">
              <div className="border-b border-slate-200 pb-2">
                <p className="font-bold uppercase text-slate-900">Signed by the</p>
                <p className="font-black text-slate-900">VEHICLE OWNER</p>
              </div>

              <div className="pt-10 border-b border-slate-400"></div>
              <div className="space-y-1 text-[11px]">
                <p>
                  <strong>Owner Name:</strong> {ownerFullName}
                </p>
                <p>
                  <strong>NIC No:</strong> {ownerNic}
                </p>
                <p>
                  <strong>Date:</strong> _______________________
                </p>
              </div>

              {/* Owner Witness */}
              <div className="pt-3 border-t border-dashed border-slate-300 space-y-2">
                <p className="font-bold text-[10px] uppercase text-slate-500">Witness for Vehicle Owner:</p>
                <div className="pt-6 border-b border-slate-400"></div>
                <p>
                  <strong>Signature:</strong> ___________________
                </p>
                <p>
                  <strong>Name:</strong> {ownerWitnessName || '_______________________________'}
                </p>
                <p>
                  <strong>NIC:</strong> {ownerWitnessNic || '_______________________________'}
                </p>
                <p>
                  <strong>Address:</strong> {ownerWitnessAddress || '_______________________________'}
                </p>
                <p>
                  <strong>Contact No:</strong> {ownerWitnessContact || '_______________________________'}
                </p>
                {ownerWitnessCompany && (
                  <p>
                    <strong>Company/Occ:</strong> {ownerWitnessCompany}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
        </>
        )}

        {/* Formal Document Footer */}
        <div className="pt-6 border-t border-slate-300 text-[10px] font-sans text-slate-500 flex items-center justify-between">
          <span>Agreement Reference: {agreement.agreement_number}</span>
          <span>Thennakoon Tours (Pvt) Ltd • Vehicle Owner Agreement</span>
          <span>Official Legal Record</span>
        </div>
      </div>
    </div>
  )
}
