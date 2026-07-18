'use client'

import Link from 'next/link'
import { PatientAvatar } from './PatientAvatar'
import { Badge, scoreToBadge } from '@/components/ui/Badge'
import type { PatientWithStats } from '@/app/(app)/pacientes/page'
import { formatDate, daysUntil } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'
import { Clock } from 'lucide-react'

interface PatientRowProps {
  patient: PatientWithStats
}

function formatCurrency(value: number | null | undefined): string {
  if (value == null) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value)
}

export function PatientRow({ patient: p }: PatientRowProps) {
  const diasFim     = daysUntil(p.plano_fim)
  const scoreVariant = scoreToBadge(p.score)
  const { previstas, realizadas, pct } = p.stats
  const saldo = (p.valor_plano ?? 0) - (p.valor_pago ?? 0)

  return (
    <Link
      href={`/pacientes/${p.id}`}
      className="grid grid-cols-[1fr_120px_90px_90px_90px_90px_90px_80px] gap-3 items-center
                 px-5 py-3.5 border-b border-white/[0.05] last:border-0
                 hover:bg-white/[0.04] transition-colors duration-100 group"
    >
      {/* Nome + especialidade */}
      <div className="flex items-center gap-3 min-w-0">
        <PatientAvatar nome={p.nome} nivel={p.nivel} foto_url={p.foto_url} size="md" />
        <div className="min-w-0">
          <div className="text-sm font-semibold text-white/90 group-hover:text-emerald-400 transition-colors truncate">
            {p.nome}
          </div>
          <div className="text-xs text-white/40 mt-0.5 truncate">
            {p.especialidade ?? 'Sem especialidade'}
          </div>
        </div>
      </div>

      {/* Plano — vencimento */}
      <div className="text-xs text-white/40">
        <div className="font-medium text-white/65">{formatDate(p.plano_fim, 'dd MMM yy')}</div>
        {diasFim <= 30 && diasFim >= 0 ? (
          <div className="flex items-center gap-1 text-amber-600 mt-0.5">
            <Clock className="w-3 h-3" />
            <span>{diasFim}d</span>
          </div>
        ) : diasFim < 0 ? (
          <div className="text-red-500 mt-0.5">vencido</div>
        ) : (
          <div className="text-white/30 mt-0.5">{diasFim}d</div>
        )}
      </div>

      {/* Sessões previstas (total do plano) */}
      <div className="text-center">
        <div className="text-sm font-semibold text-white/75">{previstas}</div>
        <div className="text-[11px] text-white/35">previstas</div>
      </div>

      {/* Sessões realizadas */}
      <div className="text-center">
        <div className="text-sm font-semibold text-white/75">{realizadas}</div>
        <div className="text-[11px] text-white/35">realizadas</div>
      </div>

      {/* Conclusão do plano */}
      <div className="text-center">
        <div className={cn(
          'text-sm font-semibold',
          pct >= 75 ? 'text-emerald-400' : pct >= 50 ? 'text-green-400' : 'text-white/60'
        )}>
          {previstas === 0 ? '—' : `${pct}%`}
        </div>
        <div className="h-1 bg-white/[0.08] rounded-full overflow-hidden mt-1.5 mx-1">
          {previstas > 0 && (
            <div
              className={cn('h-full rounded-full', pct >= 75 ? 'bg-emerald-500' : pct >= 50 ? 'bg-green-500' : 'bg-emerald-400/50')}
              style={{ width: `${pct}%` }}
            />
          )}
        </div>
      </div>

      {/* Orçamento (valor_plano) */}
      <div className="text-right">
        <div className="text-xs font-medium text-white/65">{formatCurrency(p.valor_plano)}</div>
        {saldo > 0 && p.valor_plano != null && (
          <div className="text-[11px] text-red-400 mt-0.5">−{formatCurrency(saldo)}</div>
        )}
        {saldo <= 0 && p.valor_plano != null && p.valor_pago != null && (
          <div className="text-[11px] text-emerald-400 mt-0.5">quitado</div>
        )}
      </div>

      {/* Valor pago */}
      <div className="text-right">
        <div className="text-xs font-medium text-white/65">{formatCurrency(p.valor_pago)}</div>
      </div>

      {/* Score */}
      <div className="text-right">
        <Badge variant={scoreVariant} size="sm">
          {p.score}/100
        </Badge>
      </div>
    </Link>
  )
}
