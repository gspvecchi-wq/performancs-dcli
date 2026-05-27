'use client'

import { cn } from '@/lib/utils/cn'
import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'

type KpiVariant = 'excelente' | 'bom' | 'risco' | 'neutro' | 'info'

const ACCENT: Record<KpiVariant, {
  bar:       string
  glow:      string
  iconBg:    string
  iconColor: string
  value:     string
}> = {
  excelente: { bar: 'bg-emerald-400', glow: '#34d399', iconBg: 'bg-emerald-500/15', iconColor: 'text-emerald-400', value: 'text-emerald-300' },
  bom:       { bar: 'bg-green-400',   glow: '#4ade80', iconBg: 'bg-green-500/15',   iconColor: 'text-green-400',   value: 'text-green-300'   },
  risco:     { bar: 'bg-red-400',     glow: '#f87171', iconBg: 'bg-red-500/15',     iconColor: 'text-red-400',     value: 'text-red-300'     },
  neutro:    { bar: 'bg-white/25',    glow: '#ffffff', iconBg: 'bg-white/8',        iconColor: 'text-white/50',    value: 'text-white'       },
  info:      { bar: 'bg-blue-400',    glow: '#60a5fa', iconBg: 'bg-blue-500/15',    iconColor: 'text-blue-400',    value: 'text-blue-300'    },
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
      initial={animateIn ? { opacity: 0, y: 16 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
      onClick={onClick}
      className={cn(
        'relative bg-[#0F1C18] rounded-2xl border border-white/[0.07] px-5 py-5 overflow-hidden',
        'transition-all duration-200',
        onClick && 'cursor-pointer hover:bg-[#132219] hover:border-white/[0.12] active:scale-[0.99]'
      )}
    >
      {/* Barra lateral colorida com glow */}
      <div
        className={cn('absolute left-0 top-5 bottom-5 w-[3px] rounded-full', acc.bar)}
        style={{ boxShadow: `0 0 10px 1px ${acc.glow}55` }}
      />

      {/* Glow sutil de fundo */}
      <div
        className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-[0.06] blur-2xl pointer-events-none"
        style={{ background: acc.glow }}
      />

      <div className="flex items-start justify-between gap-3 pl-3">
        <div className="min-w-0 flex-1">
          {/* Label */}
          <p className="text-[10px] font-semibold text-white/35 uppercase tracking-widest mb-3">
            {label}
          </p>

          {/* Número principal */}
          <p className={cn('text-[44px] font-bold leading-none tabular-nums', acc.value)}>
            {value}
          </p>

          {/* Sublabel */}
          {sublabel && (
            <p className="text-[11px] text-white/30 mt-2 font-medium">{sublabel}</p>
          )}
        </div>

        {/* Ícone */}
        {Icon && (
          <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-1', acc.iconBg)}>
            <Icon className={cn('w-[18px] h-[18px]', acc.iconColor)} />
          </div>
        )}
      </div>

      {/* Hint de clicável */}
      {onClick && (
        <div className="absolute bottom-3 right-4 text-[10px] text-white/20 font-medium">
          ver detalhes →
        </div>
      )}
    </motion.div>
  )
}
