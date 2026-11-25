/**
 * Template Renderer & Master Agreement Templates Engine
 * Handles {{merge_tag}} substitution, default legal text, and snapshot freezing.
 */

export interface MergeTagDefinition {
  tag: string
  label: string
  description?: string
  category?: 'dates' | 'party' | 'vehicle' | 'financial' | 'bank' | 'signatories' | 'notes'
}

export const MERGE_TAGS_OWNER_AGREEMENT: MergeTagDefinition[] = [
  // Dates & Term
  { tag: '{{agreement_date}}', label: 'Agreement Date', category: 'dates', description: 'Execution date (e.g. 25th November 2026)' },
  { tag: '{{term_duration}}', label: 'Term Duration', category: 'dates', description: 'Duration of lease (e.g. 01 MONTH)' },
  { tag: '{{start_date}}', label: 'Start Date', category: 'dates', description: 'Commencement date (e.g. 25/11/2026)' },
  { tag: '{{end_date}}', label: 'End Date', category: 'dates', description: 'Expiration date (e.g. 24/12/2026)' },
  { tag: '{{handover_date}}', label: 'Handover Date', category: 'dates', description: 'Physical vehicle handover date' },

  // Owner Party
  { tag: '{{owner_name}}', label: 'Owner Full Name', category: 'party', description: 'Full legal name of the vehicle owner' },
  { tag: '{{owner_nic}}', label: 'Owner NIC/Passport', category: 'party', description: 'National ID or Passport number' },
  { tag: '{{owner_address}}', label: 'Owner Address', category: 'party', description: 'Registered residential address' },
  { tag: '{{owner_phone}}', label: 'Owner Phone', category: 'party', description: 'Contact telephone / mobile' },
  { tag: '{{owner_email}}', label: 'Owner Email', category: 'party', description: 'Registered email for legal notices' },

  // Vehicle
  { tag: '{{vehicle_model}}', label: 'Vehicle Make & Model', category: 'vehicle', description: 'e.g. Toyota KDH 200' },
  { tag: '{{vehicle_reg_no}}', label: 'Registration Number', category: 'vehicle', description: 'e.g. WP CBA-1234' },
  { tag: '{{chassis_no}}', label: 'Chassis Number', category: 'vehicle', description: 'Vehicle chassis/VIN' },
  { tag: '{{engine_no}}', label: 'Engine Number', category: 'vehicle', description: 'Vehicle engine number' },

  // Financials & Service
  { tag: '{{monthly_rental}}', label: 'Monthly Rental (Rs.)', category: 'financial', description: 'Agreed monthly payout (e.g. 350,000)' },
  { tag: '{{payment_day}}', label: 'Payment Day', category: 'financial', description: 'Monthly payment day (e.g. 30th)' },
  { tag: '{{monthly_km_quota}}', label: 'Monthly Quota (Km)', category: 'financial', description: 'Allowed monthly mileage (e.g. 3,000)' },
  { tag: '{{excess_km_rate}}', label: 'Excess Rate (Rs./Km)', category: 'financial', description: 'Excess rate per Km over quota (e.g. 117)' },
  { tag: '{{service_km}}', label: 'Service Interval (Km)', category: 'financial', description: 'Routine service interval (e.g. 5,000)' },
  { tag: '{{renewal_charge}}', label: 'Renewal Fee (Rs.)', category: 'financial', description: 'Document processing charge (e.g. 3,000)' },

  // Bank
  { tag: '{{bank_account_name}}', label: 'Bank Account Name', category: 'bank', description: 'Account holder legal name' },
  { tag: '{{bank_name}}', label: 'Bank Name', category: 'bank', description: 'Bank name (e.g. Nations Trust Bank)' },
  { tag: '{{bank_branch}}', label: 'Bank Branch', category: 'bank', description: 'Branch location' },
  { tag: '{{bank_account_no}}', label: 'Account Number', category: 'bank', description: 'Remittance bank account number' },

  // Signatories & Witnesses
  { tag: '{{company_rep_name}}', label: 'Company Rep Name', category: 'signatories', description: 'Thennakoon Tours representative' },
  { tag: '{{company_rep_designation}}', label: 'Rep Designation', category: 'signatories', description: 'Representative role / title' },
  { tag: '{{company_rep_nic}}', label: 'Company Rep NIC', category: 'signatories', description: 'Representative NIC' },
  { tag: '{{company_witness_name}}', label: 'Company Witness Name', category: 'signatories', description: 'Name of company witness' },
  { tag: '{{company_witness_nic}}', label: 'Company Witness NIC', category: 'signatories', description: 'NIC of company witness' },
  { tag: '{{owner_witness_name}}', label: 'Owner Witness Name', category: 'signatories', description: 'Name of vehicle owner witness' },
  { tag: '{{owner_witness_nic}}', label: 'Owner Witness NIC', category: 'signatories', description: 'NIC of vehicle owner witness' },
  { tag: '{{owner_witness_address}}', label: 'Owner Witness Address', category: 'signatories', description: 'Address of owner witness' },
  { tag: '{{owner_witness_phone}}', label: 'Owner Witness Phone', category: 'signatories', description: 'Phone of owner witness' },

  // Remarks
  { tag: '{{special_remarks}}', label: 'Special Remarks', category: 'notes', description: 'Section 10 custom covenants or notes' },
]

