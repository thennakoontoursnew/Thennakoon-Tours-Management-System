// Official User Agreement Legal Template V1
// Authoritative legal text file for Thennakoon Tours (Pvt) Ltd Vehicle Rental Agreement
// NON-NEGOTIABLE RULE: DO NOT rewrite, simplify, summarize, correct, paraphrase, modernize or remove legal clauses.

export const USER_AGREEMENT_VERSION = 'USER_AGREEMENT_V1'
export const USER_AGREEMENT_COMPANY_REG_NO = 'PV 00312253'

export interface LegalClause {
  number: string
  title: string
  content: string
}

export interface RentalPeriodResult {
  valueStr: string
  unit: 'days' | 'weeks' | 'month' | 'years'
  formattedHtml: string
  formattedText: string
}

export function calculateRentalPeriodDisplay(days: number): RentalPeriodResult {
  const d = Math.max(1, Number(days) || 1)

  if (d < 7) {
    const val = String(d).padStart(2, '0')
    return {
      valueStr: val,
      unit: 'days',
      formattedHtml: `${val} (<u>days</u> / weeks / month / Years)`,
      formattedText: `${val} (Days)`,
    }
  } else if (d < 30) {
    const weeks = Math.floor(d / 7)
    const val = String(weeks).padStart(2, '0')
    return {
      valueStr: val,
      unit: 'weeks',
      formattedHtml: `${val} (days / <u>weeks</u> / month / Years)`,
      formattedText: `${val} (Weeks)`,
    }
  } else if (d < 365) {
    const months = Math.floor(d / 30)
    const val = String(months).padStart(2, '0')
    return {
      valueStr: val,
      unit: 'month',
      formattedHtml: `${val} (days / weeks / <u>month</u> / Years)`,
      formattedText: `${val} (Month)`,
    }
  } else {
    const years = Math.floor(d / 365)
    const val = String(years).padStart(2, '0')
    return {
      valueStr: val,
      unit: 'years',
      formattedHtml: `${val} (days / weeks / month / <u>Years</u>)`,
      formattedText: `${val} (Years)`,
    }
  }
}

export const USER_AGREEMENT_PREAMBLE = `Agreement No: {{AGREEMENT_NUMBER}}

VEHICLE RENTAL AGREEMENT

Thennakoon Tours (Pvt) Ltd bearing registration No PV 00312253 Having its Principal Business Place at 39A, 1st cross street, Pagoda Road, Nugegoda (hereinafter referred to as "The Lessor" which term or expression shall where the context so requires or admits be taken to mean and include the said Thennakoon Tours (Pvt) Ltd and his heirs executors and administrators of the First Part and (the Lessee) No {{LESSEE_IDENTIFIER_NO}} (Hereinafter referred to as "The Lessee" which term or expression shall where the context so requires or admits betaken to mean and include the said {{LESSEE_FULL_NAME}} (Name of the Lessee) and it's Successor or Successors in Office and assigns) of the Second Part.

Whereas the Lessee is desirous of hiring from The Lessor a motor car belonging to The Lessor and described in the Schedule to this agreement (hereinafter referred to as "The Vehicle") and "Lessor" has agreed with the "Lessee" to hire the Vehicle to The lessee subject to and upon the terms and conditions hereinafter set forth.

Now it is hereby agreed between The Lessor and The Lessee that in consideration ofthe parties doing, observing and performing all of the respective terms, conditions, covenants, stipulations and obligations contained in this agreement to be done, observed and performed respectively by either of them the parties hereto agree as follows:-`

