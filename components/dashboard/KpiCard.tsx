'use client'

import { cn } from '@/lib/utils/cn'
import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'

type KpiVariant = 'total' | 'excelente' | 'bom' | 'risco' | 'alerta' | 'info' | 'neutro'

const ACCENT: Record<KpiVariant, {
  iconBg:    string
  iconColor: string
  value:     string
}> = {
  total:     { iconBg: 'bg-amber-500/10',   iconColor: 'text-amber-400',   value: 'text-amber-400'   },
  excelente: { iconBg: 'bg-emerald-500/10', iconColor: 'text-emerald-400', value: 'text-emerald-400' },
  bom:       { iconBg: 'bg-sky-500/10',     iconColor: 'text-sky-400',     value: 'text-sky-400'     },
  risco:     { iconBg: 'bg-red-500/10',     iconColor: 'text-red-400',     value: 'text-red-400'     },
  alerta:    { iconBg: 'bg-orange-500/10',  iconColor: 'text-orange-400',  value: 'text-orange-400'  },
  info:      { iconBg: 'bg-purple-500/10',  iconColor: 'text-purple-400',  value: 'text-purple-400'  },
  neutro:    { iconBg: 'bg-white/[0.06]',   iconColor: 'text-white/50',    value: 'text-white/85'    },
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
        'bg-[#030A07] rounded-2xl border border-white/[0.07] p-5 flex flex-col gap-4 transition-all duration-200',
        onClick && 'cursor-pointer hover:border-white/[0.15] active:scale-[0.99]',
      )}
    >
      {/* Chip do ícone */}
      {Icon && (
        <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', acc.iconBg)}>
          <Icon className={cn('w-[18px] h-[18px]', acc.iconColor)} />
        </div>
      )}

      <div>
        {/* Número — Bebas Neue */}
        <p className={cn('font-num text-[44px] leading-none', acc.value)}>{value}</p>

        {/* Label */}
        <p className="text-[11px] text-white/30 uppercase tracking-widest mt-2 font-semibold">
          {label}
        </p>

        {sublabel && (
          <p className="text-[11px] text-white/25 mt-1">{sublabel}</p>
        )}
      </div>

      {onClick && (
        <div className="text-[10px] text-white/20 font-medium -mt-1">ver detalhes →</div>
      )}
    </motion.div>
  )
}
