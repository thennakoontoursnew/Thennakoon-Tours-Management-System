import { formatDateOrdinal } from '@/lib/utils/formatters'
import { AgreementSection, sectionsToMarkdown } from './section-template-renderer'
import { MergeTagDefinition, renderAgreementTemplate } from './template-renderer'

export const MERGE_TAGS_EXTENSION_LETTER: MergeTagDefinition[] = [
  {
    tag: '{{recipient_name}}',
    label: 'Recipient Name',
    category: 'party',
    description: 'Customer / Company or Vehicle Owner full name',
  },
  {
    tag: '{{vehicle_reg_no}}',
    label: 'Vehicle Reg No',
    category: 'vehicle',
    description: 'Vehicle registration number (e.g. WP CBA-7890)',
  },
  {
    tag: '{{extension_duration_label}}',
    label: 'Extension Duration',
    category: 'dates',
    description: 'Duration phrase (e.g. 06 Months or until further notice)',
  },
  {
    tag: '{{new_end_date}}',
    label: 'New End Date',
    category: 'dates',
    description: 'Revised end date or Until Further Notice',
  },
  {
    tag: '{{renewal_amount}}',
    label: 'Renewal Amount',
    category: 'financial',
    description: 'Optional renewal/monthly charge (omitted cleanly if blank)',
  },
  {
    tag: '{{currency}}',
    label: 'Currency',
    category: 'financial',
    description: 'Currency code (e.g. LKR, USD)',
  },
  {
    tag: '{{original_agreement_ref}}',
    label: 'Original Agreement Ref',
    category: 'dates',
    description: 'Original Agreement Number & Date',
  },
  {
    tag: '{{issue_date}}',
    label: 'Issue Date',
    category: 'dates',
    description: 'Formatted extension letter issue date',
  },
  {
    tag: '{{extension_number}}',
    label: 'Extension Ref No',
    category: 'dates',
    description: 'Generated extension number (e.g. EXT-2026-000001)',
  },
  {
    tag: '{{custom_notes}}',
    label: 'Custom Notes',
    category: 'notes',
    description: 'Optional special remarks or agreed extension notes',
  },
]

export const DEFAULT_USER_EXTENSION_LETTER_SECTIONS: AgreementSection[] = [
  {
    id: 'sec_ext_user_header',
    order: 1,
    title: 'Header, Recipient & Subject',
    body: `Ref: {{extension_number}} | Date: {{issue_date}}

To: **{{recipient_name}}**

# RE: EXTENSION OF VEHICLE RENTAL AGREEMENT – VEHICLE NO: {{vehicle_reg_no}}`,
  },
  {
    id: 'sec_ext_user_opening',
    order: 2,
    title: 'Salutation & Confirmation',
    body: `Dear {{recipient_name}},

We are pleased to confirm the extension of your vehicle rental agreement with **Thennakoon Tours (Pvt) Ltd** for the vehicle bearing registration number **{{vehicle_reg_no}}** (originally commenced under Agreement No. **{{original_agreement_ref}}**).`,
  },
  {
    id: 'sec_ext_user_terms',
    order: 3,
    title: 'Extension Period & Renewal Charges',
    body: `By mutual consent, the rental period is hereby extended for **{{extension_duration_label}}** (Revised End Date: **{{new_end_date}}**).

Agreed Renewal / Periodic Rental Charge: **{{currency}} {{renewal_amount}}**`,
  },
  {
    id: 'sec_ext_user_closing',
    order: 4,
    title: 'Continuity of Terms & Acknowledgement',
    body: `All other terms, conditions, security deposit provisions, insurance obligations, and covenants stated in the original Vehicle Rental Agreement shall remain unchanged and continue in full force and effect during this extended period.

**Additional Notes / Agreed Terms:** {{custom_notes}}

Kindly sign and return a copy of this letter as your formal acknowledgment and acceptance of this extension.`,
  },
]

