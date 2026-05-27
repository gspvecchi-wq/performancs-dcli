'use client'

import Link from 'next/link'
import { PatientAvatar } from './PatientAvatar'
import { Badge, scoreToBadge } from '@/components/ui/Badge'
import type { Patient } from '@/types/patient'
import { formatDate, daysUntil } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'
import { Clock } from 'lucide-react'

interface PatientRowProps {
  patient: Patient
}

export function PatientRow({ patient: p }: PatientRowProps) {
  const diasFim = daysUntil(p.plano_fim)
  const scoreVariant = scoreToBadge(p.score)

  return (
    <Link
      href={`/pacientes/${p.id}`}
      className="grid grid-cols-[1fr_160px_120px_100px] gap-4 items-center
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

      {/* Plano */}
      <div className="text-xs text-white/40">
        <div className="font-medium text-white/65">{formatDate(p.plano_fim, 'dd MMM yy')}</div>
        {diasFim <= 30 && diasFim >= 0 ? (
          <div className="flex items-center gap-1 text-amber-600 mt-0.5">
            <Clock className="w-3 h-3" />
            <span>{diasFim}d restantes</span>
          </div>
        ) : diasFim < 0 ? (
          <div className="text-red-500 mt-0.5">vencido</div>
        ) : (
          <div className="text-white/35 mt-0.5">{diasFim}d restantes</div>
        )}
      </div>

      {/* Engajamento — barra */}
      <div>
        <div className="h-1.5 bg-white/[0.08] rounded-full overflow-hidden mb-1.5">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              p.score >= 75 ? 'bg-emerald-500' : p.score >= 50 ? 'bg-green-500' : 'bg-red-500'
            )}
            style={{ width: `${p.score}%` }}
          />
        </div>
        <div className="text-[11px] text-white/40">{scoreLabel(p.score)}</div>
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

function scoreLabel(score: number): string {
  if (score >= 75) return 'Excelente'
  if (score >= 50) return 'Bom'
  return 'Em risco'
}
