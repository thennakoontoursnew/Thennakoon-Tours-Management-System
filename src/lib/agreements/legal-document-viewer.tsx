'use client'

import React from 'react'
import { AgreementSection } from './section-template-renderer'

interface LegalDocumentViewerProps {
  content?: string
  sections?: AgreementSection[]
  companyRepSignatureUrl?: string | null
  companySealUrl?: string | null
  recipientSignatureUrl?: string | null
  companyRepName?: string | null
  recipientName?: string | null
  recipientRoleLabel?: string
}

/**
 * Parses and renders legal markdown text or structured sections into elegant, print-ready legal document sections.
 * Automatically styles headings, bold terms, bullet schedules, and preserves avoid-break on signature blocks.
 */
export function LegalDocumentViewer({
  content,
  sections,
  companyRepSignatureUrl,
  companySealUrl,
  recipientSignatureUrl,
  companyRepName,
  recipientName,
  recipientRoleLabel = 'Authorized Signatory',
}: LegalDocumentViewerProps) {
  const renderSignatoriesVisualStrip = () => (
    <div className="mt-4 pt-3 grid grid-cols-2 gap-10 font-sans text-[11px] text-slate-900 avoid-break">
      <div className="flex flex-col">
        <p className="text-[10px] font-bold uppercase text-slate-600">
          For &amp; On Behalf of Thennakoon Tours (Pvt) Ltd
        </p>
        <div className="h-[54px] flex items-end my-1">
          {companyRepSignatureUrl && (
            <img
              src={companyRepSignatureUrl}
              alt="Company Representative Signature"
              className="h-[42px] max-w-[160px] object-contain object-left pb-0.5"
            />
          )}
          {companySealUrl && (
            <img
              src={companySealUrl}
              alt="Official Company Seal"
              className={`h-[52px] w-[52px] object-contain opacity-90 pointer-events-none select-none ${
                companyRepSignatureUrl ? '-ml-3' : ''
              }`}
            />
          )}
        </div>
        <div className="border-t border-dotted border-slate-500 pt-1">
          <span className="font-bold text-slate-900">{companyRepName || 'Authorized Signatory'}</span>
        </div>
      </div>

      <div className="flex flex-col">
        <p className="text-[10px] font-bold uppercase text-slate-600">{recipientRoleLabel}</p>
        <div className="h-[54px] flex items-end my-1">
          {recipientSignatureUrl && (
            <img
              src={recipientSignatureUrl}
              alt="Recipient Saved E-Signature"
              className="h-[42px] max-w-[160px] object-contain object-left pb-0.5"
            />
          )}
        </div>
        <div className="border-t border-dotted border-slate-500 pt-1">
          <span className="font-bold text-slate-900">{recipientName || 'Signature'}</span>
        </div>
      </div>
    </div>
  )

  if (sections && Array.isArray(sections) && sections.length > 0) {
    const sorted = [...sections].sort((a, b) => (a.order || 0) - (b.order || 0))
    return (
      <div className="space-y-4 text-justify leading-[1.65] font-serif text-[12px] text-slate-900">
        {sorted.map((sec, sIdx) => {
          const isSignatories =
            sec.is_signatories ||
            (sec.title && (sec.title.toUpperCase().includes('SIGNATOR') || sec.title.toUpperCase().includes('WITNESS')))
          const isSchedule = sec.is_schedule || (sec.title && sec.title.toUpperCase().includes('SCHEDULE'))

          return (
            <div
              key={sec.id || sIdx}
              className={`space-y-2 text-justify ${
                isSignatories || isSchedule ? 'avoid-break pt-3' : 'avoid-break'
              }`}
            >
              {sec.title && (
                <h2 className="font-sans font-bold text-slate-900 uppercase tracking-wide text-[12px] border-b border-slate-300 pb-1 mt-3">
                  {sec.title}
                </h2>
              )}
              {isSignatories && renderSignatoriesVisualStrip()}
              {renderParagraphs(sec.body)}
            </div>
          )
        })}
      </div>
    )
  }

  if (!content) return null

  // Split content into major sections by "### "
  const rawSections = content.split(/\n(?=###\s+)/)

  return (
    <div className="space-y-4 text-justify leading-[1.65] font-serif text-[12px] text-slate-900">
      {rawSections.map((section, sIdx) => {
        const trimmed = section.trim()
        if (!trimmed) return null

        // If section starts with ###, it's a legal clause or schedule
        if (trimmed.startsWith('### ')) {
          const firstLineEnd = trimmed.indexOf('\n')
          const heading = firstLineEnd !== -1 ? trimmed.slice(4, firstLineEnd).trim() : trimmed.slice(4).trim()
          const body = firstLineEnd !== -1 ? trimmed.slice(firstLineEnd).trim() : ''

          const isSignatories = heading.toUpperCase().includes('SIGNATOR') || heading.toUpperCase().includes('WITNESS')
          const isSchedule = heading.toUpperCase().includes('SCHEDULE')

          return (
            <div
              key={sIdx}
              className={`space-y-2 text-justify ${
                isSignatories || isSchedule ? 'avoid-break pt-3' : 'avoid-break'
              }`}
            >
              <h2 className="font-sans font-bold text-slate-900 uppercase tracking-wide text-[12px] border-b border-slate-300 pb-1 mt-3">
                {heading}
              </h2>
              {isSignatories && renderSignatoriesVisualStrip()}
              {renderParagraphs(body)}
            </div>
          )
        }

        // Otherwise it's preamble or top heading
        return (
          <div key={sIdx} className="space-y-2.5 text-justify">
            {renderParagraphs(trimmed)}
          </div>
        )
      })}
    </div>
  )
}

function renderParagraphs(text: string) {
  if (!text) return null
  const paragraphs = text.split(/\n\n+/)

  return paragraphs.map((para, pIdx) => {
    const trimmedPara = para.trim()
    if (!trimmedPara) return null

    // Main Title #
    if (trimmedPara.startsWith('# ')) {
      return (
        <h1 key={pIdx} className="font-sans font-black text-center uppercase tracking-wide text-base text-slate-900 border-b-2 border-slate-900 pb-2 mb-3">
          {trimmedPara.slice(2).trim()}
        </h1>
      )
    }

    // List items (e.g. Schedule rows or bullet points)
    if (trimmedPara.includes('\n- ') || trimmedPara.startsWith('- ') || trimmedPara.startsWith('• ')) {
      const items = trimmedPara.split(/\n[-•]\s*/).filter(Boolean)
      return (
        <div key={pIdx} className="my-2 p-3 bg-slate-50 border border-slate-300 rounded font-sans text-[11px] space-y-1 avoid-break">
          {items.map((item, iIdx) => (
            <div key={iIdx} className="flex gap-2">
              <span className="text-slate-400 font-bold">•</span>
              <div>{renderInlineFormatting(item.trim())}</div>
            </div>
          ))}
        </div>
      )
    }

    // Indented parties block or preamble
    if (trimmedPara.startsWith('1. ') || trimmedPara.startsWith('2. ')) {
      return (
        <div key={pIdx} className="pl-4 border-l-2 border-slate-300 my-2">
          <p>{renderInlineFormatting(trimmedPara)}</p>
        </div>
      )
    }

    return (
      <p key={pIdx} className="text-justify my-1.5">
        {renderInlineFormatting(trimmedPara)}
      </p>
    )
  })
}

function renderInlineFormatting(text: string): React.ReactNode {
  // Simple token parser for **bold** and *(italic)*
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)

  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={idx} className="font-bold text-slate-950">{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={idx} className="italic text-slate-700">{part.slice(1, -1)}</em>
    }
    return part
  })
}
