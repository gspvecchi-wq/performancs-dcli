'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Users, TrendingDown, TrendingUp, Zap, Bell,
  AlertTriangle, CheckCircle, Info, RefreshCw, ChevronRight, CloudDownload,
} from 'lucide-react'
import { toast } from 'sonner'
import { KpiCard } from '@/components/dashboard/KpiCard'
import { RiskDrawer } from '@/components/dashboard/RiskDrawer'
import { Badge, ALERT_LABELS, ALERT_BADGE, levelToBadge } from '@/components/ui/Badge'
import { PatientAvatar } from '@/components/pacientes/PatientAvatar'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import type { Patient, Alert, DashboardStats } from '@/types/patient'
import { formatRelative } from '@/lib/utils/format'
import { useRouter } from 'next/navigation'

interface Props {
  stats: DashboardStats
  top5Engajados: Patient[]
  emRisco: Patient[]
  alertas: Alert[]
}

const SEVERITY_ICON: Record<string, React.ElementType> = {
  critico: AlertTriangle,
  atencao: Info,
  info:    CheckCircle,
}

const SEVERITY_COLOR: Record<string, string> = {
  critico: 'text-red-400',
  atencao: 'text-amber-400',
  info:    'text-blue-400',
}

// ── Linha de ranking de paciente ────────────────────────────────────────────

function RankRow({
  paciente,
  posicao,
  variant,
  onClick,
}: {
  paciente: Patient
  posicao: number
  variant: 'engajado' | 'risco'
  onClick: () => void
}) {
  const posColor = variant === 'engajado' ? 'text-emerald-400/60' : 'text-red-400/60'

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03]
                 transition-colors text-left group"
    >
      <span className={`w-5 text-[11px] font-bold tabular-nums ${posColor}`}>
        #{posicao}
      </span>

      <PatientAvatar nome={paciente.nome} nivel={paciente.nivel} size="sm" />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white/85 truncate leading-tight">
          {paciente.nome}
        </p>
        <p className="text-[11px] text-white/30 truncate mt-0.5">
          {paciente.especialidade ?? 'Sem especialidade'}
        </p>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <Badge variant={levelToBadge(paciente.nivel)} size="sm">
          {paciente.score}
        </Badge>
        <ChevronRight className="w-3.5 h-3.5 text-white/20 group-hover:text-white/40 transition-colors" />
      </div>
    </button>
  )
}

// ── Componente principal ─────────────────────────────────────────────────────