export const DEFAULT_OWNER_EXTENSION_LETTER_SECTIONS: AgreementSection[] = [
  {
    id: 'sec_ext_owner_header',
    order: 1,
    title: 'Header, Owner & Subject',
    body: `Ref: {{extension_number}} | Date: {{issue_date}}

To: **{{recipient_name}}**

# RE: EXTENSION OF VEHICLE OWNER AGREEMENT – VEHICLE NO: {{vehicle_reg_no}}`,
  },
  {
    id: 'sec_ext_owner_opening',
    order: 2,
    title: 'Salutation & Confirmation',
    body: `Dear {{recipient_name}},

This letter formally confirms the mutual extension of the Vehicle Owner Agreement between **Thennakoon Tours (Pvt) Ltd** and **{{recipient_name}}** regarding the vehicle bearing registration number **{{vehicle_reg_no}}** (Reference Agreement No. **{{original_agreement_ref}}**).`,
  },
  {
    id: 'sec_ext_owner_terms',
    order: 3,
    title: 'Extension Period & Owner Rental Amount',
    body: `Both parties have mutually agreed to extend the operational engagement of the above vehicle for **{{extension_duration_label}}** (Revised End Date: **{{new_end_date}}**).

Agreed Monthly Owner Rental Amount: **{{currency}} {{renewal_amount}}**`,
  },
  {
    id: 'sec_ext_owner_closing',
    order: 4,
    title: 'Continuity of Terms & Acknowledgement',
    body: `All original terms, conditions, revenue-share / monthly payment schedules, mileage limits, and maintenance responsibilities set out in the principal Vehicle Owner Agreement shall remain binding throughout the extended tenure.

**Special Notes:** {{custom_notes}}

Kindly sign and return a copy of this letter as your formal acknowledgment and acceptance of this extension.`,
  },
]

export const DEFAULT_USER_EXTENSION_LETTER_BODY = sectionsToMarkdown(DEFAULT_USER_EXTENSION_LETTER_SECTIONS)
export const DEFAULT_OWNER_EXTENSION_LETTER_BODY = sectionsToMarkdown(DEFAULT_OWNER_EXTENSION_LETTER_SECTIONS)

export function getDefaultExtensionLetterSections(type: string): AgreementSection[] {
  return type === 'owner_extension_letter' || type === 'owner'
    ? DEFAULT_OWNER_EXTENSION_LETTER_SECTIONS
    : DEFAULT_USER_EXTENSION_LETTER_SECTIONS
}

export function buildExtensionTemplateVariables(ext: Record<string, any>): Record<string, string> {
  const isIndefinite = ext?.extension_period_type === 'until_further_notice'
  const rawAmount = ext?.renewal_amount !== null && ext?.renewal_amount !== undefined ? Number(ext.renewal_amount) : 0
  const hasAmount = !isNaN(rawAmount) && rawAmount > 0

  return {
    issue_date: formatDateOrdinal(ext?.issue_date) || String(ext?.issue_date || ''),
    extension_number: String(ext?.extension_number || 'EXT-PENDING'),
    recipient_name: String(ext?.recipient_name || ''),
    vehicle_reg_no: String(ext?.vehicle_reg_no || 'N/A'),
    extension_duration_label: isIndefinite
      ? 'until further notice'
      : String(ext?.extension_duration_label || 'further term'),
    new_end_date: isIndefinite
      ? 'Until Further Notice'
      : formatDateOrdinal(ext?.new_end_date) || String(ext?.new_end_date || 'N/A'),
    renewal_amount: hasAmount
      ? rawAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : '',
    currency: String(ext?.currency || 'LKR').toUpperCase(),
    original_agreement_ref: String(ext?.original_agreement_ref || 'Original Agreement'),
    custom_notes: ext?.custom_notes ? String(ext.custom_notes).trim() : '',
  }
}

/**
 * Resolves an extension letter template's section cards cleanly against live extension data.
 * Paragraphs tied to optional fields ({{renewal_amount}}, {{custom_notes}}) are omitted when blank
 * so issued letters never print empty labels like "LKR —".
 */