export const MERGE_TAGS_USER_AGREEMENT: MergeTagDefinition[] = [
  // Agreement & Dates
  { tag: '{{agreement_number}}', label: 'Agreement No', category: 'dates', description: 'Agreement reference number' },
  { tag: '{{agreement_date}}', label: 'Agreement Date', category: 'dates', description: 'Execution date' },
  { tag: '{{rental_start}}', label: 'Rental Start', category: 'dates', description: 'Rental commencement timestamp' },
  { tag: '{{rental_end}}', label: 'Rental End', category: 'dates', description: 'Rental completion timestamp' },
  { tag: '{{rental_period}}', label: 'Rental Period', category: 'dates', description: 'Duration in days/weeks/months' },

  // Lessee (Customer)
  { tag: '{{lessee_name}}', label: 'Customer/Lessee Name', category: 'party', description: 'Full legal name of customer' },
  { tag: '{{lessee_nic}}', label: 'Lessee NIC/Passport', category: 'party', description: 'NIC or Passport number' },
  { tag: '{{lessee_address}}', label: 'Lessee Address', category: 'party', description: 'Residential or company address' },
  { tag: '{{lessee_phone}}', label: 'Lessee Phone', category: 'party', description: 'Contact telephone / mobile' },

  // Vehicle
  { tag: '{{vehicle_model}}', label: 'Vehicle Make & Model', category: 'vehicle', description: 'Make and model of hired vehicle' },
  { tag: '{{vehicle_reg_no}}', label: 'Registration Number', category: 'vehicle', description: 'Registration license plate number' },

  // Financials
  { tag: '{{monthly_rental}}', label: 'Monthly/Daily Rental', category: 'financial', description: 'Agreed periodic rental amount' },
  { tag: '{{total_rental}}', label: 'Total Rental', category: 'financial', description: 'Total rental cost for the period' },
  { tag: '{{deposit_amount}}', label: 'Security Deposit', category: 'financial', description: 'Refundable security deposit amount' },
  { tag: '{{km_limit}}', label: 'Allowed Km Limit', category: 'financial', description: 'Total allowed mileage limit' },
  { tag: '{{excess_km_rate}}', label: 'Excess Rate (Rs./Km)', category: 'financial', description: 'Charge per kilometer over limit' },

  // Signatories & Notes
  { tag: '{{company_rep_name}}', label: 'Company Rep Name', category: 'signatories', description: 'Thennakoon Tours officer' },
  { tag: '{{company_rep_designation}}', label: 'Rep Designation', category: 'signatories', description: 'Officer designation' },
  { tag: '{{special_notes}}', label: 'Special Conditions', category: 'notes', description: 'Custom notes or special conditions' },
]

