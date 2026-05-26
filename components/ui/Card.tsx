'use client'

import { cn } from '@/lib/utils/cn'

interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  onClick?: () => void
  accent?: 'green' | 'red' | 'amber' | 'blue' | 'emerald' | 'none'
  padding?: 'sm' | 'md' | 'lg'
}

export function Card({
  children,
  className,
  hover,
  onClick,
  accent = 'none',
  padding = 'md',
}: CardProps) {
  const accentClass: Record<string, string> = {
    green:   'border-t-2 border-t-green-500',
    red:     'border-t-2 border-t-red-500',
    amber:   'border-t-2 border-t-amber-500',
    blue:    'border-t-2 border-t-blue-500',
    emerald: 'border-t-2 border-t-emerald-500',
    none:    '',
  }

  const paddingClass: Record<string, string> = {
    sm: 'p-4',
    md: 'p-5',
    lg: 'p-6',
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white rounded-xl border border-gray-200 shadow-sm',
        paddingClass[padding],
        accentClass[accent],
        hover && 'transition-all duration-150 hover:shadow-md hover:-translate-y-px cursor-pointer',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  )
}

export function CardHeader({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex items-center justify-between mb-4', className)}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('text-xs font-semibold text-gray-400 uppercase tracking-wider', className)}>
      {children}
    </div>
  )
}
