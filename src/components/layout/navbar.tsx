'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Menu, X, Bell, Calendar, ChevronRight, User } from 'lucide-react'
import { Sidebar } from './sidebar'

interface NavbarProps {
  role: string
  fullName: string
  onLogout: () => Promise<void>
}

export function Navbar({ role, fullName, onLogout }: NavbarProps) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [currentTime, setCurrentTime] = useState('')

  // Update clock in Asia/Colombo timezone
  useEffect(() => {
    const updateTime = () => {
      const options: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Colombo',
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      }
      setCurrentTime(new Intl.DateTimeFormat('en-US', options).format(new Date()))
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  // Generate breadcrumbs from pathname
  const generateBreadcrumbs = () => {
    const paths = pathname.split('/').filter((x) => x)
    return paths.map((path, idx) => {
      const href = '/' + paths.slice(0, idx + 1).join('/')
      const label = path
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')

      return { label, href, isLast: idx === paths.length - 1 }
    })
  }

  const breadcrumbs = generateBreadcrumbs()

  return (
    <>
      <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sticky top-0 z-20 shadow-sm">
        {/* Left Side: Mobile Menu Button & Breadcrumbs */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsOpen(true)}
            className="md:hidden p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-850 cursor-pointer"
          >
            <Menu size={20} />
          </button>

          {/* Breadcrumbs */}
          <nav className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <Link
              href="/dashboard"
              className="hover:text-amber-500 dark:hover:text-amber-400 transition-colors"
            >
              System
            </Link>
            {breadcrumbs.map((crumb, idx) => (
              <span key={idx} className="flex items-center gap-1.5">
                <ChevronRight size={12} className="text-slate-400" />
                {crumb.isLast ? (
                  <span className="text-slate-900 dark:text-slate-100 font-bold">
                    {crumb.label}
                  </span>
                ) : (
                  <Link
                    href={crumb.href}
                    className="hover:text-amber-500 dark:hover:text-amber-400 transition-colors"
                  >
                    {crumb.label}
                  </Link>
                )}
              </span>
            ))}
          </nav>
        </div>

        {/* Right Side: Clock, Notification, Profile */}
        <div className="flex items-center gap-4">
          {/* Timezone Clock (Colombo) */}
          <div className="hidden lg:flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-350 bg-slate-100 dark:bg-slate-850 px-3 py-1.5 rounded-full border border-slate-200/50 dark:border-slate-800">
            <Calendar size={14} className="text-amber-500" />
            <span>{currentTime || 'Loading Time...'} (Asia/Colombo)</span>
          </div>

          {/* Notification Placeholder */}
          <button className="relative p-2 text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-850 cursor-pointer transition-colors">
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full ring-2 ring-white dark:ring-slate-900"></span>
          </button>

          {/* Profile Name & Badge */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-sm font-semibold text-slate-900 dark:text-white leading-tight">
                {fullName}
              </span>
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider">
                {role.replace('_', ' ')}
              </span>
            </div>
            <div className="w-9 h-9 rounded-full bg-amber-400 text-slate-900 flex items-center justify-center font-bold text-sm border border-amber-300 shadow-sm">
              {fullName ? fullName.charAt(0).toUpperCase() : <User size={16} />}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsOpen(false)}
          ></div>

          {/* Drawer Content */}
          <div className="relative flex flex-col w-64 max-w-xs h-full bg-slate-900 shadow-2xl transition-transform animate-in slide-in-from-left duration-200">
            {/* Close Button inside Drawer Header */}
            <div className="absolute top-3 right-3 z-55">
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Sidebar Shell embedded inside mobile drawer */}
            <div className="h-full flex-1" onClick={() => setIsOpen(false)}>
              <Sidebar role={role} fullName={fullName} onLogout={onLogout} />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