export const DEFAULT_OWNER_AGREEMENT_TEMPLATE_BODY = `# VEHICLE RENTAL AGREEMENT

This **VEHICLE RENTAL AGREEMENT** (hereinafter referred to as the **"Agreement"**) is made and entered into on this **{{agreement_date}}** by and between:

1. **THENNAKOON TOURS (PRIVATE) LIMITED**, a company duly incorporated and operating under the laws of the Democratic Socialist Republic of Sri Lanka, bearing Company Registration Number **PV 00312253**, and having its registered office at No. 146/5A, Dutugamunu Street, Caldera Gardens, Kohuwala, Sri Lanka (hereinafter referred to as the **"Company"** or **"Thennakoon Tours"**, which term shall where the context so requires or admits include its successors-in-title and permitted assigns) of the **FIRST PART**; and

2. **{{owner_name}}**, holding National Identity Card / Passport Number **{{owner_nic}}**, and residing at **{{owner_address}}** (hereinafter referred to as the **"Owner"**, which term shall where the context so requires or admits include their heirs, executors, administrators, and permitted assigns) of the **SECOND PART**.

*(The Company and the Owner are hereinafter collectively referred to as the "Parties" and individually as a "Party".)*

**WHEREAS** the Owner is the absolute, registered, and lawful owner of the passenger motor vehicle morefully described in the Schedule hereunder written;

**AND WHEREAS** the Company operates a tourist transport, corporate vehicle rental, and passenger fleet service in Sri Lanka and has agreed to take on commercial hire the said motor vehicle from the Owner on the terms, covenants, and conditions hereinafter set forth;

**NOW THEREFORE IT IS MUTUALLY AGREED BY AND BETWEEN THE PARTIES AS FOLLOWS:**

### 1. TERM & COMMENCEMENT
1.1 **Handover:** The Owner hereby hands over physical possession and commercial custody of the motor vehicle described in the Schedule hereunder to the Company on **{{handover_date}}** (the **"Handover Date"**).
1.2 **Duration:** This Agreement shall be effective for an agreed fixed term of **{{term_duration}}**, commencing from **{{start_date}}** and expiring on **{{end_date}}** (the **"Term"**), unless terminated earlier in strict compliance with the provisions of Clause 6 herein.
1.3 **Renewal & Precedence:** This Agreement constitutes the primary legal contract governing the commercial lease of the vehicle. The Parties may mutually renew or extend this Agreement prior to the expiration of the Term upon written mutual agreement, subject to an administrative and document preparation fee of **Rs. {{renewal_charge}}/-** payable upon each renewal.

### 2. REPRESENTATIONS AND WARRANTIES OF THE OWNER
2.1 **Title and Ownership:** The Owner warrants and guarantees that they are the absolute registered owner of the vehicle or possess full and unencumbered legal authority, power of attorney, or statutory authorization from the registered owner to enter into this Agreement and lease the vehicle to the Company.
2.2 **Freedom from Encumbrances:** The Owner warrants that the vehicle is free from any undisclosed liens, pledges, court attachments, judicial confiscations, sequestration orders, or ownership disputes that could hinder, impede, or disturb the peaceful commercial possession and operational use of the vehicle by the Company.
2.3 **Roadworthiness:** The Owner warrants that the vehicle is mechanically sound, roadworthy, clean, and in safe operating condition at the time of handover, conforming to all statutory motor traffic safety regulations in Sri Lanka.

### 3. OBLIGATIONS AND RIGHTS OF THE OWNER
3.1 **Comprehensive Insurance:** The Owner shall ensure that the vehicle maintains throughout the Term a valid, comprehensive motor insurance policy issued by an authorized insurer in Sri Lanka, explicitly endorsed to cover commercial passenger transport, tourist hiring, and third-party liabilities.
3.2 **Scheduled Routine Servicing:** The Owner shall bear the entire financial cost of routine periodic servicing, engine oil replacements, filter replacements, and standard manufacturer-prescribed maintenance required at every **{{service_km}} Km** service interval.
3.3 **Major Mechanical Repairs & Consumables:** The Owner shall be exclusively responsible for fair wear-and-tear mechanical repairs, replacements of the vehicle battery, tires, gearbox, transmission, cooling systems, and major engine repairs not resulting from direct driver abuse, collision negligence, or gross misconduct by Company personnel.
3.4 **Breakdown Transport & Recovery:** In the event of a mechanical or electrical failure arising from pre-existing mechanical wear or inherent component failure, the Owner shall promptly bear all vehicle carrier, flatbed transport, and towing expenses incurred in transporting the vehicle to an authorized service station.
3.5 **Strict Non-Contact & Non-Interference Covenant:** The Owner unequivocally covenants that neither the Owner, nor any of their agents, relatives, employees, or associates, shall at any time during or immediately following the rental period directly or indirectly contact, solicit, communicate with, negotiate with, or interfere with any tourist, guest, corporate client, or customer utilizing the vehicle. Any breach of this covenant constitutes a fundamental breach of contract, entitling the Company to immediate termination and full compensation for commercial damages.
3.6 **Fuel & Service Mileage:** The fuel level upon final return of the vehicle to the Owner shall match the fuel level documented at the time of handover. Mileage traveled solely for the purpose of routine servicing or repairs mandated by the Owner shall be excluded from the Company's monthly quota calculation.
3.7 **Statutory Documents:** The Owner shall timely renew and maintain the vehicle's annual Revenue License, Vehicle Emission Test Certificate, and Fitness Certificate at their own cost.
3.8 **GPS Telematics & Fleet Monitoring:** The Owner grants express consent to the Company to install, maintain, and monitor GPS tracking devices, telematics sensors, and security equipment on the vehicle.

### 4. OBLIGATIONS AND RIGHTS OF THENNAKOON TOURS (THE COMPANY)
4.1 **Commercial Operations:** The Company shall utilize the vehicle for lawful tourist transportation, corporate hire, self-drive, and chauffeur-driven rental operations within the geographical territory of Sri Lanka.
4.2 **Monthly Mileage Quota & Excess Tracking:** The Company agrees to a standard monthly mileage quota of **{{monthly_km_quota}} Km** per billing month. Any cumulative mileage exceeding this quota shall be recorded and remitted to the Owner at the agreed excess rate of **Rs. {{excess_km_rate}}/= per Km**.
4.3 **Branding & Accessories:** The Company shall have the right to affix removable magnetic decals, corporate logos, and operational accessories necessary for tourism transport operations.
4.4 **Force Majeure & Operational Disruption:** In the event of island-wide curfews, natural disasters, pandemics, civil unrest, or state-mandated travel restrictions that halt commercial tourism, the agreed monthly rental shall be prorated strictly according to the actual operational days in that billing cycle.
4.5 **Qualified Drivers:** The Company covenants that the vehicle shall be operated only by experienced drivers possessing valid Sri Lankan driving licenses and proper commercial certifications.
4.6 **Service Coordination:** The Company shall diligently monitor odometer intervals and coordinate preventative maintenance every **{{service_km}} Km** on behalf of the Owner.
4.7 **Vehicle Return:** Upon the expiration or lawful termination of this Agreement, the Company shall return the vehicle to the Owner in good operational condition, normal wear and tear excepted.

### 5. PAYMENT TERMS & BANK REMITTANCE
5.1 **Agreed Monthly Rental:** The Company agrees to pay the Owner an agreed monthly rental of **Rs. {{monthly_rental}}/-** for the vehicle.
5.2 **Settlement Date:** The monthly rental shall be paid on or before the **{{payment_day}}** of each calendar month for the preceding operational period.
5.3 **Designated Bank Account:** All monthly rental payments and excess mileage settlements shall be remitted via direct bank transfer to the Owner's nominated bank account specified below:
- **Account Holder Name:** {{bank_account_name}}
- **Bank Name:** {{bank_name}}
- **Branch:** {{bank_branch}}
- **Account Number:** {{bank_account_no}}
5.4 **Excess Mileage Settlement:** Any excess mileage over **{{monthly_km_quota}} Km** during the calendar month shall be settled at **Rs. {{excess_km_rate}}/= per Km** and included with the monthly payout.
5.5 **Deductions for Off-Road Downtime:** If the vehicle is immobilized due to unresolved mechanical breakdown, delayed parts authorization by the Owner, or expired statutory documents, the daily pro-rata rental for each day the vehicle remains off-road shall be deducted from the monthly rental payout.
5.6 **Renewal Processing Charge:** A document processing charge of **Rs. {{renewal_charge}}/-** shall be deducted upon mutual renewal or extension of this Agreement.

### 6. TERMINATION
6.1 **Notice of Termination:** Either Party may terminate this Agreement without cause by serving **30 days'** prior written notice to the other Party.
6.2 **Immediate Termination:** The Company shall be entitled to terminate this Agreement forthwith without penalty if the vehicle is seized or encumbered, if the Owner breaches the non-contact covenant in Clause 3.5, or if the Owner fails to maintain valid comprehensive commercial insurance.
6.3 **Final Settlement:** Upon termination, the Company shall return the vehicle to the Owner and settle all dues up to the date of physical handover, less any authorized deductions.

### 7. INDEMNITY & LIABILITY
7.1 **Owner Indemnity:** The Owner agrees to defend, indemnify, and hold harmless the Company, its directors, and employees from and against any third-party claims, fines, or losses resulting from pre-existing mechanical defects, title defects, or statutory non-compliance existing prior to handover.
7.2 **Company Indemnity:** The Company shall indemnify the Owner against direct liabilities or penalties arising directly from gross negligence, reckless driving, or willful misconduct of Company-appointed drivers during the active operational custody of the vehicle.

### 8. RELATIONSHIP OF PARTIES
This Agreement is established on a commercial hiring basis. Nothing contained herein shall be deemed or construed to create a partnership, joint venture, agency, or employer-employee relationship between the Parties.

### 9. MISCELLANEOUS & GOVERNING LAW
9.1 **Notices:** All formal notices shall be sent by registered post or electronic mail to the addresses stated in the preamble hereof. Notice to the Company shall be copied to thennakoontours2023@gmail.com.
9.2 **Entire Agreement:** This Agreement, together with the Schedule hereto and any written amendments executed by both Parties, constitutes the complete and exclusive agreement between the Parties.
9.3 **Severability:** If any provision of this Agreement is held invalid or unenforceable, the remaining provisions shall remain in full force and effect.
9.4 **Governing Law:** This Agreement shall be governed by, construed, and enforced in accordance with the Laws of the Democratic Socialist Republic of Sri Lanka. Any legal disputes arising hereunder shall be subject to the exclusive jurisdiction of the competent courts of Colombo, Sri Lanka.

### THE SCHEDULE (PARTICULARS OF THE MOTOR VEHICLE)
- **Make and Model:** {{vehicle_model}}
- **Vehicle Registration Number:** {{vehicle_reg_no}}
- **Chassis Number:** {{chassis_no}}
- **Engine Number:** {{engine_no}}
- **Agreed Monthly Rental:** Rs. {{monthly_rental}}/- per month
- **Monthly Mileage Quota:** {{monthly_km_quota}} Km
- **Excess Mileage Rate:** Rs. {{excess_km_rate}}/= per Km
- **Service Interval:** Every {{service_km}} Km

### 10. SPECIAL REMARKS & SPECIFIC COVENANTS
{{special_remarks}}

### SIGNATORIES & WITNESSES
**For and on behalf of THENNAKOON TOURS (PVT) LTD:**
- Authorized Signatory: {{company_rep_name}} ({{company_rep_designation}})
- NIC: {{company_rep_nic}}
- Company Witness: {{company_witness_name}} (NIC: {{company_witness_nic}})

**Signed by the VEHICLE OWNER:**
- Owner Name: {{owner_name}} (NIC: {{owner_nic}})
- Owner Witness: {{owner_witness_name}} (NIC: {{owner_witness_nic}})
- Witness Address: {{owner_witness_address}}
- Witness Contact: {{owner_witness_phone}}`

