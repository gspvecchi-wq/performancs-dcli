'use client'

import { cn } from '@/lib/utils/cn'
import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'

type KpiVariant = 'excelente' | 'bom' | 'risco' | 'neutro' | 'info'

const ACCENT: Record<KpiVariant, { bar: string; value: string; bg: string }> = {
  excelente: { bar: 'bg-emerald-500', value: 'text-emerald-700', bg: 'bg-emerald-50' },
  bom:       { bar: 'bg-green-500',   value: 'text-green-700',   bg: 'bg-green-50'   },
  risco:     { bar: 'bg-red-500',     value: 'text-red-600',     bg: 'bg-red-50'     },
  neutro:    { bar: 'bg-gray-400',    value: 'text-gray-700',    bg: 'bg-gray-50'    },
  info:      { bar: 'bg-blue-500',    value: 'text-blue-700',    bg: 'bg-blue-50'    },
}

interface KpiCardProps {
  label: string
  value: number | string
  sublabel?: string
  variant?: KpiVariant
  icon?: LucideIcon
  onClick?: () => void
  animateIn?: boolean
  index?: number
}

export function KpiCard({
  label,
  value,
  sublabel,
  variant = 'neutro',
  icon: Icon,
  onClick,
  animateIn = true,
  index = 0,
}: KpiCardProps) {
  const acc = ACCENT[variant]

  return (
    <motion.div
      initial={animateIn ? { opacity: 0, y: 12 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      onClick={onClick}
      className={cn(
        'relative bg-white rounded-xl border border-gray-200 px-5 py-5 overflow-hidden',
        'shadow-sm transition-all duration-150',
        onClick && 'cursor-pointer hover:shadow-md hover:-translate-y-px active:scale-[0.99]'
      )}
    >
      {/* Barra de acento no topo */}
      <div className={cn('absolute top-0 left-0 right-0 h-[3px]', acc.bar)} />

      <div className="flex items-start justify-between gap-3 pt-1">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
            {label}
          </p>
          <p className={cn('text-3xl font-bold leading-none tabular-nums', acc.value)}>
            {value}
          </p>
          {sublabel && (
            <p className="text-xs text-gray-400 mt-2 leading-relaxed">{sublabel}</p>
          )}
        </div>
        {Icon && (
          <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', acc.bg)}>
            <Icon className={cn('w-4.5 h-4.5', acc.value)} />
          </div>
        )}
      </div>

      {/* Indicador de clicável */}
      {onClick && (
        <div className="absolute bottom-3 right-4 text-[10px] text-gray-300 font-medium">
          ver detalhes →
        </div>
      )}
    </motion.div>
  )
}
