'use client'

import { useState } from 'react'
import {
  Users, TrendingDown, TrendingUp, Zap, Bell, Activity,
  AlertTriangle, CheckCircle, Info, RefreshCw
} from 'lucide-react'
import { KpiCard } from '@/components/dashboard/KpiCard'
import { RiskDrawer } from '@/components/dashboard/RiskDrawer'
import { Badge, ALERT_LABELS, ALERT_BADGE, severityToBadge } from '@/components/ui/Badge'
import { PatientAvatar } from '@/components/pacientes/PatientAvatar'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import type { Patient, Alert, DashboardStats } from '@/types/patient'
import { formatRelative } from '@/lib/utils/format'
import { useRouter } from 'next/navigation'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
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
    'Enviados': v.enviados,
    'Respondidos': v.respondidos,
    'Taxa (%)': v.enviados > 0 ? Math.round((v.respondidos / v.enviados) * 100) : 0,
  }))
}

const SEVERITY_ICON: Record<string, React.ElementType> = {
  critico: AlertTriangle,
  atencao: Info,
  info:    CheckCircle,
}

export function DashboardClient({ stats, emRisco, alertas, contatosMes }: Props) {
  const [riskOpen, setRiskOpen] = useState(false)
  const router = useRouter()
  const chartData = buildChartData(contatosMes)

  const engajamentoData = [
    { name: 'Excelente (≥75%)',  value: stats.excelente, color: '#059669' },
    { name: 'Bom (50–74%)',      value: stats.bom,       color: '#16a34a' },
    { name: 'Em risco (<50%)',   value: stats.em_risco,  color: '#dc2626' },
  ].filter((d) => d.value > 0)

  return (
    <>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-display text-[28px] text-gray-900 leading-tight">
            Visão geral
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Plano de acompanhamento de retenção · Carteira ativa
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => router.refresh()}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Atualizar
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-5 mb-6">
        <KpiCard
          label="Total em plano de acompanhamento"
          value={stats.total_ativos}
          sublabel="pacientes ativos"
          variant="neutro"
          icon={Users}
          index={0}
        />
        <KpiCard
          label="Em risco"
          value={stats.em_risco}
          sublabel="score abaixo de 50%"
          variant="risco"
          icon={TrendingDown}
          onClick={() => setRiskOpen(true)}
          index={1}
        />
        <KpiCard
          label="Bom a ótimo"
          value={stats.bom}
          sublabel="score 50 a 74%"
          variant="bom"
          icon={TrendingUp}
          index={2}
        />
        <KpiCard
          label="Excelente"
          value={stats.excelente}
          sublabel="score 75% ou mais"
          variant="excelente"
          icon={Zap}
          index={3}
        />
      </div>

      {/* Segunda linha de KPIs */}
      <div className="grid grid-cols-2 gap-5 mb-6">
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
      <div className="grid grid-cols-2 gap-5 mb-6">
        {/* Gráfico de acionamentos */}
        <Card>
          <CardHeader>
            <CardTitle>Acionamentos vs respostas</CardTitle>
          </CardHeader>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                />
                <Bar dataKey="Enviados"    fill="#d1fae5" radius={[4,4,0,0]} />
                <Bar dataKey="Respondidos" fill="#059669" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-sm text-gray-400">
              Nenhum dado de acionamento ainda.
            </div>
          )}
        </Card>

        {/* Engajamento */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de engajamento</CardTitle>
          </CardHeader>
          {engajamentoData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={engajamentoData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {engajamentoData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 11 }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-sm text-gray-400">
              Nenhum paciente cadastrado ainda.
            </div>
          )}
        </Card>
      </div>

      {/* Alertas recentes */}
      <Card>
        <CardHeader>
          <CardTitle>Alertas recentes</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => router.push('/alertas')}>
            Ver todos →
          </Button>
        </CardHeader>

        {alertas.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-50" />
            <p className="text-sm text-gray-400">Nenhum alerta pendente.</p>
          </div>
        ) : (
          <div className="space-y-0 divide-y divide-gray-100">
            {alertas.map((alerta) => {
              const SeverityIcon = SEVERITY_ICON[alerta.severidade]
              const pac = alerta.paciente as unknown as Patient | null
              return (
                <div
                  key={alerta.id}
                  className="flex items-center gap-3 py-3 group cursor-pointer
                             hover:bg-gray-50 -mx-5 px-5 transition-colors duration-150"
                  onClick={() => pac && router.push(`/pacientes/${pac.id}`)}
                >
                  <SeverityIcon
                    className={`w-4 h-4 flex-shrink-0 ${
                      alerta.severidade === 'critico'
                        ? 'text-red-500'
                        : alerta.severidade === 'atencao'
                        ? 'text-amber-500'
                        : 'text-blue-400'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {pac && (
                        <span className="text-sm font-semibold text-gray-800">{pac.nome}</span>
                      )}
                      <Badge variant={ALERT_BADGE[alerta.tipo]} size="sm">
                        {ALERT_LABELS[alerta.tipo]}
                      </Badge>
                    </div>
                    {alerta.descricao && (
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{alerta.descricao}</p>
                    )}
                  </div>
                  <span className="text-[11px] text-gray-400 flex-shrink-0">
                    {formatRelative(alerta.criado_em)}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* Drawer de pacientes em risco */}
      <RiskDrawer
        open={riskOpen}
        onClose={() => setRiskOpen(false)}
        patients={emRisco}
      />
    </>
  )
}
