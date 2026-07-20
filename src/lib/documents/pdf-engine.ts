import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

export interface DocumentMargins {
  top: number
  bottom: number
  left: number
  right: number
  width: number
}

export const A4_MARGINS: DocumentMargins = {
  top: 48,
  bottom: 260,
  left: 15,
  right: 195,
  width: 180,
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

// Draw letterhead background image on the CURRENT page
export function drawLetterheadOnPage(doc: jsPDF, base64Img: string | null) {
  if (!base64Img) return
  try {
    doc.addImage(base64Img, 'PNG', 0, 0, 210, 297)
  } catch (err) {
    console.error('Error drawing letterhead on page', err)
  }
}

// Draw letterhead background image on all existing pages of a jsPDF document
export function drawLetterheadBackground(doc: jsPDF, base64Img: string | null) {
  if (!base64Img) return
  const totalPages = (doc as any).internal.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.addImage(base64Img, 'PNG', 0, 0, 210, 297)
  }
}

export { jsPDF, autoTable }