export function DashboardClient({ stats, top5Engajados, emRisco, alertas }: Props) {
  const [riskOpen, setRiskOpen] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    setSyncing(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res  = await fetch('/api/import/supportclinic', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erro desconhecido')
      toast.success(data.message)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Falha na sincronização')
    } finally {
      setSyncing(false)
    }
  }

  // Gera alertas de sessões atrasadas ao abrir o dashboard (silencioso)
  useEffect(() => {
    fetch('/api/alertas/generate', { method: 'POST' })
      .then((r) => r.json())
      .then((d) => { if (d.gerados > 0) router.refresh() })
      .catch(() => {/* silencioso */})
  }, [])

  // "Precisam de Atenção" — primeiros 5 pacientes em risco
  const risco5 = emRisco.slice(0, 5)

  return (
    <>
      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-[11px] font-semibold text-white/30 uppercase tracking-widest mb-1">
            D&apos;Clinique · Carteira ativa
          </p>
          <h1 className="font-display text-[32px] text-white leading-tight">
            Visão geral
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleFileSelected}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={syncing}
            className="flex items-center gap-1.5 text-[11px] text-white/40 hover:text-white/70
                       transition-colors px-3 py-2 rounded-lg hover:bg-white/5 disabled:opacity-40"
            title="Sincronizar planilha SupportClinic"
          >
            <CloudDownload className={`w-3 h-3 ${syncing ? 'animate-pulse' : ''}`} />
            {syncing ? 'Sincronizando…' : 'Sincronizar'}
          </button>
          <button
            onClick={() => router.refresh()}
            className="flex items-center gap-1.5 text-[11px] text-white/30 hover:text-white/60
                       transition-colors px-3 py-2 rounded-lg hover:bg-white/5"
          >
            <RefreshCw className="w-3 h-3" />
            Atualizar
          </button>
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        <KpiCard
          label="Em acompanhamento"
          value={stats.total_ativos}
          sublabel="pacientes ativos"
          variant="neutro"
          icon={Users}
          index={0}
        />
        <KpiCard
          label="Em risco"
          value={stats.em_risco}
          sublabel="score abaixo de 50"
          variant="risco"
          icon={TrendingDown}
          onClick={() => setRiskOpen(true)}
          index={1}
        />
        <KpiCard
          label="Bom a ótimo"
          value={stats.bom}
          sublabel="score entre 50 e 74"
          variant="bom"
          icon={TrendingUp}
          index={2}
        />
        <KpiCard
          label="Excelente"
          value={stats.excelente}
          sublabel="score 75 ou mais"
          variant="excelente"
          icon={Zap}
          index={3}
        />
      </div>

      {/* ── Rankings ── */}
      <div className="grid grid-cols-2 gap-4 mb-4">

        {/* 🏆 Mais Engajados */}
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>🏆 Mais Engajados</CardTitle>
            <button
              onClick={() => router.push('/pacientes')}
              className="text-[11px] text-emerald-400 hover:text-emerald-300 transition-colors font-medium"
            >
              Ver todos →
            </button>
          </CardHeader>
          <div className="divide-y divide-white/[0.04] -mx-5">
            {top5Engajados.length > 0 ? (
              top5Engajados.map((p, i) => (
                <RankRow
                  key={p.id}
                  paciente={p}
                  posicao={i + 1}
                  variant="engajado"
                  onClick={() => router.push(`/pacientes/${p.id}`)}
                />
              ))
            ) : (
              <div className="py-8 text-center">
                <p className="text-xs text-white/25">Nenhum paciente cadastrado</p>
              </div>
            )}
          </div>
        </Card>

        {/* ⚠️ Precisam de Atenção */}
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>⚠️ Precisam de Atenção</CardTitle>
            <button
              onClick={() => setRiskOpen(true)}
              className="text-[11px] text-red-400/70 hover:text-red-400 transition-colors font-medium"
            >
              Ver todos →
            </button>
          </CardHeader>
          <div className="divide-y divide-white/[0.04] -mx-5">
            {risco5.length > 0 ? (
              risco5.map((p, i) => (
                <RankRow
                  key={p.id}
                  paciente={p}
                  posicao={i + 1}
                  variant="risco"
                  onClick={() => router.push(`/pacientes/${p.id}`)}
                />
              ))
            ) : (
              <div className="py-8 text-center">
                <CheckCircle className="w-6 h-6 text-emerald-500/30 mx-auto mb-2" />
                <p className="text-xs text-white/25">Nenhum paciente em risco</p>
              </div>
            )}
          </div>
        </Card>

      </div>

      {/* ── Alertas recentes ── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>Alertas recentes</CardTitle>
            {stats.alertas_abertos > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full
                               bg-red-500/15 text-red-400 text-[10px] font-bold">
                {stats.alertas_abertos > 9 ? '9+' : stats.alertas_abertos}
              </span>
            )}
          </div>
          <button
            onClick={() => router.push('/alertas')}
            className="text-[11px] text-emerald-400 hover:text-emerald-300 transition-colors font-medium"
          >
            Ver todos →
          </button>
        </CardHeader>

        {alertas.length === 0 ? (
          <div className="text-center py-10">
            <CheckCircle className="w-7 h-7 text-emerald-500/40 mx-auto mb-2" />
            <p className="text-xs text-white/25">Nenhum alerta pendente</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.05]">
            {alertas.map((alerta) => {
              const SeverityIcon = SEVERITY_ICON[alerta.severidade]
              const pac = alerta.paciente as unknown as Patient | null
              return (
                <div
                  key={alerta.id}
                  className="flex items-center gap-3 py-3 -mx-5 px-5
                             hover:bg-white/[0.03] transition-colors cursor-pointer"
                  onClick={() => pac && router.push(`/pacientes/${pac.id}`)}
                >
                  <SeverityIcon className={`w-3.5 h-3.5 flex-shrink-0 ${SEVERITY_COLOR[alerta.severidade]}`} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {pac && (
                        <span className="text-sm font-semibold text-white/85">{pac.nome}</span>
                      )}
                      <Badge variant={ALERT_BADGE[alerta.tipo]} size="sm">
                        {ALERT_LABELS[alerta.tipo]}
                      </Badge>
                    </div>
                    {alerta.descricao && (
                      <p className="text-[11px] text-white/30 mt-0.5 truncate">{alerta.descricao}</p>
                    )}
                  </div>

                  <span className="text-[10px] text-white/20 flex-shrink-0 font-medium">
                    {formatRelative(alerta.criado_em)}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      <RiskDrawer
        open={riskOpen}
        onClose={() => setRiskOpen(false)}
        patients={emRisco}
      />
    </>
  )
}
