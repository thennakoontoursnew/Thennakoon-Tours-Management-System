'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import * as LucideIcons from 'lucide-react'
import { getFilteredNavigation, NavigationItem } from '@/lib/navigation/navigation-config'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight, LogOut, ShieldCheck } from 'lucide-react'

interface SidebarProps {
  role: string
  fullName: string
  onLogout: () => Promise<void>
}

export function Sidebar({ role, fullName, onLogout }: SidebarProps) {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)

  const [showUpcoming, setShowUpcoming] = useState(false)

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem('sidebar_collapsed')
    if (stored === 'true') {
      setIsCollapsed(true)
    }
    const storedUpcoming = localStorage.getItem('show_upcoming_modules')
    if (storedUpcoming === 'true') {
      setShowUpcoming(true)
    }
  }, [])

  const toggleCollapse = () => {
    const nextState = !isCollapsed
    setIsCollapsed(nextState)
    localStorage.setItem('sidebar_collapsed', String(nextState))
  }

  const sections = getFilteredNavigation(role, showUpcoming)

  const getRoleLabel = (roleName: string) => {
    return roleName.split('_').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }

  const renderIcon = (iconName: string, isActive: boolean) => {
    const IconComponent = (LucideIcons as any)[iconName] || LucideIcons.FileText
    return (
      <IconComponent
        size={19}
        className={cn(
          'shrink-0 transition-transform',
          isActive ? 'text-slate-950' : 'text-slate-400 group-hover:scale-105'
        )}
      />
    )
  }

  return (
    <aside
      className={cn(
        'bg-slate-900 text-slate-100 flex flex-col transition-all duration-300 border-r border-slate-800 z-30 h-screen sticky top-0',
        isCollapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Sidebar Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800 bg-slate-950">
        {!isCollapsed && (
          <Link href="/dashboard" className="flex flex-col">
            <span className="font-black text-amber-400 text-sm tracking-wide">THENNAKOON</span>
            <span className="text-slate-400 text-[10px] uppercase font-semibold">Tours Management</span>
          </Link>
        )}
        {isCollapsed && (
          <Link href="/dashboard" className="font-black text-amber-400 text-center w-full text-lg">
            T
          </Link>
        )}
        <button
          onClick={toggleCollapse}
          className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-850 cursor-pointer hidden md:block"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-800">
        {sections.map((section) => (
          <div key={section.id} className="space-y-1">
            {!isCollapsed && (
              <h3 className="text-slate-500 text-[10px] uppercase font-bold tracking-widest px-3 mb-2">
                {section.title}
              </h3>
            )}
            <div className="space-y-0.5">
              {section.items.map((item: NavigationItem) => {
                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group relative',
                      isActive
                        ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/10 font-bold'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    )}
                  >
                    {renderIcon(item.iconName, isActive)}
                    {!isCollapsed && <span className="truncate flex-1">{item.label}</span>}

                    {!isCollapsed && item.badge && (
                      <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        {item.badge}
                      </span>
                    )}

                    {/* Tooltip for collapsed sidebar mode */}
                    {isCollapsed && (
                      <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-950 text-slate-100 text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-xl border border-slate-800">
                        {item.label}
                        {item.badge && <span className="ml-1 text-[9px] text-amber-400">({item.badge})</span>}
                      </div>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* User Info Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950">
        <div className={cn('flex items-center gap-3', isCollapsed ? 'justify-center' : 'px-2 py-1')}>
          <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
            <span className="font-bold text-amber-400 uppercase text-xs">
              {fullName ? fullName.charAt(0) : 'U'}
            </span>
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">{fullName}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <ShieldCheck size={12} className="text-amber-400 shrink-0" />
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold truncate">
                  {getRoleLabel(role)}
                </p>
              </div>
            </div>
          )}
        </div>
        <button
          onClick={onLogout}
          className={cn(
            'flex items-center gap-3 w-full mt-3 px-3 py-2 text-slate-400 hover:text-rose-400 rounded-xl text-xs font-semibold hover:bg-slate-900 transition-colors cursor-pointer',
            isCollapsed ? 'justify-center' : ''
          )}
          title="Sign Out"
        >
          <LogOut size={16} className="shrink-0" />
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  )
}
