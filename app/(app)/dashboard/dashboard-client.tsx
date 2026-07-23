'use client'

import { useState, useEffect } from 'react'
import { Users, TrendingDown, TrendingUp, Zap } from 'lucide-react'
import { KpiCard } from '@/components/dashboard/KpiCard'
import { RiskDrawer } from '@/components/dashboard/RiskDrawer'
import { MapaDecisao } from '@/components/dashboard/MapaDecisao'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import type { Patient, DashboardStats } from '@/types/patient'
import { useRouter } from 'next/navigation'
import { FEATURES } from '@/lib/config/features'

interface Props {
  stats: DashboardStats
  /** Carteira ativa — alimenta o Mapa de Decisão */
  pacientes: Patient[]
  emRisco: Patient[]
}

// ── Componente principal ─────────────────────────────────────────────────────

export function DashboardClient({ stats, pacientes, emRisco }: Props) {
  const [riskOpen, setRiskOpen] = useState(false)
  const router = useRouter()

  // Gera alertas de sessões atrasadas ao abrir o dashboard (silencioso).
  // Só roda se a área de Alertas estiver ativa — evita um POST a cada abertura.
  useEffect(() => {
    if (!FEATURES.alertas) return
    fetch('/api/alertas/generate', { method: 'POST' })
      .then((r) => r.json())
      .then((d) => { if (d.gerados > 0) router.refresh() })
      .catch(() => {/* silencioso */})
  }, [router])

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
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        <KpiCard
          label="Em acompanhamento"
          value={stats.total_ativos}
          sublabel="pacientes ativos"
          variant="total"
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

      {/* ── Mapa de Decisão — engajamento × satisfação ── */}
      <Card>
        <CardHeader>
          <CardTitle>Mapa de decisão</CardTitle>
          <span className="text-[11px] text-white/35">
            engajamento × satisfação · clique num quadrante
          </span>
        </CardHeader>
        <MapaDecisao pacientes={pacientes} />
      </Card>

      <RiskDrawer
        open={riskOpen}
        onClose={() => setRiskOpen(false)}
        patients={emRisco}
      />
    </>
  )
}
