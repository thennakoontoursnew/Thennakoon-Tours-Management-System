import { renderAgreementTemplate } from './template-renderer'

export interface AgreementSection {
  id: string
  order: number
  title: string
  body: string
  is_schedule?: boolean
  is_signatories?: boolean
}

export const DEFAULT_OWNER_AGREEMENT_SECTIONS: AgreementSection[] = [
  {
    id: 'sec_owner_preamble',
    order: 1,
    title: 'PARTIES & PREAMBLE',
    body: `This VEHICLE RENTAL AGREEMENT (hereinafter referred to as the "Agreement") is made and entered into on this {{agreement_date}} by and between:

1. THENNAKOON TOURS (PRIVATE) LIMITED, a company duly incorporated and operating under the laws of the Democratic Socialist Republic of Sri Lanka, bearing Company Registration Number PV 00312253, and having its registered office at No. 146/5A, Dutugamunu Street, Caldera Gardens, Kohuwala, Sri Lanka (hereinafter referred to as the "Company" or "Thennakoon Tours", which term shall where the context so requires or admits include its successors-in-title and permitted assigns) of the FIRST PART; and

2. {{owner_name}}, holding National Identity Card / Passport Number {{owner_nic}}, and residing at {{owner_address}} (hereinafter referred to as the "Owner", which term shall where the context so requires or admits include their heirs, executors, administrators, and permitted assigns) of the SECOND PART.

(The Company and the Owner are hereinafter collectively referred to as the "Parties" and individually as a "Party".)

WHEREAS the Owner is the absolute, registered, and lawful owner of the passenger motor vehicle morefully described in the Schedule hereunder written;

AND WHEREAS the Company operates a tourist transport, corporate vehicle rental, and passenger fleet service in Sri Lanka and has agreed to take on commercial hire the said motor vehicle from the Owner on the terms, covenants, and conditions hereinafter set forth;

NOW THEREFORE IT IS MUTUALLY AGREED BY AND BETWEEN THE PARTIES AS FOLLOWS:`,
  },
  {
    id: 'sec_owner_term',
    order: 2,
    title: '1. TERM & COMMENCEMENT',
    body: `1.1 Handover: The Owner hereby hands over physical possession and commercial custody of the motor vehicle described in the Schedule hereunder to the Company on {{handover_date}} (the "Handover Date").

1.2 Duration: This Agreement shall be effective for an agreed fixed term of {{term_duration}}, commencing from {{start_date}} and expiring on {{end_date}} (the "Term"), unless terminated earlier in strict compliance with the provisions of Clause 6 herein.

1.3 Renewal & Precedence: This Agreement constitutes the primary legal contract governing the commercial lease of the vehicle. The Parties may mutually renew or extend this Agreement prior to the expiration of the Term upon written mutual agreement, subject to an administrative and document preparation fee of Rs. {{renewal_charge}}/- payable upon each renewal.`,
  },
  {
    id: 'sec_owner_warranties',
    order: 3,
    title: '2. REPRESENTATIONS AND WARRANTIES OF THE OWNER',
    body: `2.1 Title and Ownership: The Owner warrants and guarantees that they are the absolute registered owner of the vehicle or possess full and unencumbered legal authority, power of attorney, or statutory authorization from the registered owner to enter into this Agreement and lease the vehicle to the Company.

2.2 Freedom from Encumbrances: The Owner warrants that the vehicle is free from any undisclosed liens, pledges, court attachments, judicial confiscations, sequestration orders, or ownership disputes that could hinder, impede, or disturb the peaceful commercial possession and operational use of the vehicle by the Company.

2.3 Roadworthiness: The Owner warrants that the vehicle is mechanically sound, roadworthy, clean, and in safe operating condition at the time of handover, conforming to all statutory motor traffic safety regulations in Sri Lanka.`,
  },
  {
    id: 'sec_owner_owner_obligations',
    order: 4,
    title: '3. OBLIGATIONS AND RIGHTS OF THE OWNER',
    body: `3.1 Comprehensive Insurance: The Owner shall ensure that the vehicle maintains throughout the Term a valid, comprehensive motor insurance policy issued by an authorized insurer in Sri Lanka, explicitly endorsed to cover commercial passenger transport, tourist hiring, and third-party liabilities.

3.2 Scheduled Routine Servicing: The Owner shall bear the entire financial cost of routine periodic servicing, engine oil replacements, filter replacements, and standard manufacturer-prescribed maintenance required at every {{service_km}} Km service interval.

3.3 Major Mechanical Repairs & Consumables: The Owner shall be exclusively responsible for fair wear-and-tear mechanical repairs, replacements of the vehicle battery, tires, gearbox, transmission, cooling systems, and major engine repairs not resulting from direct driver abuse, collision negligence, or gross misconduct by Company personnel.

3.4 Breakdown Transport & Recovery: In the event of a mechanical or electrical failure arising from pre-existing mechanical wear or inherent component failure, the Owner shall promptly bear all vehicle carrier, flatbed transport, and towing expenses incurred in transporting the vehicle to an authorized service station.

3.5 Strict Non-Contact & Non-Interference Covenant: The Owner unequivocally covenants that neither the Owner, nor any of their agents, relatives, employees, or associates, shall at any time during or immediately following the rental period directly or indirectly contact, solicit, communicate with, negotiate with, or interfere with any tourist, guest, corporate client, or customer utilizing the vehicle. Any breach of this covenant constitutes a fundamental breach of contract, entitling the Company to immediate termination and full compensation for commercial damages.

3.6 Fuel & Service Mileage: The fuel level upon final return of the vehicle to the Owner shall match the fuel level documented at the time of handover. Mileage traveled solely for the purpose of routine servicing or repairs mandated by the Owner shall be excluded from the Company's monthly quota calculation.

3.7 Statutory Documents: The Owner shall timely renew and maintain the vehicle's annual Revenue License, Vehicle Emission Test Certificate, and Fitness Certificate at their own cost.

3.8 GPS Telematics & Fleet Monitoring: The Owner grants express consent to the Company to install, maintain, and monitor GPS tracking devices, telematics sensors, and security equipment on the vehicle.`,
  },
  {
    id: 'sec_owner_company_obligations',
    order: 5,
    title: '4. OBLIGATIONS AND RIGHTS OF THENNAKOON TOURS (THE COMPANY)',
    body: `4.1 Commercial Operations: The Company shall utilize the vehicle for lawful tourist transportation, corporate hire, self-drive, and chauffeur-driven rental operations within the geographical territory of Sri Lanka.

4.2 Monthly Mileage Quota & Excess Tracking: The Company agrees to a standard monthly mileage quota of {{monthly_km_quota}} Km per billing month. Any cumulative mileage exceeding this quota shall be recorded and remitted to the Owner at the agreed excess rate of Rs. {{excess_km_rate}}/= per Km.

4.3 Branding & Accessories: The Company shall have the right to affix removable magnetic decals, corporate logos, and operational accessories necessary for tourism transport operations.

4.4 Force Majeure & Operational Disruption: In the event of island-wide curfews, natural disasters, pandemics, civil unrest, or state-mandated travel restrictions that halt commercial tourism, the agreed monthly rental shall be prorated strictly according to the actual operational days in that billing cycle.

4.5 Qualified Drivers: The Company covenants that the vehicle shall be operated only by experienced drivers possessing valid Sri Lankan driving licenses and proper commercial certifications.

4.6 Service Coordination: The Company shall diligently monitor odometer intervals and coordinate preventative maintenance every {{service_km}} Km on behalf of the Owner.

4.7 Vehicle Return: Upon the expiration or lawful termination of this Agreement, the Company shall return the vehicle to the Owner in good operational condition, normal wear and tear excepted.`,
  },
  {
    id: 'sec_owner_payments',
    order: 6,
    title: '5. PAYMENT TERMS & BANK REMITTANCE',
    body: `5.1 Agreed Monthly Rental: The Company agrees to pay the Owner an agreed monthly rental of Rs. {{monthly_rental}}/- for the vehicle.

5.2 Settlement Date: The monthly rental shall be paid on or before the {{payment_day}} of each calendar month for the preceding operational period.

5.3 Designated Bank Account: All monthly rental payments and excess mileage settlements shall be remitted via direct bank transfer to the Owner's nominated bank account specified below:
- Account Holder Name: {{bank_account_name}}
- Bank Name: {{bank_name}}
- Branch: {{bank_branch}}
- Account Number: {{bank_account_no}}

5.4 Excess Mileage Settlement: Any excess mileage over {{monthly_km_quota}} Km during the calendar month shall be settled at Rs. {{excess_km_rate}}/= per Km and included with the monthly payout.

5.5 Deductions for Off-Road Downtime: If the vehicle is immobilized due to unresolved mechanical breakdown, delayed parts authorization by the Owner, or expired statutory documents, the daily pro-rata rental for each day the vehicle remains off-road shall be deducted from the monthly rental payout.

5.6 Renewal Processing Charge: A document processing charge of Rs. {{renewal_charge}}/- shall be deducted upon mutual renewal or extension of this Agreement.`,
  },
  {
    id: 'sec_owner_termination',
    order: 7,
    title: '6. TERMINATION',
    body: `6.1 Notice of Termination: Either Party may terminate this Agreement without cause by serving 30 days' prior written notice to the other Party.

6.2 Immediate Termination: The Company shall be entitled to terminate this Agreement forthwith without penalty if the vehicle is seized or encumbered, if the Owner breaches the non-contact covenant in Clause 3.5, or if the Owner fails to maintain valid comprehensive commercial insurance.

6.3 Final Settlement: Upon termination, the Company shall return the vehicle to the Owner and settle all dues up to the date of physical handover, less any authorized deductions.`,
  },
  {
    id: 'sec_owner_indemnity',
    order: 8,
    title: '7. INDEMNITY & LIABILITY',
    body: `7.1 Owner Indemnity: The Owner agrees to defend, indemnify, and hold harmless the Company, its directors, and employees from and against any third-party claims, fines, or losses resulting from pre-existing mechanical defects, title defects, or statutory non-compliance existing prior to handover.

7.2 Company Indemnity: The Company shall indemnify the Owner against direct liabilities or penalties arising directly from gross negligence, reckless driving, or willful misconduct of Company-appointed drivers during the active operational custody of the vehicle.`,
  },
  {
    id: 'sec_owner_relationship',
    order: 9,
    title: '8. RELATIONSHIP OF PARTIES',
    body: `This Agreement is established on a commercial hiring basis. Nothing contained herein shall be deemed or construed to create a partnership, joint venture, agency, or employer-employee relationship between the Parties.`,
  },
  {
    id: 'sec_owner_miscellaneous',
    order: 10,
    title: '9. MISCELLANEOUS & GOVERNING LAW',
    body: `9.1 Notices: All formal notices shall be sent by registered post or electronic mail to the addresses stated in the preamble hereof. Notice to the Company shall be copied to thennakoontours2023@gmail.com.

9.2 Entire Agreement: This Agreement, together with the Schedule hereto and any written amendments executed by both Parties, constitutes the complete and exclusive agreement between the Parties.

9.3 Severability: If any provision of this Agreement is held invalid or unenforceable, the remaining provisions shall remain in full force and effect.

9.4 Governing Law: This Agreement shall be governed by, construed, and enforced in accordance with the Laws of the Democratic Socialist Republic of Sri Lanka. Any legal disputes arising hereunder shall be subject to the exclusive jurisdiction of the competent courts of Colombo, Sri Lanka.`,
  },
  {
    id: 'sec_owner_schedule',
    order: 11,
    title: 'THE SCHEDULE (PARTICULARS OF THE MOTOR VEHICLE)',
    is_schedule: true,
    body: `- Make and Model: {{vehicle_model}}
- Vehicle Registration Number: {{vehicle_reg_no}}
- Chassis Number: {{chassis_no}}
- Engine Number: {{engine_no}}
- Agreed Monthly Rental: Rs. {{monthly_rental}}/- per month
- Monthly Mileage Quota: {{monthly_km_quota}} Km
- Excess Mileage Rate: Rs. {{excess_km_rate}}/= per Km
- Routine Service Interval: Every {{service_km}} Km (Cost borne by Vehicle Owner)`,
  },
  {
    id: 'sec_owner_remarks',
    order: 12,
    title: '10. SPECIAL REMARKS & SPECIFIC COVENANTS',
    body: `{{special_remarks}}`,
  },
  {
    id: 'sec_owner_signatories',
    order: 13,
    title: 'SIGNATORIES & WITNESSES',
    is_signatories: true,
    body: `For and on behalf of THENNAKOON TOURS (PVT) LTD:
- Authorized Signatory: {{company_rep_name}} ({{company_rep_designation}})
- NIC: {{company_rep_nic}}
- Company Witness: {{company_witness_name}} (NIC: {{company_witness_nic}})

Signed by the VEHICLE OWNER:
- Owner Name: {{owner_name}} (NIC: {{owner_nic}})
- Owner Witness: {{owner_witness_name}} (NIC: {{owner_witness_nic}})
- Witness Address: {{owner_witness_address}}
- Witness Contact: {{owner_witness_phone}}`,
  },
]

