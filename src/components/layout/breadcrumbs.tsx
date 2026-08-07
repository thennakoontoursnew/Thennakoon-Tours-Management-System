'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, Home } from 'lucide-react'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function Breadcrumbs() {
  const pathname = usePathname()

  const segments = pathname.split('/').filter(Boolean)

  if (segments.length === 0) return null

  const items = segments.map((segment, index) => {
    const href = '/' + segments.slice(0, index + 1).join('/')
    const isLast = index === segments.length - 1

    let label = segment
    if (UUID_REGEX.test(segment)) {
      label = 'Details'
    } else {
      label = segment
        .replace(/-/g, ' ')
        .replace(/_/g, ' ')
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')
    }

    return { label, href, isLast }
  })

  return (
    <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
      <Link
        href="/dashboard"
        className="flex items-center gap-1 hover:text-amber-500 dark:hover:text-amber-400 transition-colors"
      >
        <Home size={13} />
        <span>System</span>
      </Link>

      {items.map((item, idx) => (
        <span key={idx} className="flex items-center gap-1.5">
          <ChevronRight size={12} className="text-slate-400 shrink-0" />
          {item.isLast ? (
            <span className="text-slate-900 dark:text-slate-100 font-bold">
              {item.label}
            </span>
          ) : (
            <Link
              href={item.href}
              className="hover:text-amber-500 dark:hover:text-amber-400 transition-colors"
            >
              {item.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  )
}
