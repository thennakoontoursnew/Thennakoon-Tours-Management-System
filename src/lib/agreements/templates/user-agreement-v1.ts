// Official User Agreement Legal Template V1
// Authoritative legal text file for Thennakoon Tours (Pvt) Ltd Vehicle Rental Agreement
// NON-NEGOTIABLE RULE: DO NOT rewrite, simplify, summarize, correct, paraphrase, modernize or remove legal clauses.

export const USER_AGREEMENT_VERSION = 'USER_AGREEMENT_V1'

export interface LegalClause {
  number: string
  title: string
  content: string
}

export const USER_AGREEMENT_PREAMBLE = `THIS VEHICLE RENTAL AGREEMENT is entered into on {{AGREEMENT_DATE}} at {{AGREEMENT_LOCATION}} by and between:

LESSOR: THENNAKOON TOURS (PVT) LTD, a company duly incorporated under the laws of Sri Lanka, bearing Registration No. PV-00249821, having its principal office at 39 A, 1st Cross Street, Pagoda Road, Nugegoda, Sri Lanka (hereinafter referred to as the "Lessor", which term shall where the context so requires or admits include its successors and assigns);

AND

LESSEE: {{LESSEE_FULL_NAME}}, {{LESSEE_IDENTIFIER_TYPE}} No. {{LESSEE_IDENTIFIER_NO}}, residing at / having registered address at {{LESSEE_ADDRESS}}, Mobile: {{LESSEE_MOBILE}}, Email: {{LESSEE_EMAIL}} (hereinafter referred to as the "Lessee", which term shall where the context so requires or admits include his/her/its heirs, executors, administrators, legal representatives, successors and permitted assigns).`

