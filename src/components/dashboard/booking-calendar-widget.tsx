'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CalendarEvent } from '@/lib/dashboard/dashboard-service'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, ArrowUpRight } from 'lucide-react'

interface BookingCalendarWidgetProps {
  initialEvents: CalendarEvent[]
}

export function BookingCalendarWidget({ initialEvents }: BookingCalendarWidgetProps) {
  const [currentYear, setCurrentYear] = useState(2026)
  const [currentMonth, setCurrentMonth] = useState(8) // August 2026

  const events = initialEvents || []

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ]

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  const handleToday = () => {
    setCurrentYear(2026)
    setCurrentMonth(8)
  }

  // Days in target month
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate()
  const firstDayIndex = new Date(currentYear, currentMonth - 1, 1).getDay()

  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const blankArray = Array.from({ length: firstDayIndex }, (_, i) => i)

  const getEventsForDay = (day: number) => {
    const dayStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return events.filter((e) => e.start_date <= dayStr && e.end_date >= dayStr)
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 shadow-xs">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-2 h-5 bg-amber-400 rounded-full"></div>
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white text-sm">Booking Calendar</h2>
            <p className="text-[11px] text-slate-400">Monthly schedule overview</p>
          </div>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-900 dark:text-white mr-2">
            {monthNames[currentMonth - 1]} {currentYear}
          </span>
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={handlePrevMonth}
              className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={handleToday}
              className="px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
            >
              Today
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
              title="Next Month"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="space-y-1">
        {/* Days of Week Header */}
        <div className="grid grid-cols-7 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400 pb-2">
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>

        {/* Month Days Grid */}
        <div className="grid grid-cols-7 gap-1 border border-slate-100 dark:border-slate-800 rounded-xl p-1 bg-slate-50/50 dark:bg-slate-950/50">
          {blankArray.map((_, idx) => (
            <div key={`blank-${idx}`} className="h-16 rounded-lg bg-transparent" />
          ))}

          {daysArray.map((day) => {
            const dayEvents = getEventsForDay(day)
            const isToday = day === 7 && currentMonth === 8 && currentYear === 2026
            return (
              <div
                key={day}
                className={`h-16 rounded-lg p-1 border transition-colors flex flex-col justify-between overflow-hidden ${
                  isToday
                    ? 'border-amber-400 bg-amber-500/10'
                    : 'border-slate-100 dark:border-slate-850 bg-white dark:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold ${isToday ? 'text-amber-500 font-mono' : 'text-slate-400'}`}>
                    {day}
                  </span>
                  {dayEvents.length > 0 && (
                    <span className="text-[9px] font-bold px-1 rounded bg-amber-400 text-slate-950">
                      {dayEvents.length}
                    </span>
                  )}
                </div>

                <div className="space-y-0.5 overflow-hidden">
                  {dayEvents.slice(0, 1).map((evt) => (
                    <Link
                      key={evt.id}
                      href={`/dashboard/bookings/${evt.id}`}
                      className="block truncate text-[9px] font-bold px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-amber-400 hover:text-slate-950 text-slate-700 dark:text-slate-300 transition-colors"
                      title={`${evt.booking_number} — ${evt.customer_name} (${evt.vehicle_name})`}
                    >
                      {evt.booking_number}
                    </Link>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
