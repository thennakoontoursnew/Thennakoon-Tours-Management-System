'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  FileText,
  Calendar,
  Receipt,
  CheckCircle,
  Car,
  UserSquare2,
  Navigation,
  Wrench,
  DollarSign,
  CalendarDays,
  Megaphone,
  Cpu,
  BarChart3,
  UserCog,
  Settings,
  FileSpreadsheet,
  Menu,
  ChevronLeft,
  ChevronRight,
  LogOut,
  ShieldCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarProps {
  role: string
  fullName: string
  onLogout: () => Promise<void>
}

interface MenuItem {
  title: string
  href: string
  icon: any
  roles: string[]
}

interface MenuSection {
  title: string
  items: MenuItem[]
}

export function Sidebar({ role, fullName, onLogout }: SidebarProps) {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const menuSections: MenuSection[] = [
    {
      title: 'Overview',
      items: [
        {
          title: 'Dashboard',
          href: '/dashboard',
          icon: LayoutDashboard,
          roles: ['owner', 'manager', 'booking_staff', 'operations_staff', 'marketing_staff', 'finance_staff', 'viewer'],
        },
      ],
    },
    {
      title: 'Sales & CRM',
      items: [
        {
          title: 'Customers',
          href: '/dashboard/customers',
          icon: Users,
          roles: ['owner', 'manager', 'booking_staff', 'operations_staff', 'marketing_staff', 'finance_staff', 'viewer'],
        },
        {
          title: 'Quotations',
          href: '/dashboard/quotations',
          icon: FileText,
          roles: ['owner', 'manager', 'booking_staff', 'viewer'],
        },
        {
          title: 'Bookings',
          href: '/dashboard/bookings',
          icon: Calendar,
          roles: ['owner', 'manager', 'booking_staff', 'viewer'],
        },
        {
          title: 'Invoices',
          href: '/dashboard/invoices',
          icon: Receipt,
          roles: ['owner', 'manager', 'booking_staff', 'finance_staff', 'viewer'],
        },
        {
          title: 'Receipts',
          href: '/dashboard/receipts',
          icon: CheckCircle,
          roles: ['owner', 'manager', 'booking_staff', 'finance_staff', 'viewer'],
        },
        {
          title: 'Agreements',
          href: '/dashboard/agreements',
          icon: FileText,
          roles: ['owner', 'manager', 'booking_staff', 'operations_staff', 'finance_staff', 'viewer'],
        },
      ],
    },
    {
      title: 'Fleet Operations',
      items: [
        {
          title: 'Vehicles',
          href: '/dashboard/vehicles',
          icon: Car,
          roles: ['owner', 'manager', 'booking_staff', 'operations_staff', 'marketing_staff', 'finance_staff', 'viewer'],
        },
        {
          title: 'Drivers',
          href: '/dashboard/drivers',
          icon: UserSquare2,
          roles: ['owner', 'manager', 'operations_staff', 'finance_staff', 'viewer'],
        },
        {
          title: 'Fleet Tracking',
          href: '/dashboard/fleet',
          icon: Navigation,
          roles: ['owner', 'manager', 'operations_staff', 'viewer'],
        },
        {
          title: 'Maintenance',
          href: '/dashboard/maintenance',
          icon: Wrench,
          roles: ['owner', 'manager', 'operations_staff', 'viewer'],
        },
        {
          title: 'Expenses',
          href: '/dashboard/expenses',
          icon: DollarSign,
          roles: ['owner', 'manager', 'finance_staff', 'viewer'],
        },
      ],
    },
    {
      title: 'Marketing',
      items: [
        {
          title: 'Content Calendar',
          href: '/dashboard/marketing/calendar',
          icon: CalendarDays,
          roles: ['owner', 'marketing_staff', 'viewer'],
        },
        {
          title: 'Campaigns',
          href: '/dashboard/marketing/campaigns',
          icon: Megaphone,
          roles: ['owner', 'marketing_staff', 'viewer'],
        },
        {
          title: 'AI Tools',
          href: '/dashboard/ai-tools',
          icon: Cpu,
          roles: ['owner', 'marketing_staff', 'viewer'],
        },
      ],
    },
    {
      title: 'Analytics',
      items: [
        {
          title: 'Reports',
          href: '/dashboard/reports',
          icon: BarChart3,
          roles: ['owner', 'manager', 'finance_staff', 'marketing_staff', 'viewer'],
        },
      ],
    },
    {
      title: 'Administration',
      items: [
        {
          title: 'User Manager',
          href: '/dashboard/users',
          icon: UserCog,
          roles: ['owner'],
        },
        {
          title: 'Company Settings',
          href: '/dashboard/settings',
          icon: Settings,
          roles: ['owner'],
        },
        {
          title: 'Document Templates',
          href: '/dashboard/document-templates',
          icon: FileSpreadsheet,
          roles: ['owner', 'admin', 'manager'],
        },
      ],
    },
  ]

  // Filter sections and items based on role
  const filteredSections = menuSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => item.roles.includes(role)),
    }))
    .filter((section) => section.items.length > 0)

  // Format user role label
  const getRoleLabel = (roleName: string) => {
    return roleName.split('_').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
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
          <div className="flex flex-col">
            <span className="font-bold text-amber-400 text-sm tracking-wide">THENNAKOON</span>
            <span className="text-slate-400 text-[10px] uppercase font-semibold">Tours Management</span>
          </div>
        )}
        {isCollapsed && (
          <span className="font-black text-amber-400 text-center w-full text-lg">T</span>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-850 cursor-pointer hidden md:block"
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {filteredSections.map((section, idx) => (
          <div key={idx} className="space-y-1">
            {!isCollapsed && (
              <h3 className="text-slate-500 text-[10px] uppercase font-bold tracking-widest px-3 mb-2">
                {section.title}
              </h3>
            )}
            <div className="space-y-0.5">
              {section.items.map((item, itemIdx) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                const Icon = item.icon
                return (
                  <Link
                    key={itemIdx}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative',
                      isActive
                        ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/10'
                        : 'text-slate-350 hover:bg-slate-800/60 hover:text-white'
                    )}
                  >
                    <Icon
                      size={20}
                      className={cn(
                        'shrink-0 transition-transform',
                        isActive ? 'text-slate-950' : 'text-slate-400 group-hover:scale-105'
                      )}
                    />
                    {!isCollapsed && <span className="truncate">{item.title}</span>}
                    {isCollapsed && (
                      <div className="absolute left-full ml-2 px-2 py-1 bg-slate-950 text-slate-100 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-lg border border-slate-800">
                        {item.title}
                      </div>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* User Info & Logout */}
      <div className="p-3 border-t border-slate-800 bg-slate-950">
        <div className={cn('flex items-center gap-3', isCollapsed ? 'justify-center' : 'px-2 py-1')}>
          <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
            <span className="font-bold text-amber-400 uppercase">
              {fullName ? fullName.charAt(0) : 'U'}
            </span>
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{fullName}</p>
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
            'flex items-center gap-3 w-full mt-3 px-3 py-2 text-slate-400 hover:text-rose-400 rounded-lg text-xs font-semibold hover:bg-slate-900 transition-colors cursor-pointer',
            isCollapsed ? 'justify-center' : ''
          )}
        >
          <LogOut size={16} className="shrink-0" />
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  )
}
