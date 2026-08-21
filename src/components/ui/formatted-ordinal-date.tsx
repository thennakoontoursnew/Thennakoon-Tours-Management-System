import React from 'react'
import { getOrdinalSuffix } from '@/lib/utils/formatters'

const MONTH_NAMES_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

interface FormattedOrdinalDateProps {
  date: string | Date | null | undefined
  className?: string
}

export function FormattedOrdinalDate({ date, className = '' }: FormattedOrdinalDateProps) {
  if (!date) return null

  try {
    const str = String(date).trim()
    if (!str || str.toLowerCase() === 'n/a' || str.toLowerCase() === 'null') return null

    let day: number
    let monthIdx: number
    let year: number

    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      const [y, m, d] = str.split('-').map(Number)
      year = y
      monthIdx = m - 1
      day = d
    } else {
      const dateObj = new Date(str)
      if (isNaN(dateObj.getTime())) return <span className={className}>{String(date)}</span>
      day = dateObj.getDate()
      monthIdx = dateObj.getMonth()
      year = dateObj.getFullYear()
    }

    if (day < 1 || day > 31 || monthIdx < 0 || monthIdx > 11) {
      return <span className={className}>{String(date)}</span>
    }

    const suffix = getOrdinalSuffix(day)
    const month = MONTH_NAMES_SHORT[monthIdx]

    return (
      <span className={`inline-flex items-baseline ${className}`}>
        <span>{day}</span>
        <sup className="text-[10px] leading-none ml-[0.5px] font-normal">{suffix}</sup>
        <span className="ml-1">{month} {year}</span>
      </span>
    )
  } catch {
    return <span className={className}>{String(date)}</span>
  }
}
