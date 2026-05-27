'use client'

import { cn } from '@/lib/utils/cn'
import { Loader2 } from 'lucide-react'
import type { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  loading?: boolean
  children?: React.ReactNode
}

const VARIANTS: Record<string, string> = {
  primary:   'bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm',
  secondary: 'bg-white/[0.07] text-white/70 border border-white/[0.1] hover:bg-white/[0.12]',
  ghost:     'bg-transparent text-white/50 hover:bg-white/[0.07]',
  danger:    'bg-red-600 text-white hover:bg-red-500 shadow-sm',
  success:   'bg-green-600 text-white hover:bg-green-500 shadow-sm',
}

const SIZES: Record<string, string> = {
  sm:   'h-8 px-3 text-xs gap-1.5',
  md:   'h-9 px-4 text-sm gap-2',
  lg:   'h-10 px-5 text-sm gap-2',
  icon: 'h-8 w-8 p-0',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-medium rounded-lg',
        'transition-all duration-150 active:scale-[0.98]',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...props}
    >
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
      {children}
    </button>
  )
}
