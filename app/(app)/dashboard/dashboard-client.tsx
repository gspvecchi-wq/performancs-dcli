'use client'

import { useState, useEffect } from 'react'
import {
  Users, TrendingDown, TrendingUp, Zap, Bell, Activity,
  AlertTriangle, CheckCircle, Info, RefreshCw
} from 'lucide-react'
import { KpiCard } from '@/components/dashboard/KpiCard'
import { RiskDrawer } from '@/components/dashboard/RiskDrawer'
import { Badge, ALERT_LABELS, ALERT_BADGE } from '@/components/ui/Badge'
import { PatientAvatar } from '@/components/pacientes/PatientAvatar'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import type { Patient, Alert, DashboardStats } from '@/types/patient'
import { formatRelative } from '@/lib/utils/format'
import { useRouter } from 'next/navigation'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'

interface Props {
  stats: DashboardStats
  emRisco: Patient[]
  alertas: Alert[]
  contatosMes: { criado_em: string; resposta: string | null }[]
}

function buildChartData(contatos: Props['contatosMes']) {
  const months: Record<string, { enviados: number; respondidos: number }> = {}
  contatos.forEach((c) => {
    const month = new Date(c.criado_em).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
    if (!months[month]) months[month] = { enviados: 0, respondidos: 0 }
    months[month].enviados++
    if (c.resposta) months[month].respondidos++
  })
  return Object.entries(months).map(([name, v]) => ({
    name,
    'Enviados':    v.enviados,
    'Respondidos': v.respondidos,
  }))
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

// Tooltip customizado para dark mode
function DarkTooltip({ active, payload, label }: {
  active?: boolean
  payload?: { name: string; value: number; color: string }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#0F1C18] border border-white/10 rounded-xl px-3 py-2 text-xs shadow-xl">
      <p className="text-white/40 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }} className="font-semibold">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  )
}

export function DashboardClient({ stats, emRisco, alertas, contatosMes }: Props) {
  const [riskOpen, setRiskOpen] = useState(false)
  const router = useRouter()
  const chartData = buildChartData(contatosMes)

  // Gera alertas de sessões atrasadas ao abrir o dashboard (silencioso)
  useEffect(() => {
    fetch('/api/alertas/generate', { method: 'POST' })
      .then((r) => r.json())
      .then((d) => { if (d.gerados > 0) router.refresh() })
      .catch(() => {/* silencioso */})
  }, [])

  const engajamentoData = [
    { name: 'Excelente ≥75',  value: stats.excelente, color: '#34d399' },
    { name: 'Bom 50–74',      value: stats.bom,       color: '#4ade80' },
    { name: 'Em risco <50',   value: stats.em_risco,  color: '#f87171' },
  ].filter((d) => d.value > 0)

  return (
    <>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-[11px] font-semibold text-white/30 uppercase tracking-widest mb-1">
            D&apos;Clinique · Carteira ativa
          </p>
          <h1 className="font-display text-[32px] text-white leading-tight">
            Visão geral
          </h1>
        </div>
        <button
          onClick={() => router.refresh()}
          className="flex items-center gap-1.5 text-[11px] text-white/30 hover:text-white/60
                     transition-colors px-3 py-2 rounded-lg hover:bg-white/5"
        >
          <RefreshCw className="w-3 h-3" />
          Atualizar
        </button>
      </div>

      {/* KPIs — linha 1 */}
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

      {/* KPIs — linha 2 */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <KpiCard
          label="Acionamentos hoje"
          value={stats.acionamentos_hoje}
          sublabel="mensagens enviadas"
          variant="info"
          icon={Activity}
          index={4}
        />
        <KpiCard
          label="Alertas abertos"
          value={stats.alertas_abertos}
          sublabel="aguardando resolução"
          variant={stats.alertas_abertos > 0 ? 'risco' : 'neutro'}
          icon={Bell}
          onClick={() => router.push('/alertas')}
          index={5}
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-3 gap-4 mb-4">

        {/* Acionamentos vs respostas — ocupa 2 colunas */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Acionamentos vs respostas</CardTitle>
          </CardHeader>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={190}>
              <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradEnviados" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradRespondidos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#34d399" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.30)' }}
                  axisLine={false} tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.30)' }}
                  axisLine={false} tickLine={false}
                />
                <Tooltip content={<DarkTooltip />} />
                <Area
                  type="monotone" dataKey="Enviados"
                  stroke="#10b981" strokeWidth={2}
                  fill="url(#gradEnviados)"
                />
                <Area
                  type="monotone" dataKey="Respondidos"
                  stroke="#34d399" strokeWidth={2}
                  fill="url(#gradRespondidos)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[190px] flex flex-col items-center justify-center gap-2">
              <Activity className="w-6 h-6 text-white/15" />
              <p className="text-xs text-white/25">Nenhum acionamento ainda</p>
            </div>
          )}
        </Card>

        {/* Engajamento — 1 coluna */}
        <Card>
          <CardHeader>
            <CardTitle>Engajamento</CardTitle>
          </CardHeader>
          {engajamentoData.length > 0 ? (
            <ResponsiveContainer width="100%" height={190}>
              <PieChart>
                <Pie
                  data={engajamentoData}
                  cx="50%" cy="45%"
                  innerRadius={52} outerRadius={74}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {engajamentoData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<DarkTooltip />} />
                <Legend
                  iconType="circle" iconSize={7}
                  wrapperStyle={{ fontSize: 10, color: 'rgba(255,255,255,0.40)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[190px] flex flex-col items-center justify-center gap-2">
              <Users className="w-6 h-6 text-white/15" />
              <p className="text-xs text-white/25">Nenhum paciente ainda</p>
            </div>
          )}
        </Card>

      </div>

      {/* Alertas recentes */}
      <Card>
        <CardHeader>
          <CardTitle>Alertas recentes</CardTitle>
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
