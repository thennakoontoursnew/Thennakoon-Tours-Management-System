import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

export interface DocumentMargins {
  top: number
  bottom: number
  left: number
  right: number
  width: number
}

// A4 Margins (for non-agreement sales documents like Quotation, Invoice, Receipt)
export const A4_MARGINS: DocumentMargins = {
  top: 48,
  bottom: 260,
  left: 15,
  right: 195,
  width: 180,
}

// US LEGAL Margins (8.5 x 14 in / 215.9 x 355.6 mm) for ALL Agreements
export const LEGAL_PAPER_SIZE_MM = {
  width: 215.9,
  height: 355.6,
}

export const LEGAL_MARGINS: DocumentMargins = {
  top: 48,
  bottom: 330,
  left: 15,
  right: 200.9,
  width: 185.9,
}

// Convert image URL or path to base64 for jsPDF rendering
export async function getLetterheadBase64(): Promise<string | null> {
  try {
    if (typeof window !== 'undefined') {
      const response = await fetch('/documents/thennakoon-tours-letterhead.png')
      if (!response.ok) return null
      const blob = await response.blob()
      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.onerror = () => resolve(null)
        reader.readAsDataURL(blob)
      })
    }
    return null
  } catch (err) {
    console.error('Failed to load letterhead image', err)
    return null
  }
}

// Draw letterhead background image on the CURRENT A4 page
export function drawLetterheadOnPage(doc: jsPDF, base64Img: string | null) {
  if (!base64Img) return
  try {
    doc.addImage(base64Img, 'PNG', 0, 0, 210, 297)
  } catch (err) {
    console.error('Error drawing letterhead on page', err)
  }
}

// Draw letterhead background image on the CURRENT US Legal page (215.9 x 355.6 mm)
export function drawLetterheadOnLegalPage(doc: jsPDF, base64Img: string | null) {
  if (!base64Img) return
  try {
    doc.addImage(base64Img, 'PNG', 0, 0, 215.9, 355.6)
  } catch (err) {
    console.error('Error drawing legal letterhead on page', err)
  }
}

// Draw letterhead background image on all existing pages of an A4 jsPDF document
export function drawLetterheadBackground(doc: jsPDF, base64Img: string | null) {
  if (!base64Img) return
  const totalPages = (doc as any).internal.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.addImage(base64Img, 'PNG', 0, 0, 210, 297)
  }
}

// Draw letterhead background image on all existing pages of a US Legal jsPDF document
export function drawLetterheadBackgroundLegal(doc: jsPDF, base64Img: string | null) {
  if (!base64Img) return
  const totalPages = (doc as any).internal.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.addImage(base64Img, 'PNG', 0, 0, 215.9, 355.6)
  }
}

export { jsPDF, autoTable }