export const DEFAULT_USER_AGREEMENT_TEMPLATE_BODY = `# VEHICLE RENTAL AGREEMENT

**Agreement No:** {{agreement_number}}

**Thennakoon Tours (Pvt) Ltd** bearing registration No **PV00312253** Having its Principal Business Place at No. 146/5A, Dutugamunu Street, Caldera Gardens, Kohuwala (hereinafter referred to as **"The Lessor"** which term or expression shall where the context so requires or admits be taken to mean and include the said Thennakoon Tours (Pvt) Ltd and its heirs, executors and administrators of the First Part and **{{lessee_name}}** holding NIC/Passport No **{{lessee_nic}}** residing at **{{lessee_address}}** (Phone: **{{lessee_phone}}**) (hereinafter referred to as **"The Lessee"** which term or expression shall where the context so requires or admits be taken to mean and include the said Lessee and its Successors in Office and assigns) of the Second Part.

**Whereas** the Lessee is desirous of hiring from The Lessor a motor car belonging to The Lessor and described in the Schedule to this agreement (hereinafter referred to as **"The Vehicle"** — **{{vehicle_model}}**, Reg No: **{{vehicle_reg_no}}**) and Lessor has agreed with the Lessee to hire the Vehicle to the Lessee subject to and upon the terms and conditions hereinafter set forth.

**Now it is hereby agreed between The Lessor and The Lessee as follows:**

### 1. HIRE OF VEHICLE
Subject to and upon the terms and conditions contained in this Agreement the Lessor shall provide The Vehicle to The Lessee on hire and The Lessee can use the vehicle as from **{{rental_start}}** and during the entirety of the definite period of **{{rental_period}}** expiring on **{{rental_end}}** (hereinafter referred to as **"The Period"**).

### 2. RENTAL AND OTHER CHARGES
(a) The Lessee shall pay the agreed rental of **Rs. {{monthly_rental}}** on or before the agreed due date during the lease Period. Total rental payable for the period is **Rs. {{total_rental}}**. Further Lessor agrees to undertake vehicle service and bear standard routine maintenance charges during the lease period.
(b) Minor repairs up to Rs. 13,500/-, puncture repairs, tire care, and daily fluid top-ups (coolant, brake fluid) are the responsibility of the Lessee.
(c) The allowed mileage is **{{km_limit}} Km**. Any excess mileage over the allowed limit will be charged at **Rs. {{excess_km_rate}}/= per Km**.
(d) **Security Deposit:** A refundable security deposit of **Rs. {{deposit_amount}}** is deposited by the Lessee and held to defray costs of damages, unpaid fines, or rental defaults.

### 3. LICENSE AND INSURANCE
(a) The Lessor shall keep The Vehicle licensed and comprehensively insured during The Period.
(b) The Lessee is responsible for insurance policy excess amounts (Rs. 15,000/- per claim) and any damages below the minor claim threshold.

### 4. MAINTENANCE & CARE
(a) The Lessee shall keep and maintain The Vehicle in good order and sound working condition.
(b) The Lessee shall perform routine daily maintenance checks (oil, coolant, tires, correct fuel type).
(c) In case of accident or damage, the Lessee shall immediately notify the Lessor and secure necessary police reports.

### 5. AUTHORIZED DRIVERS & USE
(a) The vehicle shall only be driven by authorized, duly licensed nominated drivers.
(b) The vehicle shall not be used for illegal purposes, sub-hiring, racing, or carrying prohibited goods.

### 6. SPECIAL CONDITIONS & REMARKS
{{special_notes}}

### SIGNATORIES
**For and on behalf of THENNAKOON TOURS (PVT) LTD:**
- Representative: {{company_rep_name}} ({{company_rep_designation}})

**Signed by THE LESSEE:**
- Lessee Name: {{lessee_name}}
- NIC/Passport: {{lessee_nic}}`

/**
 * Replaces {{merge_tags}} case-insensitively with variables.
 * Missing or empty variables default cleanly to '—' or empty string.
 */
export function renderAgreementTemplate(
  templateBody: string,
  variables: Record<string, string | number | null | undefined>
): string {
  if (!templateBody) return ''

  // Build a normalized lookup map (lowercase keys without braces)
  const normalizedMap: Record<string, string> = {}
  for (const [key, val] of Object.entries(variables)) {
    const cleanKey = key.replace(/[{}]/g, '').trim().toLowerCase()
    normalizedMap[cleanKey] = val !== null && val !== undefined && String(val).trim() !== '' ? String(val) : '—'
  }

  // Regex matches {{tag}} or {{ tag }}
  return templateBody.replace(/{{\s*([a-zA-Z0-9_-]+)\s*}}/g, (_match, rawKey) => {
    const key = rawKey.toLowerCase()
    if (key in normalizedMap) {
      return normalizedMap[key]
    }
    // Clean default for unpopulated tags rather than leaving raw brackets
    return '—'
  })
}
