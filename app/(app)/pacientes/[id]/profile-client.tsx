'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Calendar, Clock, MessageSquare, Target, CheckCircle, AlertCircle, Circle, Play, SkipForward } from 'lucide-react'
import { PatientAvatar } from '@/components/pacientes/PatientAvatar'
import { ScoreRing } from '@/components/perfil/ScoreRing'
import { PatientContextCard } from '@/components/perfil/PatientContextCard'
import { QuickRouteCorrection } from '@/components/perfil/QuickRouteCorrection'
import { WeightTracker } from '@/components/perfil/WeightTracker'
import { Badge, ALERT_LABELS, ALERT_BADGE, scoreToBadge } from '@/components/ui/Badge'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import type { Patient, ProtocolExecution, Contact, WeightRecord, Alert, RouteCorrection } from '@/types/patient'
import { formatDate, formatDateTime, daysUntil } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'

type Tab = 'protocolo' | 'contatos' | 'peso' | 'ia'

const MOMENT_STATUS = {
  executado: { icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-100', label: 'Executado' },
  pendente:  { icon: Clock,       color: 'text-amber-600',   bg: 'bg-amber-100',   label: 'Pendente'  },
  atual:     { icon: Play,        color: 'text-blue-600',    bg: 'bg-blue-100',    label: 'Atual'     },
  risco:     { icon: AlertCircle, color: 'text-red-600',     bg: 'bg-red-100',     label: 'Em risco'  },
  futuro:    { icon: Circle,      color: 'text-gray-400',    bg: 'bg-gray-100',    label: 'Previsto'  },
  cancelado: { icon: SkipForward, color: 'text-gray-400',    bg: 'bg-gray-100',    label: 'Cancelado' },
} as const

interface Props {
  paciente: Patient
  execucoes: (ProtocolExecution & { momento?: { label: string; pergunta: string } | null })[]
  contatos: Contact[]
  pesos: WeightRecord[]
  alertas: Alert[]
  correcoes: RouteCorrection[]
  clinicaId: string
}

export function PatientProfileClient({
  paciente, execucoes, contatos, pesos, alertas: alertasIniciais, correcoes: correcoesIniciais, clinicaId
}: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('protocolo')
  const [correcoes, setCorrecoes] = useState(correcoesIniciais)
  const [pesosState, setPesosState] = useState(pesos)

  const diasFim = daysUntil(paciente.plano_fim)
  const momentosFeitos = execucoes.filter((e) => e.status === 'executado').length

  // Barra de progresso do plano de acompanhamento
  const segmentos = execucoes.map((e) => ({
    status: e.status,
    label: e.momento?.label ?? '',
  }))

  return (
    <div>
      {/* Voltar */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-5 font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar
      </button>

      {/* Header do perfil */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-5">
        <div className="flex items-start gap-5">
          <PatientAvatar nome={paciente.nome} nivel={paciente.nivel} foto_url={paciente.foto_url} size="xl" />
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-2xl text-gray-900">{paciente.nome}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{paciente.especialidade}</p>

            {/* Stats do plano */}
            <div className="flex flex-wrap gap-4 mt-3">
              <StatChip icon={Calendar} label={`Início: ${formatDate(paciente.plano_inicio, 'dd MMM yyyy')}`} />
              <StatChip
                icon={Clock}
                label={
                  diasFim < 0
                    ? `Plano vencido há ${Math.abs(diasFim)} dias`
                    : `Plano até ${formatDate(paciente.plano_fim, 'dd MMM yyyy')} (${diasFim}d)`
                }
                alert={diasFim <= 30}
              />
              <StatChip icon={CheckCircle} label={`${momentosFeitos}/${execucoes.length} momentos executados`} success />
              <StatChip icon={MessageSquare} label={`${contatos.length} contato${contatos.length !== 1 ? 's' : ''}`} />
              {paciente.meta_kg && paciente.meta_prazo_meses && (
                <StatChip
                  icon={Target}
                  label={`Meta: ${Math.abs(paciente.meta_kg)} kg em ${paciente.meta_prazo_meses} meses`}
                />
              )}
            </div>

            {/* Alertas ativos */}
            {alertasIniciais.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {alertasIniciais.map((a) => (
                  <Badge key={a.id} variant={ALERT_BADGE[a.tipo]} size="sm" dot>
                    {ALERT_LABELS[a.tipo]}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Score Ring */}
          <div className="flex-shrink-0">
            <ScoreRing score={paciente.score} />
          </div>
        </div>

        {/* Barra de progresso do plano de acompanhamento */}
        {segmentos.length > 0 && (
          <div className="mt-5 pt-4 border-t border-gray-100">
            <div className="flex gap-1.5 mb-2">
              {segmentos.map((s, i) => (
                <div
                  key={i}
                  title={s.label}
                  className={cn(
                    'flex-1 h-[5px] rounded-full transition-colors',
                    s.status === 'executado' ? 'bg-emerald-500' :
                    s.status === 'risco'     ? 'bg-red-500' :
                    s.status === 'atual' || s.status === 'pendente' ? 'bg-amber-400' :
                    'bg-gray-200'
                  )}
                />
              ))}
            </div>
            <p className="text-xs text-gray-400">
              {momentosFeitos} de {execucoes.length} momentos realizados
            </p>
          </div>
        )}
      </div>

      {/* Context card + correção de rota (sidebar effect) */}
      <div className="grid grid-cols-[1fr_320px] gap-5">
        {/* Coluna principal */}
        <div className="space-y-5">
          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            {(['protocolo', 'contatos', 'peso', 'ia'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-all',
                  tab === t
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                )}
              >
                {t === 'protocolo' ? 'Plano de acompanhamento'
                  : t === 'contatos' ? `Contatos (${contatos.length})`
                  : t === 'peso'    ? 'Peso & Meta'
                  : 'Análise IA'}
              </button>
            ))}
          </div>

          {/* Tab: Plano de acompanhamento */}
          {tab === 'protocolo' && (
            <Card>
              <CardHeader>
                <CardTitle>Momentos do plano de acompanhamento — D+1 a renovação</CardTitle>
              </CardHeader>
              {execucoes.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">
                  Nenhum momento cadastrado para este paciente.
                </p>
              ) : (
                <div className="space-y-0 divide-y divide-gray-100">
                  {execucoes.map((e) => {
                    const st = MOMENT_STATUS[e.status as keyof typeof MOMENT_STATUS] ?? MOMENT_STATUS.futuro
                    const StIcon = st.icon
                    return (
                      <div key={e.id} className="py-4 first:pt-0 last:pb-0">
                        <div className="flex items-start gap-3">
                          <div className={cn('w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5', st.bg)}>
                            <StIcon className={cn('w-3.5 h-3.5', st.color)} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-semibold text-gray-800">
                                {e.momento?.label ?? 'Momento'}
                              </span>
                              <Badge variant={
                                e.status === 'executado' ? 'bom' :
                                e.status === 'risco' ? 'critico' :
                                e.status === 'pendente' || e.status === 'atual' ? 'atencao' : 'neutro'
                              } size="sm">
                                {st.label}
                              </Badge>
                            </div>
                            {e.momento?.pergunta && (
                              <p className="text-xs text-blue-600 italic mt-1 leading-relaxed">
                                "{e.momento.pergunta}"
                              </p>
                            )}
                            {e.resposta_paciente && (
                              <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">
                                <span className="font-semibold text-gray-500">Resposta: </span>
                                {e.resposta_paciente}
                              </p>
                            )}
                            {e.analise_ia && (
                              <p className="text-xs text-emerald-700 mt-1 leading-relaxed bg-emerald-50 rounded px-2 py-1">
                                🤖 {e.analise_ia}
                              </p>
                            )}
                            <p className="text-[11px] text-gray-400 mt-1.5">
                              {e.data_execucao
                                ? formatDateTime(e.data_execucao)
                                : `Previsto: ${formatDate(e.data_prevista)}`}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>
          )}

          {/* Tab: Contatos */}
          {tab === 'contatos' && (
            <Card>
              <CardHeader>
                <CardTitle>Histórico de contatos</CardTitle>
              </CardHeader>
              {contatos.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">Nenhum contato registrado.</p>
              ) : (
                <div className="space-y-0 divide-y divide-gray-100">
                  {contatos.map((c) => (
                    <div key={c.id} className="py-4 first:pt-0 last:pb-0">
                      <div className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                          <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={c.resposta ? 'bom' : 'neutro'} size="sm">
                              {c.resposta ? 'respondeu' : 'sem resposta'}
                            </Badge>
                            {c.tipo === 'automatico' && (
                              <Badge variant="info" size="sm">automático</Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 italic">"{c.mensagem}"</p>
                          {c.resposta && (
                            <p className="text-xs text-gray-800 mt-1.5 font-medium">
                              ↩ "{c.resposta}"
                            </p>
                          )}
                          {c.analise_ia && (
                            <p className="text-xs text-emerald-700 mt-1 bg-emerald-50 rounded px-2 py-1">
                              🤖 {c.analise_ia}
                            </p>
                          )}
                          <p className="text-[11px] text-gray-400 mt-1">{formatDateTime(c.criado_em)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Tab: Peso */}
          {tab === 'peso' && (
            <Card>
              <CardHeader>
                <CardTitle>Peso & Meta</CardTitle>
              </CardHeader>
              <WeightTracker
                patient={paciente}
                pesos={pesosState}
                clinicaId={clinicaId}
                onAdd={(p) => setPesosState((prev) => [p, ...prev])}
              />
            </Card>
          )}

          {/* Tab: Análise IA */}
          {tab === 'ia' && (
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <span className="text-base">🤖</span>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                    Resumo do paciente — IA
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">
                {/* Análise mockada — estrutura pronta para integração com OpenAI */}
                Análise de IA será exibida aqui após integração com o modelo de linguagem.
                Os dados de engajamento, histórico de contatos e evolução de peso serão
                usados para gerar um diagnóstico personalizado e recomendações de acionamento.
              </p>
              <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-xs text-gray-500">
                  Score de engajamento: <strong className="text-gray-800">{paciente.score}/100</strong> ·
                  Nível: <strong className="text-gray-800 capitalize">{paciente.nivel}</strong> ·
                  Momentos: <strong className="text-gray-800">{momentosFeitos}/{execucoes.length}</strong>
                </p>
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar direita */}
        <div className="space-y-4">
          {/* Quem é esse paciente */}
          <PatientContextCard patient={paciente} />

          {/* Correção de rota */}
          <QuickRouteCorrection
            pacienteId={paciente.id}
            correcoes={correcoes}
            onAdd={(nova) => setCorrecoes((prev) => [nova, ...prev])}
          />
        </div>
      </div>
    </div>
  )
}

function StatChip({
  icon: Icon, label, alert, success
}: {
  icon: React.ElementType; label: string; alert?: boolean; success?: boolean
}) {
  return (
    <span className={cn(
      'flex items-center gap-1.5 text-xs font-medium',
      alert ? 'text-amber-600' : success ? 'text-emerald-600' : 'text-gray-500'
    )}>
      <Icon className="w-3.5 h-3.5 flex-shrink-0" />
      {label}
    </span>
  )
}