export const USER_AGREEMENT_CLAUSES: LegalClause[] = [
  {
    number: '1',
    title: 'HIRE OF VEHICLE',
    content: `1.1 The Lessor agrees to let and the Lessee agrees to hire the Motor Vehicle described in the Schedule hereto (hereinafter referred to as the "Vehicle") for the rental period specified in the Schedule, subject to the terms and conditions set out in this Agreement.
1.2 The Lessee acknowledges that the Vehicle is the absolute property of the Lessor and that the Lessee shall acquire no right, title, or interest in or to the Vehicle other than as a temporary hirer pursuant to this Agreement.`,
  },
  {
    number: '2',
    title: 'RENTAL AND OTHER CHARGES',
    content: `2.1 The Lessee shall pay to the Lessor the rental charges, security deposit, advance payment, and all other applicable fees specified in the Schedule hereto in accordance with the payment schedule agreed upon.
2.2 If the Vehicle is used beyond the agreed mileage limit specified in the Schedule, the Lessee shall pay an excess mileage charge at the rate of LKR {{EXTRA_KM_RATE}} per additional kilometer.
2.3 The security deposit of LKR {{SECURITY_DEPOSIT}} shall be held by the Lessor as security for the due performance of the Lessee's obligations hereunder. The Lessor shall be entitled to deduct from the security deposit any unpaid rental charges, excess mileage charges, traffic fines, damage costs, cleaning fees, or other liabilities incurred by the Lessee. The balance, if any, shall be refunded to the Lessee within {{SECURITY_DEPOSIT_HOLD_DAYS}} days after the safe return of the Vehicle.
2.4 All payments shall be made into the Lessor's designated bank account: {{COMPANY_BANK_DETAILS}} or by official payment methods authorized by the Lessor.`,
  },
  {
    number: '3',
    title: 'LICENSE AND INSURANCE',
    content: `3.1 The Lessee warrants that the Lessee and any Nominated Driver listed in the Schedule holds a valid Sri Lankan Driving License or International Driving Permit recognized under Sri Lankan law for the class of vehicle hired.
3.2 The Vehicle is insured under a Comprehensive Motor Insurance Policy. In the event of any damage, accident, loss, or theft involving the Vehicle, the Lessee shall be liable for the insurance excess deductible amount of LKR {{INSURANCE_EXCESS}} per incident.
3.3 The insurance policy shall become void and the Lessee shall be fully liable for all loss, damage, legal costs, and third-party claims if the Vehicle is driven by an unnominated driver, driven under the influence of alcohol or drugs, driven off-road or illegally, or used in breach of any provision of this Agreement.`,
  },
  {
    number: '4',
    title: 'MAINTENANCE',
    content: `4.1 The Lessor shall provide the Vehicle in a roadworthy condition with routine engine oil and major mechanical servicing maintained by the Lessor.
4.2 The Lessee shall regularly check and maintain engine oil levels, coolant levels, tire pressure, and brake fluid during the rental period.
4.3 Any minor emergency repairs below LKR {{MINOR_REPAIR_LIMIT}} may be undertaken by the Lessee only with prior verbal or written confirmation from the Lessor. Major repairs must be performed strictly by authorized service workshops appointed by the Lessor.`,
  },
  {
    number: '5',
    title: 'USE OF VEHICLE',
    content: `5.1 The Lessee agrees that the Vehicle shall be used solely for lawful private or business travel within the geographical boundaries of Sri Lanka.
5.2 The Lessee shall NOT:
    (a) Use or permit the Vehicle to be used for any illegal, unlawful, or immoral purpose;
    (b) Sub-let, re-hire, assign, pledge, mortgage, or transfer the Vehicle to any third party;
    (c) Use the Vehicle for racing, speed testing, rally driving, towing, or off-road driving;
    (d) Transport contraband, hazardous materials, explosives, or illegal substances;
    (e) Allow any person other than the Lessee or Nominated Drivers listed in the Schedule to operate the Vehicle;
    (f) Smoke, consume alcohol, or carry pets inside the Vehicle without explicit written permission. A professional interior cleaning charge of LKR {{FULL_INTERIOR_CLEANING_FEE}} shall apply if this clause is breached.`,
  },
  {
    number: '6',
    title: 'EXCLUSION OF LIABILITY',
    content: `6.1 The Lessor shall not be liable to the Lessee or any passenger or third party for any direct, indirect, incidental, or consequential loss, injury, death, damage, or delay arising out of the mechanical breakdown, accident, failure, or use of the Vehicle during the rental period.
6.2 The Lessee accepts full personal liability for all traffic violations, speeding tickets, parking fines, highway toll charges, and police fines incurred during the rental period.`,
  },
  {
    number: '7',
    title: 'EXCLUSION OF WARRANTIES',
    content: `7.1 Except as expressly stated herein, all warranties, conditions, or representations, express or implied, statutory or otherwise, regarding the condition, quality, merchantability, or fitness for any particular purpose of the Vehicle are hereby excluded to the fullest extent permitted by law.`,
  },
  {
    number: '8',
    title: 'ASSIGNMENT',
    content: `8.1 The Lessee shall not assign, transfer, encumber, or delegate any of his/her/its rights or obligations under this Agreement to any other party without the prior written consent of the Lessor.
8.2 The Lessor may at any time assign or transfer its rights and benefits under this Agreement or grant a security interest over the Vehicle to any bank or financial institution.`,
  },
  {
    number: '9',
    title: 'DEFAULT AND TERMINATION',
    content: `9.1 The Lessor shall be entitled to terminate this Agreement immediately without prior notice and repossess the Vehicle wherever situated if:
    (a) The Lessee fails to pay any rental charge or sum due hereunder on the due date;
    (b) The Lessee breaches any term, condition, or covenant of this Agreement;
    (c) The Lessee becomes insolvent, bankrupt, or enters into liquidation;
    (d) The Vehicle is seized, confiscated, impounded, or threatened with police arrest due to the Lessee's actions;
    (e) The Lessee provides false, misleading, or fraudulent identification details.
9.2 Upon termination under Clause 9.1, all unpaid charges for the remaining rental period shall immediately become due and payable, and the Lessor shall have the right to enter any premises to repossess the Vehicle without legal process or court order.`,
  },
  {
    number: '10',
    title: 'RIGHTS AND LIABILITIES OF THE LESSEE',
    content: `10.1 Upon paying the rental charges and performing the covenants herein, the Lessee shall peaceably hold and use the Vehicle during the rental period without lawful interruption by the Lessor.
10.2 The Lessee shall return the Vehicle to the Lessor at the specified drop-off location on or before the expiry of the rental period in the same condition as received, ordinary wear and tear excepted.`,
  },
  {
    number: '11',
    title: 'RENEWAL OF THE AGREEMENT',
    content: `11.1 Any extension or renewal of the rental period must be requested by the Lessee in writing at least 48 hours prior to the expiry of the current agreement and approved by the Lessor in writing, subject to vehicle availability and payment of revised rental charges.`,
  },
  {
    number: '12',
    title: 'Renewal where time period is less than three months',
    content: `12.1 For short-term agreement renewals of less than three months, the Lessor reserves the right to adjust daily or weekly rental tariffs in accordance with published seasonal rates.`,
  },
  {
    number: '13',
    title: 'JOINT AND SEVERAL LIABILITIES',
    content: `13.1 Where two or more persons or entities are named as Lessee, Nominated Driver, or Guarantor under this Agreement, their liabilities, obligations, and covenants hereunder shall be joint and several.`,
  },
  {
    number: '14',
    title: 'NOTICE',
    content: `14.1 Any notice, demand, or communication required to be given under this Agreement shall be in writing and sent by hand delivery, registered post, courier, email, or official instant messaging to the addresses or contact numbers stated in the preamble.`,
  },
  {
    number: '15',
    title: 'SERVICE OF NOTICE',
    content: `15.1 Notice served by hand delivery shall be deemed received at the time of delivery; notice sent by registered post or courier shall be deemed received within 48 hours of posting; notice sent by email or digital messaging shall be deemed received upon successful dispatch.`,
  },
  {
    number: '16',
    title: 'further agreement provisions',
    content: `16.1 The Lessee authorizes the Lessor to verify driving record background, identity documents, and credit status with relevant authorities and databases.
16.2 In the event of GPS tracking installation on the Vehicle, the Lessee consents to real-time location monitoring and telemetry data collection by the Lessor for fleet security and operational management.`,
  },
  {
    number: '17',
    title: 'JURISDICTION',
    content: `17.1 This Agreement shall be governed by and construed in accordance with the laws of the Democratic Socialist Republic of Sri Lanka.
17.2 The parties hereto irrevocably submit to the exclusive jurisdiction of the District Court of Colombo / Nugegoda in respect of any dispute, claim, or matter arising under or in connection with this Agreement.`,
  },
  {
    number: '18',
    title: 'INTERPRETATION',
    content: `18.1 Headings are inserted for convenience of reference only and shall not affect the interpretation of this Agreement. Words importing the singular include the plural and vice versa; words importing any gender include all genders.`,
  },
]

export const USER_AGREEMENT_DECLARATION = `LESSEE DECLARATION:
I, {{LESSEE_FULL_NAME}}, hereby declare that the particulars furnished by me in this Agreement and Schedule are true, correct, and complete. I confirm that I have read, understood, and unreservedly agree to abide by all the terms, conditions, exclusions, and obligations contained in this Vehicle Rental Agreement.`

export const REQUIRED_USER_AGREEMENT_TOKENS = [
  'AGREEMENT_NUMBER',
  'AGREEMENT_DATE',
  'LESSEE_FULL_NAME',
  'LESSEE_IDENTIFIER_NO',
  'RENTAL_START',
  'RENTAL_END',
  'DAILY_RENTAL',
  'SECURITY_DEPOSIT',
]
