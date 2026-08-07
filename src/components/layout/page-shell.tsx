'use client'

import React from 'react'
import Link from 'next/link'
import { LucideIcon, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2.5 flex-wrap">{actions}</div>}
    </div>
  )
}

interface PageContainerProps {
  children: React.ReactNode
  className?: string
}

export function PageContainer({ children, className }: PageContainerProps) {
  return <div className={cn('space-y-6 max-w-7xl mx-auto pb-12', className)}>{children}</div>
}

interface SectionCardProps {
  title?: string
  subtitle?: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
}

export function SectionCard({ title, subtitle, action, children, className }: SectionCardProps) {
  return (
    <div className={cn('bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm', className)}>
      {title && (
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-2 h-5 bg-amber-400 rounded-full"></div>
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white text-sm">{title}</h2>
              {subtitle && <p className="text-[11px] text-slate-400">{subtitle}</p>}
            </div>
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  )
}

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  iconColor?: string
  href?: string
}

export function StatCard({ title, value, subtitle, icon: Icon, iconColor = 'text-amber-500 bg-amber-500/10', href }: StatCardProps) {
  const CardContent = (
    <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3 hover:border-amber-400/50 transition-all">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</span>
        <div className={cn('p-2 rounded-xl', iconColor)}>
          <Icon size={18} />
        </div>
      </div>
      <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">{value}</div>
      {subtitle && <p className="text-[11px] text-slate-400 font-medium">{subtitle}</p>}
    </div>
  )

  if (href) {
    return <Link href={href}>{CardContent}</Link>
  }

  return CardContent
}

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description: string
  action?: React.ReactNode
}

export function EmptyState({ icon: Icon = AlertCircle, title, description, action }: EmptyStateProps) {
  return (
    <div className="py-16 px-4 text-center space-y-3 bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg mx-auto my-6">
      <div className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-2xl w-fit mx-auto">
        <Icon size={28} />
      </div>
      <h3 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h3>
      <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">{description}</p>
      {action && <div className="pt-2">{action}</div>}
    </div>
  )
}
