'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Calendar, Clock, MessageSquare, Target,
  CheckCircle, AlertCircle, Circle, Play, SkipForward,
  DollarSign, CreditCard, User,
} from 'lucide-react'
import { PatientAvatar } from '@/components/pacientes/PatientAvatar'
import { ScoreRing } from '@/components/perfil/ScoreRing'
import { PatientContextCard } from '@/components/perfil/PatientContextCard'
import { QuickRouteCorrection } from '@/components/perfil/QuickRouteCorrection'
import { WeightTracker } from '@/components/perfil/WeightTracker'
import { Badge, ALERT_LABELS, ALERT_BADGE, scoreToBadge } from '@/components/ui/Badge'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import type {
  Patient, Agendamento, ProtocolExecution, ProtocolMoment,
  Contact, WeightRecord, Alert, RouteCorrection,
} from '@/types/patient'
import { formatDate, formatDateTime, daysUntil } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'
import { addDays, differenceInDays, parseISO } from 'date-fns'

type Tab = 'protocolo' | 'contatos' | 'peso' | 'ia'

// ── Timeline helpers ────────────────────────────────────────────────────────

type TimelineStatus = 'executado' | 'atual' | 'pendente' | 'risco' | 'futuro' | 'cancelado'
type TimelineSource = 'agendamento' | 'execucao' | 'momento'

interface TimelineItem {
  id: string
  label: string
  pergunta?: string | null
  offset_dias?: number
  data_prevista: string | null   // null = a agendar
  data_execucao?: string | null
  status: TimelineStatus
  resposta_paciente?: string | null
  analise_ia?: string | null
  hora?: string | null
  profissional?: string | null
  observacao?: string | null
  source: TimelineSource
}

function buildTimeline(
  paciente: Patient,
  agendamentos: Agendamento[],
  execucoes: (ProtocolExecution & { momento?: ProtocolMoment | null })[],
  momentos: ProtocolMoment[],
): TimelineItem[] {
  const hoje = new Date()
  const inicio = parseISO(paciente.plano_inicio)

  // Prioridade 1: agendamentos reais do D Clinique (os marcos verdadeiros)
  if (agendamentos.length > 0) {
    return agendamentos.map((ag) => {
      let status: TimelineStatus

      if (ag.status === 'atendido') {
        status = 'executado'
      } else if (ag.status === 'cancelado') {
        status = 'cancelado'
      } else if (ag.status === 'a_agendar' || !ag.data_agendamento) {
        status = 'futuro'
      } else if (ag.status === 'remarcado') {
        status = 'futuro'
      } else {
        const dataAg = parseISO(ag.data_agendamento)
        const diffDias = differenceInDays(hoje, dataAg)
        if (diffDias > 1)       status = 'risco'   // agendado mas já passou
        else if (diffDias >= -1) status = 'atual'  // hoje ou amanhã
        else                     status = 'futuro'
      }

      const dataAg = ag.data_agendamento ? parseISO(ag.data_agendamento) : null

      return {
        id:            ag.id,
        label:         ag.label,
        offset_dias:   dataAg ? differenceInDays(dataAg, inicio) : undefined,
        data_prevista: ag.data_agendamento,
        data_execucao: ag.status === 'atendido' ? ag.data_agendamento : null,
        status,
        hora:          ag.hora,
        profissional:  ag.profissional,
        observacao:    ag.observacao,
        source:        'agendamento' as const,
      }
    })
  }

  // Prioridade 2: execuções do protocolo (se existirem)
  if (execucoes.length > 0) {
    return execucoes.map((e) => ({
      id:                e.id,
      label:             e.momento?.label ?? 'Momento',
      pergunta:          e.momento?.pergunta,
      offset_dias:       e.momento?.offset_dias ?? 0,
      data_prevista:     e.data_prevista,
      data_execucao:     e.data_execucao,
      status:            e.status as TimelineStatus,
      resposta_paciente: e.resposta_paciente,
      analise_ia:        e.analise_ia,
      source:            'execucao' as const,
    }))
  }

  // Prioridade 3: projeção dos momentos do protocolo sobre plano_inicio
  if (momentos.length > 0) {
    return momentos.map((m) => {
      const dataPrevista = addDays(inicio, m.offset_dias)
      const diffDias = differenceInDays(hoje, dataPrevista)

      let status: TimelineStatus
      if (diffDias > 3)        status = 'risco'
      else if (diffDias >= -3) status = 'atual'
      else                     status = 'futuro'

      return {
        id:            m.id,
        label:         m.label,
        pergunta:      m.pergunta,
        offset_dias:   m.offset_dias,
        data_prevista: dataPrevista.toISOString(),
        status,
        source:        'momento' as const,
      }
    })
  }

  return []
}

