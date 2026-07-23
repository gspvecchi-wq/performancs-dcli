'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils/cn'
import { getInitials } from '@/lib/utils/format'
import type { Patient } from '@/types/patient'

/**
 * Mapa de Decisão — engajamento × satisfação.
 *
 *   Y = engajamento (score 0–100; >= 50 é "engajado")
 *   X = satisfação  (NPS 0–10;   >= 7  é "satisfeito")
 *
 * Cada quadrante sugere a ação comercial. Quem ainda não respondeu o NPS não
 * tem eixo X — fica fora da matriz, listado à parte (é o público a pesquisar).
 */

type QuadranteId = 'renovar' | 'investigar' | 'reativar' | 'resgate'

const QUADRANTES: {
  id: QuadranteId
  label: string
  acao: string
  engajado: boolean
  satisfeito: boolean
  cor: string
  bg: string
  borda: string
}[] = [
  {
    id: 'renovar', label: 'Renovar / Ascender', acao: 'Engajado e satisfeito — hora de oferecer',
    engajado: true, satisfeito: true,
    cor: 'text-emerald-400', bg: 'bg-emerald-500/[0.07]', borda: 'border-emerald-500/25',
  },
  {
    id: 'investigar', label: 'Investigar', acao: 'Vem, mas não está contente — entender o que falta',
    engajado: true, satisfeito: false,
    cor: 'text-amber-400', bg: 'bg-amber-500/[0.07]', borda: 'border-amber-500/25',
  },
  {
    id: 'reativar', label: 'Reativar', acao: 'Gosta da clínica mas sumiu — chamar de volta',
    engajado: false, satisfeito: true,
    cor: 'text-sky-400', bg: 'bg-sky-500/[0.07]', borda: 'border-sky-500/25',
  },
  {
    id: 'resgate', label: 'Resgate', acao: 'Risco de churn — prioridade máxima',
    engajado: false, satisfeito: false,
    cor: 'text-red-400', bg: 'bg-red-500/[0.07]', borda: 'border-red-500/25',
  },
]

export function MapaDecisao({ pacientes }: { pacientes: Patient[] }) {
  const [aberto, setAberto] = useState<QuadranteId | null>(null)

  const { porQuadrante, semNps } = useMemo(() => {
    const mapa: Record<QuadranteId, Patient[]> = {
      renovar: [], investigar: [], reativar: [], resgate: [],
    }
    const sem: Patient[] = []

    for (const p of pacientes) {
      if (p.nps_nota == null) { sem.push(p); continue }
      const engajado = (p.score ?? 0) >= 50
      const satisfeito = p.nps_nota >= 7
      const q = QUADRANTES.find((x) => x.engajado === engajado && x.satisfeito === satisfeito)!
      mapa[q.id].push(p)
    }
    return { porQuadrante: mapa, semNps: sem }
  }, [pacientes])

  const quadranteAberto = aberto ? QUADRANTES.find((q) => q.id === aberto) : null

  return (
    <div>
      {/* Matriz */}
      <div className="relative">
        {/* Rótulos dos eixos */}
        <div className="flex">
          <div className="w-6 flex-shrink-0" />
          <div className="flex-1 grid grid-cols-2 gap-3 mb-2">
            <span className="text-[10px] text-white/25 uppercase tracking-widest text-center">
              Não satisfeito
            </span>
            <span className="text-[10px] text-white/25 uppercase tracking-widest text-center">
              Satisfeito
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          {/* Eixo Y */}
          <div className="w-6 flex-shrink-0 flex flex-col justify-around items-center">
            <span className="text-[10px] text-white/25 uppercase tracking-widest -rotate-90 whitespace-nowrap">
              Engajado
            </span>
            <span className="text-[10px] text-white/25 uppercase tracking-widest -rotate-90 whitespace-nowrap">
              Não eng.
            </span>
          </div>

          {/* Quadrantes: ordem visual = engajado em cima */}
          <div className="flex-1 grid grid-cols-2 gap-3">
            {(['investigar', 'renovar', 'resgate', 'reativar'] as QuadranteId[]).map((id) => {
              const q = QUADRANTES.find((x) => x.id === id)!
              const lista = porQuadrante[id]
              return (
                <button
                  key={id}
                  onClick={() => setAberto(aberto === id ? null : id)}
                  className={cn(
                    'text-left rounded-xl border p-4 min-h-[132px] transition-all',
                    q.bg, q.borda,
                    aberto === id ? 'ring-1 ring-white/20' : 'hover:brightness-125',
                  )}
                >
                  <div className={cn('text-[11px] font-semibold uppercase tracking-wider mb-1', q.cor)}>
                    {q.label}
                  </div>
                  <div className="font-num text-3xl text-white/90 leading-none mb-2">
                    {lista.length}
                  </div>
                  {/* Iniciais dos pacientes */}
                  <div className="flex flex-wrap gap-1">
                    {lista.slice(0, 6).map((p) => (
                      <span
                        key={p.id}
                        title={p.nome}
                        className="w-6 h-6 rounded-full bg-white/[0.08] border border-white/[0.10]
                                   text-[9px] font-bold text-white/60 flex items-center justify-center"
                      >
                        {getInitials(p.nome)}
                      </span>
                    ))}
                    {lista.length > 6 && (
                      <span className="w-6 h-6 rounded-full bg-white/[0.04] text-[9px] text-white/40 flex items-center justify-center">
                        +{lista.length - 6}
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Detalhe do quadrante selecionado */}
      {quadranteAberto && (
        <div className={cn('mt-3 rounded-xl border p-4', quadranteAberto.bg, quadranteAberto.borda)}>
          <p className={cn('text-xs font-semibold mb-0.5', quadranteAberto.cor)}>
            {quadranteAberto.label}
          </p>
          <p className="text-[11px] text-white/45 mb-3">{quadranteAberto.acao}</p>

          {porQuadrante[quadranteAberto.id].length === 0 ? (
            <p className="text-xs text-white/35">Nenhum paciente neste quadrante.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {porQuadrante[quadranteAberto.id].map((p) => (
                <Link
                  key={p.id}
                  href={`/pacientes/${p.id}`}
                  className="text-xs px-2.5 py-1 rounded-lg bg-white/[0.06] border border-white/[0.08]
                             text-white/70 hover:text-white hover:border-emerald-500/30 transition-colors"
                >
                  {p.nome} <span className="text-white/35">· {p.score}/NPS {p.nps_nota}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sem NPS — público a pesquisar */}
      {semNps.length > 0 && (
        <p className="text-[11px] text-white/35 mt-3">
          <strong className="text-white/50">{semNps.length}</strong> paciente(s) ainda sem NPS —
          não entram no mapa. Envie a pesquisa em <span className="text-emerald-400/70">Importar</span>.
        </p>
      )}
    </div>
  )
}