export const USER_AGREEMENT_CLAUSES: LegalClause[] = [
  {
    number: '1',
    title: 'HIRE OF VEHICLE',
    content: `Subject to and upon the terms and conditions contained in this Agreement The Lessor shall provide The Vehicle to The lessee on hire and The lessee can use the vehicle as from the {{RENTAL_START}} and during the entirety of the definite and ascertained period of {{RENTAL_PERIOD_DISPLAY}} commencing from {{RENTAL_START}} (Hereinafter referred to The Period").`,
  },
  {
    number: '2',
    title: 'RENTAL AND OTHER CHARGES',
    content: `(a) The Lessee shall deposit sum of {{MONTHLY_OR_DAILY_RENTAL}} rental on or before {{DUE_DATE_DAY}} of each and every month during the lease Period commencing from {{RENTAL_START}} to the Account Number 100530013140, under the name of Thennakoon Tours (PVT) Ltd , Nugegoda Branch. Further Lessor agreed to undertake vehicle service and bear full maintenance charges of the vehicle during the lease period. Subject to the following conditions.
The followings are excluded.
a) Minor Repairs up to Rs 13,500/= carried out by the lessee.
b) Keep up cost of the vehicle.
i Tires: Routeen Balancing and Balancing.
ii Car wash and Detaililng.
iii Fluids Top Ups: Coolant, Break Fluids, Transmission Fluids.

In the event the Lessee defaults on the payment of rent on the agreed due date, the Lessor shall be entitled to claim an additional charge on the defaulted amount as follows:
• 1% per day for any delay during the first month from the due date,
• 1.5% per day for any delay during the second month, and
• 2% per day for delays extending into the third month and beyond, in addition to the defaulted rental amount.

(b) The Lessee should release the Vehicle One day to lessor in order to carry out the services (when service due as per the service tag). There will be no deduction of the rental on the said date.

(c) One month is counted as 30 days and One year is counted as 365 days, Further the allowed mileage for one day is 100 Kilometers.

(d) Lessor will carry out all repairs other than tyre puncher repair costs and general vehicle up-keep costs while in the custody of the user. In the event where lessor assistance is not possible (especially out of Colombo) the lessee could carry out the repairs (minor only, below 13,500/—) at a garage convenient to him/her following approval in writing to lessor. Any such costs will be refunded to the lessee upon submission of Original Cost Bills.

(e) Lessor allows 100(hundred) kilometers per day. If there are more kilometers than allowed lessor will charge Rs {{EXTRA_KM_RATE}} /= for an extra kilometer and that will be charged from lessee or deducted from lessee's security deposit. Lessor will count the mileage monthly basis in long term contract (more than one month).

(f) Lessee has to bear Rs. 15,000/- from every claims which are above minor accidents limit (close number 3d) as insurance companies deducting same for rent a car cover policy (as excess amount).

(g) The Lessee shall bear or re-imburse The Lessor on demand all costs of complying with any statute or regulation relating to The Vehicle or its use which may be brought into force or effect during The Period notwithstanding any such costs being levies or charges imposed on The Lessor as owner of the vehicle.

(h) Security Deposit
Security Deposit will be used in the event ofloss, damage or default ofrental agreed to the Hired/rented Vehicle during the term of this agreement and/or till the vehicle is returned as set out in clause 9 D (a) of this agreement. In the event of damage, loss or default of rental agreed to the Hired/rented Vehicle, Lessor will apply this Security Deposit to defray the costs of necessary repairs, replacement or default of rental. If the cost for repair or replacement of damage to the Rental Vehicle or default rental exceeds the amount of the Security Deposit, Lessee will be responsible for payment to the Lessor of the balance of this cost Further lessor has the right to hold security deposit kept by lessee for 14 days if there are suspected damages for the vehicle or issues with agreement.`,
  },
  {
    number: '3',
    title: 'LICENSE AND INSURANCE',
    content: `a) The Lessor shall keep The Vehicle licensed during The Period by obtaining a valid Revenue license from the relevant authority.

b) The Lessor shall keep the Vehicle comprehensively insured during The Period.

c) Lessor will not be liable to indemnify the Lessee against any loss, injury or damage sustained by any accident &/or by any third party consequent to the use of the vehicle during the period &/or consequent to any defect in the vehicle and also lessor's insurance will cover only a limited amount for the third party damages due to an accidents. If third party demand is higher than Rs, 500,000/= (third party insurance cover), Lessee should pay such claims to third party who lost/injured due to that particular accident. Lessor is not liable.

d) Lessor will not claim insurance for any minor accident in which the cost is lower than , Rs25,000/= and in such instance it will be recovered from the Lessee or from the security deposit. However if the accident cost is more than Rs {{MINOR_ACCIDENT_THRESHOLD}} /= in such instance cost of repairs of the car driven by Lessee should be recovered from Lessors Insurance and Lessor has the right not to refund security deposit till the insurance claim is paid to the Lessor. In addition Lessor is entitled to the rent even for the period in which the vehicle is in the repair centre as a result of the accident.

e) All vehicles will have limited liability/full insurance, with regard to Personal Injury; Lessee is advised to obtain additional insurance cover upon him/her self& passengers on their own accord.

The Lessor is entitled to the rent calculated in the following manner, for the period in which the vehicle is in the repair center as a result of an accident, provided that if the vehicle is condemned then the Lessee should pay the 30 days of Rental.
Agreed Monthly Rental / 30 days

Security Deposit
[i] The Security Deposit will be used in the event of loss, damage or default of rental agreed to the Hired/rented Vehicle during the term of this agreement and/or till the vehicle is returned as set out in clause 9 D (a) of this agreement and In the event of damage, loss or default of rental agreed to the Hired/rented Vehicle, Lessor will apply this Security Deposit to defray the costs of necessary repairs, replacement or default of rental.
[ii] If the cost for repair or replacement of damage to the Rental Vehicle; or default rental exceeds the amount of the Security Deposit, Lessee will be responsible for payment to the Lessor of the balance of this cost.
[iii] Without prejudice to the above; lessor has the right to hold security deposit kept by lessee for 14 days if there are suspected damages for the vehicle or issues with agreement. Thus, even in a situation that Lessor is satisfied that there are no suspected damages to the vehicle or any issue with the agreement security deposit will only be released to the Lessee, after 48 working hours from the time of returning vehicle to the Lessor.`,
  },
  {
    number: '4',
    title: 'MAINTENANCE',
    content: `(a) The Lessee shall keep and maintain The Vehicle in good order and sound working condition and operate the same by recognized methods and standards of operations.

(b) The Lessee shall perform routine daily maintenance work which shall, inter alia, include the checking and topping up of engine oil, brake fluid, power steering fluid, radiator and battery water, checking of tyre pressure, pumping the correct fuel type and other day to day maintenance work that may by necessary to keep The Vehicle in good order and working condition.

(c) If The Vehicle is damaged or in need of repairs The Lessee shall promptly notify The Lessor. In case of accident The Lessee has to get all relevant documents including police report and submit to The Lessor.

(d) In any accident /and or maintenance to the vehicle Lessee is prohibited from doing any repair to the vehicle without written approval of the Lessor. In any case if the Lessee breaches this condition Lessee will have to bear the entire cost.

(e) The Lessee shall maintain a record of all service maintenance (subject to approval from lessor) and repairs carried out in respect of The Vehicle and shall submit to The Lessor every month.

(f) The Lessor shall bear the cost of all regular service and maintenance work carried out on The Vehicle in the course of the ordinary use of The Vehicle.

(g) The Lessee is liable for any damage occurred from failing and/or neglecting to perform routine daily maintenance work set out paragraph 4 (b).`,
  },
  {
    number: '5',
    title: 'USE OF VEHICLE',
    content: `(a) The Lessee uses The Vehicle with due care and diligence and shall ensure that The Vehicle is driven only by Lessee with duly licensed to drive the class of vehicle in question. The driver should have driving experience of more than one year. The Lessee shall not permit The Vehicle to be used for the purpose of training any unlicensed driver, or put to any use not recommended by the manufacturer of its agent. In particular The Vehicle shall not be used for racing or rallying or be over loaded.
Further vehicle shall not be used to demonstrations, advertising or any other commercial activity, safari purposes & any other illegal purposes and Further the vehicle will not be used for transportation of any items specified by legal authorities, construction/industrial material, toxic and nontoxic waste material, raw meats or any non-passenger items.

(b) If the Lessee Intends to handover the vehicle to another person to be driven Lessee should inform the Lessor at the time of signing the agreement with the details of the said person, which should be provided to the Lessor. Further if the Lessee intends to handover the vehicle to be driven more than one person Lessee should pay an extra charge of Rs 5000/=. The details of the nominated drivers appears after the schedule of this agreement.

(c) The following items are prohibited from transporting — Narcotics & other illegal substances, firearms & other prohibited items by the Ministry of Defense (MOD), PETS, Raw Meat/Fish, and Construction Material.

(d) If The Vehicle has suffered damage or excessive wear (reference to delivery inspection/note) and tear as a result of misuse The Lessee shall be liable for the cost incurred by way of additional servicing, maintenance or repair of The Vehicle as a result of suchuse.

(e) The Lessee shall not do any act nor allow or suffer any omission that may directly or indirectly negate nullify or render invalid any of the clauses of the Insurance Policy obtained in respect of The Vehicle.

(f) The Lessee agrees that if The Lessor as owner of The Vehicle is charged or brought before any court, tribunal, forum, body or person for or in connection with or relating to any offence punishable under Sri Lankan Law whatsoever arising from or in respect of The Vehicle and/or the se of The Vehicle during The Period, The Lessee shall forthwl•th keep The Lessor freed, absolved and indemnified there from by appearing before the court, tribunal, forum, body or person and accepting full responsibility for such offence as the person in possession of The Vehicle at the time such offence was committed.

(g) The Lessee shall keep The Lessor freed and indemnified against any and all loss, damages, claim, expense (including Attorney's fees and costs of litigation) or injury imposed or incurred by or asserted against The Lessee arising directly or indirectly out of The Lessor's use, custody possession or operation to The Vehicle occurring during The Period.

(h) All indemnities contained in this agreement shall survive till the termination of the agreement.

(i) The Lessee acknowledges that ownership and title to The Vehicle after delivery thereof to The Lessee shall remain vested With The Lessor.

(j) The Lessee shall forthwith notify The Lessor in writing and by a call to the Hotline of the Lessor of any accident in which The Vehicle may be involved in giving full particulars of the accident, injuries suffered by The Lessee or any other person, and damage caused to The Vehicle or any other property. The Lessee shall also forthwith notify the police of the said accident and shall take such action as may be necessary to safeguard the rights and interest of The Lessor as owner of The Vehicle including such action as may be necessary to obtain the release of such vehicle from police custody or detention. Further lessee should pay rental for the period where said vehicle is in police custody according to agreement rates.

(k) In the Event of an Accident the following procedure should be adhered by lessee to;
1 -The lessee should notify lessor of the accident immediately before calling to insurance, if lessee can't contact lessor, lessee should inform the relevant insurance company before leaves from the place accident took place and nearest police station(if needed) and take all necessary legal steps, which is required by the Motor Traffic Act of Sri Lanka.
2- The lessee shall endorse by signing all documents to enable lessor to obtain all claims from the outcome of the accident.

(l) Though the Vehicle is covered with a FULL renter car insurance, Lessee is responsible for the total cost of damages and rental(For period which vehicle is in repairing center), if insurance claim is rejected on account on invalid documents such as driving license, ID, incorrect details of accident, under intoxication and other circumstances occurred due to the negligence and willfully misrepresentation by the Lessee or any situation which insurance company decided to reject claim as a relevant insurance policy.

(m) Lessor will NOT under any circumstances, pay any charges for lessee's accommodations; extra transport modes etc in breakdown or accident take place out of Colombo.

(n) In situation where lessor assistance is not possible or not contactable in vehicle break down, lessee can select following options,
1. Lessee can put the vehicle to nearest workshop and get the repair done with writing approval from lessor (E-mail. SMS, whatz up or etc).
2. Carrier vehicle to Thennakoon Tours head office located in Nugegoda and pick a replacement car.
3. Ask a vehicle to breakdown point, there can be extra charge for delivery base on distance, and package lessee has taken.`,
  },
  {
    number: '6',
    title: 'EXCLUSION OF LIABILITY',
    content: `(a) The lessee shall be accepting delivery of The Vehicle be deemed to have full satisfied himself that The Vehicle is in all respects roadworthy safe and in good working order and condition with all perfect order.

(b) The Lessor shall not be liable for loss of any kind whatsoever suffered by The lessee as a result of any of The Vehicle being unusual or out of order during any part or whole of the period.

(c) The Lessor shall not be liable to indemnify The Lessee against any loss injury or damage suffered by the Lessee or his agents or any other person consequent to the use of The Vehicle and/or consequent to any defect in The Vehicle.

(d) Lessee agrees to indemnify, defend, and hold harmless the Lessor for any loss, damage, or legal actions against Owner as a result of Lessee's operation or use of the Rented/ hired Vehicle during the term of this Car Rental Agreement and or till the vehicle is returned as set out in clause 9 D (a) of this agreement. This includes any attorney fees necessarily incurred for these purposes. Lessee will also pay for any parking tickets, moving violations, or other citations received while in possession of the hired Vehicle.`,
  },
  {
    number: '7',
    title: 'EXCLUSION OF WARRANTIES',
    content: `The Lessor makes no warranties or representations, express or implied, statutory or otherwise, as to the condition, merchantability, fitness, for any particular purpose, or any other matter concerning The Vehicle and The Lessee waives any claim it might have against The Owner for any loss damage or expense caused by The Vehicle or by any defect therein.`,
  },
  {
    number: '8',
    title: 'ASSIGNMENT',
    content: `(a) The Lessee shall not assign, sublease, rent out or in any other way part with possession of The Vehicle.

(b) The Lessor may assign, mortgage, encumber or otherwise deal with The Vehicle or may assign, create any interest in or otherwise deal with all or any of its rights under this agreement at any time as it sees fit.`,
  },
  {
    number: '9',
    title: 'DEFAULT AND TERMINATION',
    content: `(A) The Lessor and The Lessee agree that The Owner may (notwithstanding that it may have waived a previous default of the same or another nature) after Thirty (30) days notice in writing or in lieu of such payment terminate this agreement together with all rights of The Lessee under this agreement in the event of any one or more of the following acts or events of default.
(a) The Lessor ascertains that The Lessee has made a false inaccurate or misleading statement in or in relation to the making of this agreement.
(b) The Lessee makes default in payment of the rentals on the due dates as provided herein;
(c) The Lessee fails to observe and perform any term condition or provision of this agreement;
(d) The Lessee fails to pay rental within two (2) days of due date described in this agreement.
(e) 1 Month Rental (One Month)

Provided as an Exemption clause 9 (a) of this agreement, the Lessor has exclusive right to re take the possession of the vehicle given to the Lessee and terminate the agreement in the following circumstances explained below WITH OUT any notice to the Lessee.
[a] The Lessee does or causes to be done or permits or suffer any act or thing whereby The Lessor's interest or rights in The Vehicle under this Agreement may, in the opinion of The Lessor be prejudiced or put in jeopardy;
[b] The Lessee does or caused to be done or permits or suffers any act or thing which, in the opinion of The Lessor is likely to endanger the safety or condition of The Vehicle.
[c] There occurs in the reasonable opinion of The Lessor any event or series of events, whether related or not, which has an adverse effect on The Lessee's financial condition business assets or the ability of The Lessee to perform and comply with its material obligations under this agreement; (B) The Lessor and The Lessee further agree that The Lessee may (notwithstanding that it may have waived a previous default of the same or another nature) after Thirty (30) days notice in writing or in lieu of such payment terminate this agreement together with all rights of The Lessee under this agreement.

(C) In the event of the termination of this agreement as aforesaid or by the effluxion of time The Lessor shall be entitled to institute action in a court of law for the recovery of the following
(a) Possession of The Vehicle
(b) The full amount of the rentals or arrears thereof due and payable under this agreement together with interest due thereon up to the date of termination;
(c) All costs and charges incurred by The Lessor in respect of the recovery of possession of The Vehicle
(d) All legal expenses and costs of action including attorney's fees.

(D) (a) Upon the termination or expiry of this agreement The Lessee shall forthwith return The Vehicle to The Lessor (same date which agreement expires) at The Lessor's address given above as The Lessor may direct, in good and working condition and at The Lessor's expense and risk. Without prejudice to the foregoing or to The Lessor's claim for any arrears of rental, any arrears for money due on excess of mileage agreed under clause 2 (c) interest for and breach of the agreement or any other rights hereunder.
The Lessor may at any time after such termination or expiry of the agreement without notice re-take possession of The Vehicle and for that purpose enter into or upon any land or premises where The Vehicle is or is believed by The Lessor or its agents to be kept.

(b) The Lessee shall be liable to pay for all costs charges and expensed incurred by The Lessor in retaking possession of The Vehicle.

(c) At the point of the return of the vehicle the Lessee will submit a sum of Rs. 1 500/= as clearing charges or shall bear the duties of cleaning the vehicle before returning. At the return of the vehicle if the Lessor feels that Vehicle should undergo with a full interior cleaning the Lessor is entitled to claim sum of Rs 12 000/- .

(E) With reference to early termination by the Lessee Additional one month should be paid by lessee to lessor as a fee.

(F) Lessor has the right, not to refund the security deposit and balance rental remaining or charge daily rental when lessee terminates agreement without prior 30 days' notice in writing and (this applies in contract more than one month).`,
  },
  {
    number: '10',
    title: 'RIGHTS AND LIABILITIES OF THE LESSEE',
    content: `(a) If lessee meets an accident with train when crossing the rail way and if insurance company rejects the claim due to negligence or careless, Lessee is liable to total damage.

(b) The Lessees has to bear the cost in any event of Theft of the Parts of the vehicle, since NO Insurance Company covers the Theft of parts under Renter Car Insurance policy.

(c) If there is breakdown or accident in out of Colombo at any time of the day, Lessee is liable to bring the vehicle to lessor's nominated garage. Cost of carrier fee should be paid by lessor to lessee in vehicle breakdown. Lessor will not pay carrier charges for accidents which take place after handing over the car to lessee. Further lessor will not pay any charges for lessee's accommodations; extra transport modes etc in breakdown or accident take place out of Colombo.

(d) Lessee is liable to pay or provide new one in case of key, License, Insurance loss and tyre damage because of negligence.

(e) Lessee is responsible for the total cost of damages and rental, if insurance claim is rejected on account on invalid documents such as driving license, ID, incorrect details of accident, under intoxication etc. The vehicle is covered with full insurance.

(f) Lessee is liable to pay any damages and losses to interior / exterior accessories and DVD, stereo, MP3, remote keys etc.

(g) The lessee shall return the vehicle in the same condition as at the time of taking the vehicle.

(h) In the event of damages (Police Report NOT obtained) and/or Mechanical repair due to negligence on the part of the Lessee, lessor has the right to forfeit the Refundable deposit taken. If the cost of the damage and/or repair is greater than the refundable deposit, the balance will be recovered from the lessee. No rental refund will be given to the Lessee in this instance.

(i) Lessee is not allowed to drive having liquor and damages arising to the vehicle as a consequence of this will be borne by the lessee.

(j) Lessee should not pay the rental when the car is in garage due to vehicle breakdown (Except negligence on the part of the lessee) if replacement (lessor has right to decide type of replacement car base on availability) is not provided.

(k) Part ofrental will NOT be returned in any event IF the vehicle is returned before the expiry date and lessor has NO responsibility at all to re-fund any excess fuel prevailing at the time of returning the car. Further lessor is not responsible for any items/equipment which lessee has not taken back at return.

(l) All vehicles will have limited liability/full insurance, with regard to Personal Injury; Lessee is advised to obtain additional insurance cover upon him/her self & passengers on their own accord.

(m) In situation (breakdown due to mechanical) where lessor is not in position to arrange the replacement car (except negligence of lessee) lessee can deduct day rental accordingly.

(n) Damages to tyrs while the vehicle is in the custody of the Lessee, Lessee should replace the tyre in the same condition.

(o) All terms and conditions of original (first) agreement will apply for the replacement car which is provided by lessor (Thennakoon Tours) to lessee in case of accident, breakdowns, services etc.`,
  },
  {
    number: '11',
    title: 'RENEVAL OF THE AGREEMENT',
    content: `(Applicable to Agreements of three months and over three months)

a) Lessor has the exclusive right on the renewal (extent or not to extend) of this agreement. The Lessee should inform the Lessor in writing if the Lessee intends to renew the agreement.

b) The notice of renewal can be sent by registered Post and/or by email (if given) AND renewal message via Whatsapp or viber prior one month to the expiring of this agreement.

c) Further if the Lessee fails and/or neglected to reply or keep silent on the Notice sent by post and/or email and/or whatsapp and viber the lessor considers that as an acceptance of the offer to Renewal by the Lessee for same terms agreed in this agreement.

d) If Lessee has an objection for renewal he should reply in writing to above given address of the Lessor and/or reply by email AND by whatsapp and or viber . ( The reply should be send via Registered post or email AND Whatsapp or Viber)

e) The lessor can send the objection of renewal to lessee any date before the agreement expiry date.

f) The terms and conditions of this agreement will be applicable in the same manner between the parties to this agreement even after this agreement is expired, if the lessee has failed to return the vehicle to the lessor in satisfactory quality and failed to obtain the return note and/ or checklist from the lessor.

g) The terms and conditions of this agreement will be applicable in the same manner between the parties to this agreement in renewal even a new agreement is not signed.`,
  },
  {
    number: '12',
    title: 'Renewal of the agreement Time period is less than Three Months.',
    content: `a) The Lessee has to inform the Lessor In writing if they wish to extent the time subject to the same conditions and Terms of this agreement.( Lessor has the exclusive right on the renewal of this agreement)

b) The Lessee should any date prior to expiring the agreement inform the intention to extend and renewal of the agreement to the official email address and through whats-app . sms. or viber to the official Telephone number of the Lessor.

c) The terms and conditions of this agreement will be applicable in the same manner between the parties to this agreement even after this agreement is expired, if the lessee has failed to return the vehicle to the lessor in satisfactory quality and failed to obtain the return note and/ or checklist from the lessor.

d) The terms and conditions of this agreement will be applicable in the same manner between the parties to this agreement in renewal even a new agreement is not signed.`,
  },
  {
    number: '13',
    title: 'JOINT AND SEVERAL LIABILITIES',
    content: `If two or more Lessees are parties to this agreement they will be bound jointly and each of them severally.`,
  },
  {
    number: '14',
    title: 'NOTICE',
    content: `Any notice or demand to be given by either party to the other shall be in writing and delivered to the other party by registered post or such as sms, whatsapp and or by email.`,
  },
  {
    number: '15',
    title: 'SERVICE OF NOTICE',
    content: `Any Notice, summons, demand or decree of Court to be sent or given by either party or their duly authorized representative or their Attorney-at-law or by court to other party as appears herein or such other address as such party may time to time have duly communicated to the other and if so sent shall deemed to be served on the day following day of posting, If the Notice is sent via email or text massage is deemed to be served at the moment it is sent.
In proving service of any Notice, Summons, Demand, Decree of the court was properly addressed, stamped and posted under the registered cover, or has been served to the address of the other party as appearing herein or such other address as such other party may have given from the time to time duly communicate to the other party.`,
  },
  {
    number: '16',
    title: 'IT IS FURTHER AGREED...',
    content: `IT IS FURTHER AGREED by and between The Lessor and The Lessee as follow In consideration of The Lessor hiring The Vehicle to The Lessee under this agreement and the terms and conditions herein set forth The Lessee hereby further agrees with The Lessor that any neglect or forbearance on the part of The Lessor in enforcing any of the terms and condditions of this agreement by The Lessee to be observed and performed or any time or concession granted by The Lessor to The Lessee shall in no way be deemed or construed as an extension having been made of The Period of hiring or of agreement or The Lessor's rights hereunder and that this agreement shall remain in full force against The Lessee notwithstanding such neglect or forbearance or time or concession as aforesaid.`,
  },
  {
    number: '17',
    title: 'JURISDICTION',
    content: `The Place of this agreement is signed and executed shall determine the Jurisdiction in any dispute regarding this agreement. The Place of the agreement is decided by the Lessor and its final and conclusive.`,
  },
  {
    number: '18',
    title: 'INTERPRETATION',
    content: `Lessee - The person or a company who takes vehicle on lease from the Thennakoon Tours (Pvt) Ltd LessorThennakoon Tours (Pvt) Ltd

Decision or Approval by the Lessor - A Decision or approval that has been taken by the Managing Director or Top Management of the Thennakoon Tours ( Pvt) Ltd.

Posting Address of the Lessor - (Thennakoon Tours (Pvt) Ltd, 39A, 1st cross street, Pagoda Road, Nugegoda, SriLanka.)
Message via Whatsapp to the Lessor - A whatsapp message sent to the following number
Marketing, Administration & Customer Relations (Mrs. Iresha) : +94 76 676 2829
For technical support (Mr. Niranga) : +94 77 747 4938 (Deshan)
Complains and more information Hot Line : +94 112 823 723 / +94 77 727 3820,

Exclusive - restricted to the person, group, or company.
Final and Conclusive - decisive, determinative, definitive mean bringing to an end
Day — 24 hours Month 
— 30 days
Year- 365 days
Default - When Lessee fails or neglects to pay the Rental on the due date agreed`,
  },
]

export const USER_AGREEMENT_SCHEDULE_TITLE = 'SHEDULE TO AGREEMENT'

export const USER_AGREEMENT_DECLARATION = `IMPORTANT: This Agreement has been read by/to me/us in my/our own language and I/We here be declare that I/We Understood the Terms of this Agreement.
(a) The Lessee shall by accepting delivery of the vehicle be deemed to have satisfied him/herself after fully inspection that the vehicle is in good order. ( This is set out in Clause 6 (a)`

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