// ── Status config ───────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<TimelineStatus, {
  icon: React.ElementType
  label: string
  labelSemData: string
  dot: string
  line: string
  badge: 'bom' | 'atencao' | 'critico' | 'neutro' | 'info'
}> = {
  executado: { icon: CheckCircle, label: 'Realizado',   labelSemData: 'Realizado',   dot: 'bg-emerald-500 border-emerald-500', line: 'bg-emerald-200', badge: 'bom' },
  atual:     { icon: Play,        label: 'Em breve',    labelSemData: 'A agendar',   dot: 'bg-blue-500 border-blue-500',       line: 'bg-blue-200',    badge: 'info' },
  pendente:  { icon: Clock,       label: 'Pendente',    labelSemData: 'A agendar',   dot: 'bg-amber-400 border-amber-400',     line: 'bg-amber-200',   badge: 'atencao' },
  risco:     { icon: AlertCircle, label: 'Não realiz.', labelSemData: 'A agendar',   dot: 'bg-red-500 border-red-500',         line: 'bg-red-200',     badge: 'critico' },
  futuro:    { icon: Circle,      label: 'Agendado',    labelSemData: 'A agendar',   dot: 'bg-gray-200 border-gray-300',       line: 'bg-gray-100',    badge: 'neutro' },
  cancelado: { icon: SkipForward, label: 'Cancelado',   labelSemData: 'Cancelado',   dot: 'bg-gray-200 border-gray-300',       line: 'bg-gray-100',    badge: 'neutro' },
}

// ── Currency format ─────────────────────────────────────────────────────────