export const DEFAULT_USER_AGREEMENT_SECTIONS: AgreementSection[] = [
  {
    id: 'sec_user_preamble',
    order: 1,
    title: 'PARTIES & PREAMBLE',
    body: `Agreement No: {{agreement_number}}

VEHICLE RENTAL AGREEMENT

Thennakoon Tours (Pvt) Ltd bearing registration No PV00312253 Having its Principal Business Place at No. 146/5A, Dutugamunu Street, Caldera Gardens, Kohuwala (hereinafter referred to as "The Lessor" which term or expression shall where the context so requires or admits be taken to mean and include the said Thennakoon Tours (Pvt) Ltd and its heirs, executors and administrators of the First Part and {{lessee_name}} holding NIC/Passport No {{lessee_nic}} residing at {{lessee_address}} (Phone: {{lessee_phone}}) (hereinafter referred to as "The Lessee" which term or expression shall where the context so requires or admits be taken to mean and include the said Lessee and its Successors in Office and assigns) of the Second Part.

Whereas the Lessee is desirous of hiring from The Lessor a motor car belonging to The Lessor and described in the Schedule to this agreement (hereinafter referred to as "The Vehicle" — {{vehicle_model}}, Reg No: {{vehicle_reg_no}}) and Lessor has agreed with the Lessee to hire the Vehicle to the Lessee subject to and upon the terms and conditions hereinafter set forth.

Now it is hereby agreed between The Lessor and The Lessee as follows:`,
  },
  {
    id: 'sec_user_hire',
    order: 2,
    title: '1. HIRE OF VEHICLE',
    body: `Subject to and upon the terms and conditions contained in this Agreement the Lessor shall provide The Vehicle to The Lessee on hire and The Lessee can use the vehicle as from {{rental_start}} and during the entirety of the definite period of {{rental_period}} expiring on {{rental_end}} (hereinafter referred to as "The Period").`,
  },
  {
    id: 'sec_user_charges',
    order: 3,
    title: '2. RENTAL AND OTHER CHARGES',
    body: `(a) The Lessee shall pay the agreed rental of Rs. {{monthly_rental}} on or before the agreed due date during the lease Period. Total rental payable for the period is Rs. {{total_rental}}. Further Lessor agrees to undertake vehicle service and bear standard routine maintenance charges during the lease period.

(b) Minor repairs up to Rs. 13,500/-, puncture repairs, tire care, and daily fluid top-ups (coolant, brake fluid) are the responsibility of the Lessee.

(c) The allowed mileage is {{km_limit}} Km. Any excess mileage over the allowed limit will be charged at Rs. {{excess_km_rate}}/= per Km.

(d) Security Deposit: A refundable security deposit of Rs. {{deposit_amount}} is deposited by the Lessee and held to defray costs of damages, unpaid fines, or rental defaults.`,
  },
  {
    id: 'sec_user_insurance',
    order: 4,
    title: '3. LICENSE AND INSURANCE',
    body: `(a) The Lessor shall keep The Vehicle licensed and comprehensively insured during The Period.

(b) The Lessee is responsible for insurance policy excess amounts (Rs. 15,000/- per claim) and any damages below the minor claim threshold.`,
  },
  {
    id: 'sec_user_maintenance',
    order: 5,
    title: '4. MAINTENANCE & CARE',
    body: `(a) The Lessee shall keep and maintain The Vehicle in good order and sound working condition.

(b) The Lessee shall perform routine daily maintenance checks (oil, coolant, tires, correct fuel type).

(c) In case of accident or damage, the Lessee shall immediately notify the Lessor and secure necessary police reports.`,
  },
  {
    id: 'sec_user_drivers',
    order: 6,
    title: '5. AUTHORIZED DRIVERS & USE',
    body: `(a) The vehicle shall only be driven by authorized, duly licensed nominated drivers.

(b) The vehicle shall not be used for illegal purposes, sub-hiring, racing, or carrying prohibited goods.`,
  },
  {
    id: 'sec_user_special',
    order: 7,
    title: '6. SPECIAL CONDITIONS & REMARKS',
    body: `{{special_notes}}`,
  },
  {
    id: 'sec_user_signatories',
    order: 8,
    title: 'SIGNATORIES',
    is_signatories: true,
    body: `For and on behalf of THENNAKOON TOURS (PVT) LTD:
- Representative: {{company_rep_name}} ({{company_rep_designation}})

Signed by THE LESSEE:
- Lessee Name: {{lessee_name}}
- NIC/Passport: {{lessee_nic}}`,
  },
]

/**
 * Resolves an array of section cards with live variables.
 * Iterates through each section, replaces merge tags in title & body.
 */
export function resolveAgreementSections(
  sections: AgreementSection[],
  variables: Record<string, any>
): AgreementSection[] {
  if (!sections || !Array.isArray(sections)) return []

  return sections.map((sec, idx) => ({
    ...sec,
    order: idx + 1,
    title: renderAgreementTemplate(sec.title || '', variables),
    body: renderAgreementTemplate(sec.body || '', variables),
  }))
}

/**
 * Converts an array of section cards into a unified markdown legal document.
 */
export function sectionsToMarkdown(sections: AgreementSection[]): string {
  if (!sections || !Array.isArray(sections)) return ''

  return sections
    .map((sec) => {
      const title = sec.title ? `### ${sec.title}` : ''
      return [title, sec.body].filter(Boolean).join('\n\n')
    })
    .join('\n\n')
}