export function resolveExtensionLetterSections(
  templateSections: AgreementSection[],
  ext: Record<string, any>
): { resolvedSections: AgreementSection[]; resolvedMarkdown: string } {
  const sourceSections =
    templateSections && templateSections.length > 0
      ? templateSections
      : getDefaultExtensionLetterSections(ext?.agreement_type || 'user')

  const vars = buildExtensionTemplateVariables(ext)
  const hasRenewalAmount = vars.renewal_amount !== ''
  const hasCustomNotes = vars.custom_notes !== ''

  const resolvedSections = sourceSections
    .slice()
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map((sec, idx) => {
      const filteredParagraphs = (sec.body || '')
        .split(/\n\n+/)
        .map((para) => para.trim())
        .filter((para) => {
          if (!para) return false
          const hasCoreExtensionTags =
            /{{\s*(extension_duration_label|new_end_date|recipient_name|vehicle_reg_no|original_agreement_ref)\s*}}/i.test(
              para
            )
          if (!hasRenewalAmount && /{{\s*renewal_amount\s*}}/i.test(para) && !hasCoreExtensionTags) {
            return false
          }
          if (!hasCustomNotes && /{{\s*custom_notes\s*}}/i.test(para) && !hasCoreExtensionTags) {
            return false
          }
          return true
        })

      const filteredBody = filteredParagraphs.join('\n\n')
      return {
        ...sec,
        order: idx + 1,
        title: renderAgreementTemplate(sec.title || '', vars),
        body: renderAgreementTemplate(filteredBody, vars),
      }
    })
    .filter((sec) => sec.body.trim().length > 0)

  return {
    resolvedSections,
    resolvedMarkdown: sectionsToMarkdown(resolvedSections),
  }
}

export type ExtensionRenderBlock =
  | { type: 'ref_date_row'; left: string; right: string }
  | { type: 'subject'; text: string }
  | { type: 'note'; text: string }
  | { type: 'paragraph'; text: string }

/**
 * Parses resolved sections or snapshot markdown into uniform visual letter blocks shared
 * by HTML Letterhead Preview, Document Settings Live Preview, and jsPDF export.
 */
export function parseExtensionLetterBlocks(
  sections?: AgreementSection[] | null,
  fallbackMarkdown?: string | null
): ExtensionRenderBlock[] {
  const blocks: ExtensionRenderBlock[] = []

  let combinedBodies: string[] = []
  if (sections && Array.isArray(sections) && sections.length > 0) {
    combinedBodies = sections
      .slice()
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map((s) => s.body || '')
      .filter(Boolean)
  } else if (fallbackMarkdown) {
    // Strip editor section headings ("### Card Title") since letters print as continuous prose
    combinedBodies = fallbackMarkdown
      .split(/\n(?=###\s+)/)
      .map((chunk) => {
        const trimmed = chunk.trim()
        if (trimmed.startsWith('### ')) {
          const nl = trimmed.indexOf('\n')
          return nl !== -1 ? trimmed.slice(nl + 1).trim() : ''
        }
        return trimmed
      })
      .filter(Boolean)
  }

  for (const body of combinedBodies) {
    const paragraphs = body.split(/\n\n+/)
    for (const rawPara of paragraphs) {
      const para = rawPara.trim()
      if (!para) continue

      // Ignore any legacy hardcoded signature footer lines so component layout always renders signatures cleanly
      if (
        /^(Issued For\s*&?\s*On Behalf of|Acknowledged\s*&?\s*Accepted By|Date\s*\/\s*NIC\s*:)/i.test(
          para
        )
      ) {
        continue
      }

      // 1. Split Ref / Date bar ("Ref: ... | Date: ...")
      if (para.includes('|') && /^ref\s*:/i.test(para)) {
        const [leftPart, ...rest] = para.split('|')
        blocks.push({
          type: 'ref_date_row',
          left: leftPart.trim(),
          right: rest.join('|').trim(),
        })
        continue
      }

      // 2. Subject line ("# RE: ..." or standalone "**RE: ...**")
      if (para.startsWith('# ')) {
        blocks.push({
          type: 'subject',
          text: para.slice(2).trim(),
        })
        continue
      }

      if (/^(\*\*)?RE\s*:/i.test(para)) {
        blocks.push({
          type: 'subject',
          text: para.replace(/^\*\*|\*\*$/g, '').trim(),
        })
        continue
      }

      // 3. Special / Additional notes callout
      if (/^(\*\*)?(Special Notes|Additional Notes[^:]*):/i.test(para)) {
        blocks.push({
          type: 'note',
          text: para,
        })
        continue
      }

      blocks.push({
        type: 'paragraph',
        text: para,
      })
    }
  }

  return blocks
}