function formatBRL(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// ── Props ───────────────────────────────────────────────────────────────────

interface Props {
  paciente: Patient
  agendamentos: Agendamento[]
  execucoes: (ProtocolExecution & { momento?: ProtocolMoment | null })[]
  momentos: ProtocolMoment[]
  contatos: Contact[]
  pesos: WeightRecord[]
  alertas: Alert[]
  correcoes: RouteCorrection[]
  clinicaId: string
}

export function PatientProfileClient({
  paciente, agendamentos, execucoes, momentos, contatos, pesos,
  alertas: alertasIniciais, correcoes: correcoesIniciais, clinicaId,
}: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('protocolo')
  const [correcoes, setCorrecoes] = useState(correcoesIniciais)
  const [pesosState, setPesosState] = useState(pesos)

  const diasFim = daysUntil(paciente.plano_fim)
  const timeline = buildTimeline(paciente, agendamentos, execucoes, momentos)
  const momentosFeitos = timeline.filter((t) => t.status === 'executado').length
  const progressoPct = timeline.length > 0 ? Math.round((momentosFeitos / timeline.length) * 100) : 0
  const usingAgendamentos = agendamentos.length > 0

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

      {/* ── Header do perfil ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-5">
        <div className="flex items-start gap-5">
          <PatientAvatar nome={paciente.nome} nivel={paciente.nivel} foto_url={paciente.foto_url} size="xl" />

          <div className="flex-1 min-w-0">
            <h1 className="font-display text-2xl text-gray-900">{paciente.nome}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{paciente.especialidade}</p>

            {/* Chips de info */}
            <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3">
              <StatChip icon={Calendar} label={`Início: ${formatDate(paciente.plano_inicio, 'dd MMM yyyy')}`} />
              <StatChip
                icon={Clock}
                label={
                  diasFim < 0
                    ? `Plano vencido há ${Math.abs(diasFim)} dias`
                    : `Até ${formatDate(paciente.plano_fim, 'dd MMM yyyy')} (${diasFim}d)`
                }
                alert={diasFim <= 30}
              />
              {timeline.length > 0 && (
                <StatChip icon={CheckCircle} label={`${momentosFeitos}/${timeline.length} sessões`} success={momentosFeitos > 0} />
              )}
              <StatChip icon={MessageSquare} label={`${contatos.length} contato${contatos.length !== 1 ? 's' : ''}`} />
              {paciente.meta_kg && (
                <StatChip icon={Target} label={`Meta: ${Math.abs(paciente.meta_kg)} kg`} />
              )}
            </div>

            {/* Financeiro */}
            {(paciente.valor_plano || paciente.valor_pago) && (
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2.5 pt-2.5 border-t border-gray-100">
                {paciente.valor_plano && (
                  <StatChip icon={DollarSign} label={`Plano: ${formatBRL(paciente.valor_plano)}`} />
                )}
                {paciente.valor_pago && (
                  <StatChip
                    icon={CreditCard}
                    label={`Pago: ${formatBRL(paciente.valor_pago)}`}
                    success
                  />
                )}
                {paciente.valor_plano && paciente.valor_pago && paciente.valor_pago < paciente.valor_plano && (
                  <StatChip
                    icon={AlertCircle}
                    label={`Pendente: ${formatBRL(paciente.valor_plano - paciente.valor_pago)}`}
                    alert
                  />
                )}
              </div>
            )}

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

        {/* Barra de progresso */}
        {timeline.length > 0 && (
          <div className="mt-5 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs text-gray-400 font-medium">Progresso do tratamento</p>
              <p className="text-xs font-semibold text-gray-600">{progressoPct}%</p>
            </div>
            <div className="flex gap-1">
              {timeline.map((t, i) => (
                <div
                  key={i}
                  title={t.label}
                  className={cn(
                    'flex-1 h-[6px] rounded-full transition-colors',
                    t.status === 'executado' ? 'bg-emerald-500' :
                    t.status === 'risco'     ? 'bg-red-500' :
                    t.status === 'atual'     ? 'bg-blue-400' :
                    t.status === 'pendente'  ? 'bg-amber-400' :
                    'bg-gray-200'
                  )}
                />
              ))}
            </div>
            <p className="text-[11px] text-gray-400 mt-1.5">
              {momentosFeitos} de {timeline.length} sessões realizadas
            </p>
          </div>
        )}
      </div>

      {/* ── Layout principal ─────────────────────────────────────────────── */}
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
                {t === 'protocolo'
                  ? `Tratamento (${timeline.length})`
                  : t === 'contatos' ? `Contatos (${contatos.length})`
                  : t === 'peso'    ? 'Peso & Meta'
                  : 'Análise IA'}
              </button>
            ))}
          </div>

          {/* ── Tab: Tratamento / Linha do tempo ── */}
          {tab === 'protocolo' && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {usingAgendamentos ? 'Sessões agendadas' : 'Linha do tempo do plano'}
                </CardTitle>
                {timeline.length > 0 && (
                  <span className="text-xs text-gray-400">
                    {formatDate(paciente.plano_inicio, 'dd MMM')} → {formatDate(paciente.plano_fim, 'dd MMM yyyy')}
                  </span>
                )}
              </CardHeader>

              {timeline.length === 0 ? (
                <div className="text-center py-8">
                  <Circle className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">Nenhum agendamento cadastrado.</p>
                  <p className="text-xs text-gray-300 mt-1">Importe os agendamentos do SupportClinic via PDF.</p>
                </div>
              ) : (
                <div className="relative">
                  {timeline.map((item, index) => {
                    const cfg = STATUS_CONFIG[item.status]
                    const Icon = cfg.icon
                    const isLast = index === timeline.length - 1

                    return (
                      <div key={item.id} className="flex gap-4 relative">
                        {/* Linha vertical conectora */}
                        {!isLast && (
                          <div className={cn(
                            'absolute left-[15px] top-8 bottom-0 w-[2px]',
                            cfg.line
                          )} />
                        )}

                        {/* Nó da timeline */}
                        <div className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 border-2',
                          item.status === 'futuro' || item.status === 'cancelado'
                            ? 'bg-white border-gray-200'
                            : cfg.dot + ' border-transparent'
                        )}>
                          <Icon className={cn(
                            'w-3.5 h-3.5',
                            item.status === 'executado' ? 'text-white' :
                            item.status === 'atual'     ? 'text-white' :
                            item.status === 'risco'     ? 'text-white' :
                            item.status === 'pendente'  ? 'text-white' :
                            'text-gray-300'
                          )} />
                        </div>

                        {/* Conteúdo do marco */}
                        <div className={cn('flex-1 pb-6', isLast && 'pb-0')}>
                          <div className="flex items-start justify-between gap-2 flex-wrap">
                            <div>
                              <span className="text-sm font-semibold text-gray-800">{item.label}</span>
                              {item.source !== 'agendamento' && item.offset_dias !== undefined && (
                                <span className="text-xs text-gray-400 ml-2">D+{item.offset_dias}</span>
                              )}
                            </div>
                            <Badge variant={cfg.badge} size="sm">
                              {!item.data_prevista ? cfg.labelSemData : cfg.label}
                            </Badge>
                          </div>

                          {/* Data e hora */}
                          <p className="text-[11px] text-gray-400 mt-1">
                            {item.source === 'agendamento'
                              ? !item.data_prevista
                                ? 'Data a confirmar com a clínica'
                                : item.data_execucao
                                  ? `Realizado em ${formatDate(item.data_prevista, 'dd MMM yyyy')}`
                                  : `${formatDate(item.data_prevista, 'dd MMM yyyy')}${item.hora ? ` · ${item.hora.substring(0, 5)}` : ''}`
                              : item.data_execucao
                                ? `Executado em ${formatDateTime(item.data_execucao)}`
                                : item.data_prevista
                                  ? `Previsto: ${formatDate(item.data_prevista, 'dd MMM yyyy')}`
                                  : 'A agendar'
                            }
                          </p>

                          {/* Profissional */}
                          {item.profissional && (
                            <p className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {item.profissional}
                            </p>
                          )}

                          {/* Detalhes clínicos da sessão */}
                          {item.observacao && (
                            <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                              {item.observacao}
                            </p>
                          )}

                          {/* Pergunta do protocolo */}
                          {item.pergunta && (
                            <p className="text-xs text-blue-600 italic mt-1 leading-relaxed">
                              "{item.pergunta}"
                            </p>
                          )}

                          {/* Resposta do paciente */}
                          {item.resposta_paciente && (
                            <div className="mt-2 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                              <p className="text-xs text-gray-500 font-medium mb-0.5">Resposta do paciente:</p>
                              <p className="text-xs text-gray-700 leading-relaxed">"{item.resposta_paciente}"</p>
                            </div>
                          )}

                          {/* Análise IA */}
                          {item.analise_ia && (
                            <div className="mt-1.5 bg-emerald-50 rounded-lg px-3 py-2 border border-emerald-100">
                              <p className="text-xs text-emerald-700 leading-relaxed">🤖 {item.analise_ia}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>
          )}

          {/* ── Tab: Contatos ── */}
          {tab === 'contatos' && (
            <Card>
              <CardHeader>
                <CardTitle>Histórico de contatos</CardTitle>
              </CardHeader>
              {contatos.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">Nenhum contato registrado.</p>
              ) : (
                <div className="relative">
                  {contatos.map((c, index) => {
                    const isLast = index === contatos.length - 1
                    return (
                      <div key={c.id} className="flex gap-4 relative">
                        {!isLast && (
                          <div className="absolute left-[15px] top-8 bottom-0 w-[2px] bg-gray-100" />
                        )}
                        <div className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 border-2 border-transparent',
                          c.resposta ? 'bg-emerald-500' : 'bg-blue-400'
                        )}>
                          <MessageSquare className="w-3.5 h-3.5 text-white" />
                        </div>
                        <div className={cn('flex-1 pb-5', isLast && 'pb-0')}>
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <Badge variant={c.resposta ? 'bom' : 'neutro'} size="sm">
                              {c.resposta ? 'respondeu' : 'sem resposta'}
                            </Badge>
                            {c.tipo === 'automatico' && (
                              <Badge variant="info" size="sm">automático</Badge>
                            )}
                            <span className="text-[11px] text-gray-400">{formatDateTime(c.criado_em)}</span>
                          </div>
                          <p className="text-xs text-gray-500 italic leading-relaxed">"{c.mensagem}"</p>
                          {c.resposta && (
                            <div className="mt-1.5 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                              <p className="text-xs text-gray-700 leading-relaxed">↩ "{c.resposta}"</p>
                            </div>
                          )}
                          {c.analise_ia && (
                            <p className="text-xs text-emerald-700 mt-1 bg-emerald-50 rounded px-2 py-1">
                              🤖 {c.analise_ia}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>
          )}

          {/* ── Tab: Peso ── */}
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

          {/* ── Tab: Análise IA ── */}
          {tab === 'ia' && (
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <span className="text-base">🤖</span>
                </div>
                <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                  Resumo do paciente — IA
                </p>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">
                Análise de IA será exibida aqui após integração com modelo de linguagem.
              </p>
              <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-xs text-gray-500">
                  Score: <strong className="text-gray-800">{paciente.score}/100</strong> ·
                  Nível: <strong className="text-gray-800 capitalize">{paciente.nivel}</strong> ·
                  Sessões: <strong className="text-gray-800">{momentosFeitos}/{timeline.length}</strong> ·
                  Contatos: <strong className="text-gray-800">{contatos.length}</strong>
                </p>
              </div>
            </Card>
          )}
        </div>

        {/* ── Sidebar direita ── */}
        <div className="space-y-4">
          <PatientContextCard patient={paciente} />
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
  icon: Icon, label, alert, success,
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
