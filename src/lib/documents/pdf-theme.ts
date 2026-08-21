import { jsPDF } from 'jspdf'

// CANONICAL GLOBAL BRAND COLOR TOKENS FOR ALL OFFICIAL PDF DOCUMENTS
export const PDF_COLORS = {
  brandGold: {
    hex: '#997711',
    rgb: [153, 119, 17] as const,
  },
  dark: {
    hex: '#17171A',
    rgb: [23, 23, 26] as const,
  },
  body: {
    hex: '#374151',
    rgb: [55, 65, 81] as const,
  },
  muted: {
    hex: '#4B5563',
    rgb: [75, 85, 99] as const,
  },
  lightMuted: {
    hex: '#6B7280',
    rgb: [107, 114, 128] as const,
  },
  border: {
    hex: '#E5E7EB',
    rgb: [229, 231, 235] as const,
  },
  alternateRow: {
    hex: '#F9FAFB',
    rgb: [249, 250, 251] as const,
  },
  white: {
    hex: '#FFFFFF',
    rgb: [255, 255, 255] as const,
  },
} as const

// CANONICAL GLOBAL TYPOGRAPHY TOKENS (pt)
export const PDF_TYPOGRAPHY = {
  documentTitle: 23.5,
  invoiceNumber: 14.5,
  sectionHeading: 9.8,
  customerName: 10.0,
  body: 8.8,
  metadata: 8.8,
  tableHeader: 8.8,
  tableBody: 8.8,
  financialRow: 8.8,
  balanceDue: 10.5,
  notes: 8.5,
  preparedByName: 9.5,
  preparedByDetails: 8.5,
} as const

// CANONICAL GLOBAL SPACING TOKENS (mm)
export const PDF_SPACING = {
  headerToMetadataGap: 7,
  metadataToTableGap: 9,
  tableToFinanceGap: 10,
  financeToNotesGap: 11,
  notesToTermsGap: 9,
  termsToPreparedByGap: 13,
  metaRowHeight: 4.8,
  tableHeaderHeight: 9.5,
  tableRowHeight: 9,
  financialRowHeight: 5.2,
  balanceDueBarHeight: 10.5,
  notesLineHeight: 4.2,
} as const

// COLOR HELPER FUNCTIONS
export function setPdfBrandGoldText(doc: jsPDF) {
  doc.setTextColor(PDF_COLORS.brandGold.rgb[0], PDF_COLORS.brandGold.rgb[1], PDF_COLORS.brandGold.rgb[2])
}

export function setPdfBrandGoldFill(doc: jsPDF) {
  doc.setFillColor(PDF_COLORS.brandGold.rgb[0], PDF_COLORS.brandGold.rgb[1], PDF_COLORS.brandGold.rgb[2])
}

export function setPdfDarkText(doc: jsPDF) {
  doc.setTextColor(PDF_COLORS.dark.rgb[0], PDF_COLORS.dark.rgb[1], PDF_COLORS.dark.rgb[2])
}

export function setPdfDarkFill(doc: jsPDF) {
  doc.setFillColor(PDF_COLORS.dark.rgb[0], PDF_COLORS.dark.rgb[1], PDF_COLORS.dark.rgb[2])
}

export function setPdfBodyText(doc: jsPDF) {
  doc.setTextColor(PDF_COLORS.body.rgb[0], PDF_COLORS.body.rgb[1], PDF_COLORS.body.rgb[2])
}

export function setPdfMutedText(doc: jsPDF) {
  doc.setTextColor(PDF_COLORS.muted.rgb[0], PDF_COLORS.muted.rgb[1], PDF_COLORS.muted.rgb[2])
}

export function setPdfLightMutedText(doc: jsPDF) {
  doc.setTextColor(PDF_COLORS.lightMuted.rgb[0], PDF_COLORS.lightMuted.rgb[1], PDF_COLORS.lightMuted.rgb[2])
}

export function setPdfWhiteText(doc: jsPDF) {
  doc.setTextColor(PDF_COLORS.white.rgb[0], PDF_COLORS.white.rgb[1], PDF_COLORS.white.rgb[2])
}
