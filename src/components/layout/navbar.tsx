'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X, Bell, Calendar, Search, LogOut, Settings, ChevronDown } from 'lucide-react'
import { Sidebar } from './sidebar'
import { Breadcrumbs } from './breadcrumbs'
import { GlobalSearchModal } from './global-search-modal'
import { logout } from '@/app/auth-actions'

interface NavbarProps {
  role: string
  fullName: string
  onLogout?: () => Promise<void>
}

export function Navbar({ role, fullName, onLogout }: NavbarProps) {
  const handleLogout = async () => {
    if (onLogout) {
      await onLogout()
    } else {
      await logout()
    }
  }
  const [isOpen, setIsOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [currentTime, setCurrentTime] = useState('')

  // Update live clock in Asia/Colombo timezone
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

  const getRoleLabel = (roleName: string) => {
    return roleName.split('_').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }

  return (
    <>
      <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-20 shadow-xs">
        {/* Left Side: Mobile Drawer Trigger & Breadcrumbs */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsOpen(true)}
            className="md:hidden p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            aria-label="Open navigation drawer"
          >
            <Menu size={20} />
          </button>

          <Breadcrumbs />
        </div>

        {/* Right Side: Global Search, Colombo Clock, Notifications, User Menu */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Global Search Button */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-500 hover:border-amber-400/50 hover:text-slate-900 dark:hover:text-white transition-all text-xs font-medium cursor-pointer"
          >
            <Search size={14} className="text-amber-500 shrink-0" />
            <span className="hidden sm:inline">Search system...</span>
            <kbd className="hidden lg:inline-block text-[10px] font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 px-1.5 py-0.5 rounded shadow-2xs">
              ⌘K
            </kbd>
          </button>

          {/* Timezone Clock (Colombo) */}
          <div className="hidden xl:flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
            <Calendar size={14} className="text-amber-500 shrink-0" />
            <span>{currentTime || 'Loading Time...'} (Asia/Colombo)</span>
          </div>

          {/* Notification Button */}
          <button
            className="relative p-2 text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-slate-100 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
            title="System Notifications"
          >
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full ring-2 ring-white dark:ring-slate-900"></span>
          </button>

          {/* User Profile & Menu Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-sm shadow-xs border border-amber-300">
                {fullName ? fullName.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                  {fullName}
                </span>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider">
                  {getRoleLabel(role)}
                </span>
              </div>
              <ChevronDown size={14} className="text-slate-400 hidden md:block" />
            </button>

            {/* Dropdown Menu */}
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl z-50 p-1.5 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{fullName}</p>
                  <p className="text-[10px] text-slate-400 uppercase font-semibold mt-0.5">{getRoleLabel(role)}</p>
                </div>

                <Link
                  href="/dashboard/settings"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Settings size={15} className="text-slate-400" />
                  <span>Account Settings</span>
                </Link>

                <button
                  onClick={() => {
                    setIsUserMenuOpen(false)
                    handleLogout()
                  }}
                  className="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                >
                  <LogOut size={15} />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Search Modal */}
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsOpen(false)}
          ></div>

          {/* Drawer Content */}
          <div className="relative flex flex-col w-72 max-w-xs h-full bg-slate-900 shadow-2xl transition-transform animate-in slide-in-from-left duration-200">
            <div className="absolute top-3 right-3 z-55">
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="h-full flex-1" onClick={() => setIsOpen(false)}>
              <Sidebar role={role} fullName={fullName} onLogout={onLogout} />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
