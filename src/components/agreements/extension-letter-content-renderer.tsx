'use client'

import React from 'react'
import { AgreementSection } from '@/lib/agreements/section-template-renderer'
import {
  parseExtensionLetterBlocks,
  ExtensionRenderBlock,
} from '@/lib/agreements/extension-template-renderer'

function renderInlineMarkdown(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={idx} className="font-bold text-slate-950">
          {part.slice(2, -2)}
        </strong>
      )
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <em key={idx} className="italic text-slate-700">
          {part.slice(1, -1)}
        </em>
      )
    }
    return part
  })
}

export function ExtensionLetterContentRenderer({
  sections,
  content,
}: {
  sections?: AgreementSection[] | null
  content?: string | null
}) {
  const blocks: ExtensionRenderBlock[] = parseExtensionLetterBlocks(sections, content)
  if (blocks.length === 0) return null

  return (
    <div className="space-y-2.5 text-[12.5px] leading-[1.55] text-slate-800">
      {blocks.map((block, idx) => {
        if (block.type === 'ref_date_row') {
          return (
            <div
              key={idx}
              className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-300/80 pb-1.5 mb-2 text-[12px] font-sans font-bold text-slate-900"
            >
              <span>{renderInlineMarkdown(block.left)}</span>
              <span>{renderInlineMarkdown(block.right)}</span>
            </div>
          )
        }

        if (block.type === 'subject') {
          return (
            <div key={idx} className="pt-0.5 pb-0.5 mb-2">
              <h1 className="font-sans text-[13px] font-extrabold uppercase tracking-tight text-slate-950 underline underline-offset-4 decoration-slate-800">
                {renderInlineMarkdown(block.text)}
              </h1>
            </div>
          )
        }

        if (block.type === 'note') {
          return (
            <p
              key={idx}
              className="text-justify bg-slate-50/85 border-l-2 border-slate-400 pl-3 py-1 mb-2.5 text-[12px] whitespace-pre-line"
            >
              {renderInlineMarkdown(block.text)}
            </p>
          )
        }

        const isRecipientOrGreeting =
          /^To\s*:/i.test(block.text) || /^Dear\s+/i.test(block.text)

        return (
          <p
            key={idx}
            className={
              isRecipientOrGreeting
                ? 'font-sans text-[12.5px] text-slate-900 mb-2 whitespace-pre-line'
                : 'text-justify mb-2.5 whitespace-pre-line'
            }
          >
            {renderInlineMarkdown(block.text)}
          </p>
        )
      })}
    </div>
  )
}
