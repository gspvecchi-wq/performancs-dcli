'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  ArrowLeft, Calendar, Clock, MessageSquare, Target,
  CheckCircle, AlertCircle, Circle, Play, XCircle,
  DollarSign, CreditCard, User, Syringe, Pencil, Check, X,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { FEATURES } from '@/lib/config/features'
import { PatientAvatar } from '@/components/pacientes/PatientAvatar'
import { ScoreRing } from '@/components/perfil/ScoreRing'
import { calcHealthScore } from '@/lib/scoring/healthScore'
import { PatientContextCard } from '@/components/perfil/PatientContextCard'
import { QuickRouteCorrection } from '@/components/perfil/QuickRouteCorrection'
import { WeightTracker } from '@/components/perfil/WeightTracker'
import { Badge, ALERT_LABELS, ALERT_BADGE, scoreToBadge } from '@/components/ui/Badge'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import type {
  Patient, Agendamento, ProtocolExecution, ProtocolMoment,
  Contact, WeightRecord, Alert, RouteCorrection, PlanoItemView,
} from '@/types/patient'
import { formatDate, formatDateTime, daysUntil } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'
import { addDays, differenceInDays, parseISO } from 'date-fns'

type Tab = 'plano' | 'protocolo' | 'contatos' | 'peso' | 'ia'

// ── Plano de acompanhamento (feito × falta) ─────────────────────────────────

interface PlanoItemComputed {
  id: string
  nome: string
  prevista: number
  realizada: number
  restante: number
  pct: number
  frequencia_dias: number
  esperadas: number     // quantas já deveriam ter sido feitas até hoje
  atraso: number        // esperadas − realizadas (sessões em atraso), min 0
  status: 'concluido' | 'em_dia' | 'risco' | 'vencido'
}

function computePlano(planoItens: PlanoItemView[], planoInicio: string, planoFim: string) {
  const hoje = new Date()
  const diasAteFim = differenceInDays(parseISO(planoFim), hoje)
  const diasDecorridos = Math.max(differenceInDays(hoje, parseISO(planoInicio)), 0)

  const itens: PlanoItemComputed[] = planoItens.map((it) => {
    const prevista = it.qtd_prevista
    const realizada = it.qtd_realizada
    const restante = it.qtd_restante
    const freq = it.procedimento?.frequencia_dias ?? 7
    const pct = prevista > 0 ? Math.round((realizada / prevista) * 100) : 0

    // Ritmo esperado: a 1ª sessão no início, depois uma a cada `freq` dias.
    // Quantas já deveriam ter sido feitas até hoje (limitado ao previsto).
    const esperadas = freq > 0
      ? Math.min(prevista, Math.floor(diasDecorridos / freq) + 1)
      : 0
    const atraso = Math.max(esperadas - realizada, 0)

    let status: PlanoItemComputed['status']
    if (restante <= 0) {
      status = 'concluido'
    } else if (diasAteFim < 0) {
      status = 'vencido'                     // plano acabou com pendência
    } else if (freq > 0 && atraso >= 1) {
      status = 'risco'                       // atrasado em relação ao ritmo esperado
    } else {
      status = 'em_dia'
    }

    return { id: it.id, nome: it.procedimento?.nome ?? '—', prevista, realizada, restante, pct, frequencia_dias: freq, esperadas, atraso, status }
  })

  // ordena: vencido/atrasado primeiro (maior atraso), depois em dia, concluídos por último
  const ordem: Record<PlanoItemComputed['status'], number> = { vencido: 0, risco: 1, em_dia: 2, concluido: 3 }
  itens.sort((a, b) => ordem[a.status] - ordem[b.status] || b.atraso - a.atraso || b.restante - a.restante)

  const totalPrev = itens.reduce((n, i) => n + i.prevista, 0)
  const totalFeito = itens.reduce((n, i) => n + i.realizada, 0)
  const totalFalta = itens.reduce((n, i) => n + i.restante, 0)
  const emRisco = itens.filter((i) => i.status === 'risco' || i.status === 'vencido')

  return { itens, totalPrev, totalFeito, totalFalta, emRisco, diasAteFim }
}

/** Item em edição na ficha (espelha plano_itens + procedimento) */
interface EditItem {
  id: string
  procedimento_id: string
  nome: string
  frequencia_dias: number
  qtd_prevista: number
  qtd_realizada: number
}

const FREQ_OPTS: { dias: number; label: string }[] = [
  { dias: 7, label: 'Semanal' },
  { dias: 14, label: 'Quinzenal' },
  { dias: 30, label: 'Mensal' },
  { dias: 0, label: 'Dose única' },
]

const PLANO_STATUS_CFG: Record<PlanoItemComputed['status'], { badge: 'bom' | 'atencao' | 'critico' | 'neutro'; label: string; bar: string }> = {
  concluido: { badge: 'bom',     label: 'Concluído', bar: 'bg-emerald-500' },
  em_dia:    { badge: 'neutro',  label: 'Em dia',    bar: 'bg-blue-400' },
  risco:     { badge: 'atencao', label: 'Atrasado',  bar: 'bg-amber-400' },
  vencido:   { badge: 'critico', label: 'Vencido',   bar: 'bg-red-500' },
}

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
  executado: { icon: CheckCircle, label: 'Realizado',   labelSemData: 'Realizado',   dot: 'bg-emerald-500 border-emerald-500', line: 'bg-emerald-500/30', badge: 'bom' },
  atual:     { icon: Play,        label: 'Em breve',    labelSemData: 'A agendar',   dot: 'bg-blue-500 border-blue-500',       line: 'bg-blue-500/30',    badge: 'info' },
  pendente:  { icon: Clock,       label: 'Pendente',    labelSemData: 'A agendar',   dot: 'bg-amber-400 border-amber-400',     line: 'bg-amber-400/30',   badge: 'atencao' },
  risco:     { icon: AlertCircle, label: 'Não realiz.', labelSemData: 'A agendar',   dot: 'bg-red-500 border-red-500',         line: 'bg-red-500/30',     badge: 'critico' },
  futuro:    { icon: Circle,      label: 'Agendado',    labelSemData: 'A agendar',   dot: 'bg-white/[0.12] border-white/[0.2]', line: 'bg-white/[0.05]', badge: 'neutro' },
  cancelado: { icon: XCircle,     label: 'Cancelado',   labelSemData: 'Cancelado',   dot: 'bg-red-400 border-red-400',           line: 'bg-red-500/20',   badge: 'critico' },
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
  planoItens: PlanoItemView[]
  clinicaId: string
}

export function PatientProfileClient({
  paciente, agendamentos, execucoes, momentos, contatos, pesos,
  alertas: alertasIniciais, correcoes: correcoesIniciais, planoItens, clinicaId,
}: Props) {
  const router = useRouter()
  const plano = computePlano(planoItens, paciente.plano_inicio, paciente.plano_fim)
  const temPlano = plano.itens.length > 0
  const [tab, setTab] = useState<Tab>(temPlano ? 'plano' : 'protocolo')

  // Coluna lateral direita só aparece se algum de seus cards estiver ativo
  const mostrarLateral = FEATURES.contextoPaciente || FEATURES.correcoesRota

  // ── Edição do plano na própria ficha ──
  const [editando, setEditando] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [editItens, setEditItens] = useState<EditItem[]>([])

  function iniciarEdicao() {
    setEditItens(planoItens.map((it) => ({
      id: it.id,
      procedimento_id: it.procedimento_id,
      nome: it.procedimento?.nome ?? '',
      frequencia_dias: it.procedimento?.frequencia_dias ?? 7,
      qtd_prevista: it.qtd_prevista,
      qtd_realizada: it.qtd_realizada,
    })))
    setEditando(true)
  }

  function patchEdit(idx: number, patch: Partial<EditItem>) {
    setEditItens((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)))
  }

  async function salvarEdicao() {
    setSalvando(true)
    try {
      const res = await fetch('/api/plano/atualizar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itens: editItens }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erro ao salvar')
      toast.success(data.message ?? 'Plano atualizado')
      setEditando(false)
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao salvar')
    } finally {
      setSalvando(false)
    }
  }
  const [correcoes, setCorrecoes] = useState(correcoesIniciais)
  const [pesosState, setPesosState] = useState(pesos)

  const diasFim = daysUntil(paciente.plano_fim)
  const timeline = buildTimeline(paciente, agendamentos, execucoes, momentos)
  const momentosFeitos = timeline.filter((t) => t.status === 'executado').length
  const progressoPct = timeline.length > 0 ? Math.round((momentosFeitos / timeline.length) * 100) : 0
  const usingAgendamentos = agendamentos.length > 0

  // ── Health Score unificado (DB + WhatsApp dinâmico) ──
  const healthScore = calcHealthScore(paciente.score, contatos)

  return (
    <div>
      {/* Voltar */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-white/50 hover:text-white/80 transition-colors mb-5 font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar
      </button>

      {/* ── Header do perfil ─────────────────────────────────────────────── */}
      <div className="bg-[#0C1F18] rounded-2xl border border-white/[0.07] p-6 mb-5">
        <div className="flex items-start gap-5">
          <PatientAvatar nome={paciente.nome} nivel={paciente.nivel} foto_url={paciente.foto_url} size="xl" />

          <div className="flex-1 min-w-0">
            <h1 className="font-display text-2xl text-white">{paciente.nome}</h1>
            <p className="text-sm text-white/50 mt-0.5">
              {paciente.prontuario && <span className="text-white/70">Prontuário {paciente.prontuario}</span>}
              {paciente.prontuario && paciente.especialidade && ' · '}
              {paciente.especialidade}
            </p>

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
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2.5 pt-2.5 border-t border-white/[0.05]">
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

          {/* Score Ring + Breakdown */}
          <div className="flex-shrink-0">
            <ScoreRing
              score={healthScore.total}
              breakdown={healthScore.breakdown}
              whatsappActive={healthScore.whatsappActive}
            />
          </div>
        </div>

        {/* Barra de progresso */}
        {timeline.length > 0 && (
          <div className="mt-5 pt-4 border-t border-white/[0.05]">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs text-white/35 font-medium">Progresso do tratamento</p>
              <p className="text-xs font-semibold text-white/60">{progressoPct}%</p>
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
                    'bg-white/[0.12]'
                  )}
                />
              ))}
            </div>
            <p className="text-[11px] text-white/35 mt-1.5">
              {momentosFeitos} de {timeline.length} sessões realizadas
            </p>
          </div>
        )}
      </div>

      {/* ── Layout principal ─────────────────────────────────────────────── */}
      <div className={cn('grid gap-5', mostrarLateral ? 'grid-cols-[1fr_320px]' : 'grid-cols-1')}>
        {/* Coluna principal */}
        <div className="space-y-5">

          {/* Tabs */}
          <div className="flex border-b border-white/[0.08]">
            {([...(temPlano ? ['plano'] : []), 'protocolo', 'contatos', 'peso', 'ia'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-all',
                  tab === t
                    ? 'border-emerald-500 text-emerald-400'
                    : 'border-transparent text-white/50 hover:text-white/70'
                )}
              >
                {t === 'plano'
                  ? `Plano (${plano.itens.length})`
                  : t === 'protocolo'
                  ? `Tratamento (${timeline.length})`
                  : t === 'contatos' ? `Contatos (${contatos.length})`
                  : t === 'peso'    ? 'Peso & Meta'
                  : 'Análise IA'}
              </button>
            ))}
          </div>

          {/* ── Tab: Plano de acompanhamento (feito × falta) ── */}
          {tab === 'plano' && (
            <Card>
              <CardHeader>
                <CardTitle>Plano de acompanhamento</CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/35">
                    {formatDate(paciente.plano_inicio, 'dd MMM')} → {formatDate(paciente.plano_fim, 'dd MMM yyyy')}
                  </span>
                  {editando ? (
                    <>
                      <Button size="sm" variant="success" onClick={salvarEdicao} loading={salvando}>
                        {!salvando && <Check className="w-3.5 h-3.5" />} Salvar
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => setEditando(false)} disabled={salvando}>
                        <X className="w-3.5 h-3.5" /> Cancelar
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" variant="secondary" onClick={iniciarEdicao}>
                      <Pencil className="w-3.5 h-3.5" /> Editar
                    </Button>
                  )}
                </div>
              </CardHeader>

              {/* Resumo */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <PlanoStat label="Sessões feitas" value={`${plano.totalFeito}/${plano.totalPrev}`} tone="emerald" />
                <PlanoStat label="Faltando" value={plano.totalFalta} tone={plano.totalFalta > 0 ? 'amber' : 'emerald'} />
                <PlanoStat
                  label={plano.diasAteFim < 0 ? 'Plano vencido há' : 'Dias até o fim'}
                  value={plano.diasAteFim < 0 ? `${Math.abs(plano.diasAteFim)}d` : `${plano.diasAteFim}d`}
                  tone={plano.diasAteFim <= 30 ? 'red' : 'neutro'}
                />
              </div>

              {/* Fim previsto pelo ritmo real — evidencia o escorregamento */}
              {paciente.plano_fim_previsto && paciente.plano_fim_previsto !== paciente.plano_fim && (
                <div className="mb-4 flex items-center gap-2 text-[11px]">
                  <Clock className="w-3.5 h-3.5 text-amber-400/70 flex-shrink-0" />
                  <span className="text-white/45">
                    Contratado até <strong className="text-white/70">{formatDate(paciente.plano_fim, 'dd MMM yyyy')}</strong>
                    {' · '}pelo ritmo atual deve terminar em{' '}
                    <strong className="text-amber-300">{formatDate(paciente.plano_fim_previsto, 'dd MMM yyyy')}</strong>
                  </span>
                </div>
              )}

              {/* Alerta de data */}
              {plano.emRisco.length > 0 && (
                <div className="mb-4 rounded-xl border border-amber-500/25 bg-amber-500/[0.07] p-3">
                  <div className="flex items-center gap-2 text-amber-300 text-xs font-semibold mb-1.5">
                    <AlertCircle className="w-4 h-4" />
                    {plano.emRisco.length} procedimento(s) atrasado(s)
                  </div>
                  <ul className="text-[11px] text-amber-200/70 space-y-0.5">
                    {plano.emRisco.map((it) => (
                      <li key={it.id}>
                        <strong>{it.nome}</strong>:{' '}
                        {it.status === 'vencido'
                          ? `plano venceu com ${it.restante} sessão(ões) pendente(s)`
                          : `${it.atraso} sessão(ões) em atraso — deveria ter ~${it.esperadas} feita(s) até hoje, tem ${it.realizada}`}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Itens — modo edição */}
              {editando ? (
                <div className="space-y-2.5">
                  {editItens.map((it, i) => (
                    <div key={it.id} className="rounded-lg border border-emerald-500/25 bg-white/[0.02] p-3 space-y-2">
                      {/* Nome do procedimento */}
                      <input
                        type="text" value={it.nome}
                        onChange={(e) => patchEdit(i, { nome: e.target.value })}
                        placeholder="Nome do procedimento"
                        className="w-full text-sm bg-white/[0.04] border border-white/[0.08] rounded px-2 py-1.5 text-white/85 focus:border-emerald-500/50 focus:outline-none"
                      />
                      {/* Frequência + quantidades */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <select
                          value={it.frequencia_dias}
                          onChange={(e) => patchEdit(i, { frequencia_dias: parseInt(e.target.value) })}
                          className="text-xs bg-white/[0.04] border border-white/[0.08] rounded px-2 py-1 text-white/80 focus:border-emerald-500/50 focus:outline-none"
                        >
                          {FREQ_OPTS.map((o) => (
                            <option key={o.dias} value={o.dias} className="bg-[#0C1F18] text-white">
                              {o.label}
                            </option>
                          ))}
                        </select>
                        <label className="flex items-center gap-1 text-[11px] text-white/40">
                          Previstas
                          <input
                            type="number" min={0} value={it.qtd_prevista}
                            onChange={(e) => patchEdit(i, { qtd_prevista: Math.max(0, parseInt(e.target.value) || 0) })}
                            className="w-16 text-center text-xs bg-white/[0.04] border border-white/[0.08] rounded px-1 py-1 text-white/80 focus:border-emerald-500/50 focus:outline-none"
                          />
                        </label>
                        <label className="flex items-center gap-1 text-[11px] text-white/40">
                          Feitas
                          <input
                            type="number" min={0} value={it.qtd_realizada}
                            onChange={(e) => patchEdit(i, { qtd_realizada: Math.max(0, parseInt(e.target.value) || 0) })}
                            className="w-16 text-center text-xs bg-white/[0.04] border border-white/[0.08] rounded px-1 py-1 text-white/80 focus:border-emerald-500/50 focus:outline-none"
                          />
                        </label>
                        <span className="text-[11px] ml-auto">
                          <span className="text-white/35">Falta </span>
                          <span className="font-semibold text-amber-300">
                            {Math.max(it.qtd_prevista - it.qtd_realizada, 0)}
                          </span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
              <div className="space-y-2.5">
                {plano.itens.map((it) => {
                  const cfg = PLANO_STATUS_CFG[it.status]
                  return (
                    <div key={it.id} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <Syringe className="w-3.5 h-3.5 text-emerald-400/70 flex-shrink-0" />
                          <span className="text-sm text-white/80 font-medium truncate" title={it.nome}>{it.nome}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-sm font-semibold text-white/70">{it.realizada}/{it.prevista}</span>
                          <Badge variant={cfg.badge} size="sm">{cfg.label}</Badge>
                        </div>
                      </div>
                      {/* Barra de progresso */}
                      <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                        <div className={cn('h-full rounded-full transition-all', cfg.bar)} style={{ width: `${it.pct}%` }} />
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] text-white/30">
                          {it.frequencia_dias > 0 ? `1×/${it.frequencia_dias === 7 ? 'semana' : it.frequencia_dias + ' dias'}` : 'dose única'}
                        </span>
                        <span className={cn('text-[10px] font-medium', it.restante > 0 ? 'text-amber-300/80' : 'text-emerald-400/80')}>
                          {it.restante <= 0
                            ? 'completo'
                            : it.atraso > 0
                              ? `faltam ${it.restante} · ${it.atraso} em atraso`
                              : `faltam ${it.restante}`}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
              )}
            </Card>
          )}

          {/* ── Tab: Tratamento / Linha do tempo ── */}
          {tab === 'protocolo' && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {usingAgendamentos ? 'Sessões agendadas' : 'Linha do tempo do plano'}
                </CardTitle>
                {timeline.length > 0 && (
                  <span className="text-xs text-white/35">
                    {formatDate(paciente.plano_inicio, 'dd MMM')} → {formatDate(paciente.plano_fim, 'dd MMM yyyy')}
                  </span>
                )}
              </CardHeader>

              {timeline.length === 0 ? (
                <div className="text-center py-8">
                  <Circle className="w-8 h-8 text-white/20 mx-auto mb-2" />
                  <p className="text-sm text-white/35">Nenhum agendamento cadastrado.</p>
                  <p className="text-xs text-white/25 mt-1">Importe os agendamentos do SupportClinic via PDF.</p>
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
                            ? 'bg-white/[0.05] border-white/[0.1]'
                            : cfg.dot + ' border-transparent'
                        )}>
                          <Icon className={cn(
                            'w-3.5 h-3.5',
                            item.status === 'executado' ? 'text-white' :
                            item.status === 'atual'     ? 'text-white' :
                            item.status === 'risco'     ? 'text-white' :
                            item.status === 'pendente'  ? 'text-white' :
                            'text-white/30'
                          )} />
                        </div>

                        {/* Conteúdo do marco */}
                        <div className={cn('flex-1 pb-6', isLast && 'pb-0')}>
                          <div className="flex items-start justify-between gap-2 flex-wrap">
                            <div>
                              <span className="text-sm font-semibold text-white/85">{item.label}</span>
                              {item.source !== 'agendamento' && item.offset_dias !== undefined && (
                                <span className="text-xs text-white/35 ml-2">D+{item.offset_dias}</span>
                              )}
                            </div>
                            <Badge variant={cfg.badge} size="sm">
                              {!item.data_prevista ? cfg.labelSemData : cfg.label}
                            </Badge>
                          </div>

                          {/* Data e hora */}
                          <p className="text-[11px] text-white/35 mt-1">
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
                            <p className="text-[11px] text-white/45 mt-0.5 flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {item.profissional}
                            </p>
                          )}

                          {/* Detalhes clínicos da sessão */}
                          {item.observacao && (
                            <p className="text-[11px] text-white/35 mt-1 leading-relaxed">
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
                            <div className="mt-2 bg-white/[0.04] rounded-lg px-3 py-2 border border-white/[0.05]">
                              <p className="text-xs text-white/50 font-medium mb-0.5">Resposta do paciente:</p>
                              <p className="text-xs text-white/70 leading-relaxed">"{item.resposta_paciente}"</p>
                            </div>
                          )}

                          {/* Análise IA */}
                          {item.analise_ia && (
                            <div className="mt-1.5 bg-emerald-500/10 rounded-lg px-3 py-2 border border-emerald-500/20">
                              <p className="text-xs text-emerald-400 leading-relaxed">🤖 {item.analise_ia}</p>
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
                <p className="text-sm text-white/35 text-center py-6">Nenhum contato registrado.</p>
              ) : (
                <div className="relative">
                  {contatos.map((c, index) => {
                    const isLast = index === contatos.length - 1
                    return (
                      <div key={c.id} className="flex gap-4 relative">
                        {!isLast && (
                          <div className="absolute left-[15px] top-8 bottom-0 w-[2px] bg-white/[0.05]" />
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
                            <span className="text-[11px] text-white/35">{formatDateTime(c.criado_em)}</span>
                          </div>
                          <p className="text-xs text-white/50 italic leading-relaxed">"{c.mensagem}"</p>
                          {c.resposta && (
                            <div className="mt-1.5 bg-white/[0.04] rounded-lg px-3 py-2 border border-white/[0.05]">
                              <p className="text-xs text-white/70 leading-relaxed">↩ "{c.resposta}"</p>
                            </div>
                          )}
                          {c.analise_ia && (
                            <p className="text-xs text-emerald-400 mt-1 bg-emerald-500/10 rounded px-2 py-1">
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
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                  <span className="text-base">🤖</span>
                </div>
                <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                  Resumo do paciente — IA
                </p>
              </div>
              <p className="text-sm text-white/50 leading-relaxed">
                Análise de IA será exibida aqui após integração com modelo de linguagem.
              </p>
              <div className="mt-4 p-3 bg-white/[0.04] rounded-lg border border-white/[0.05]">
                <p className="text-xs text-white/50">
                  Score: <strong className="text-white/85">{healthScore.total}/100</strong>
                  {healthScore.whatsappActive && (
                    <span className="text-amber-400/70"> (clínico {healthScore.dbScore} + WhatsApp {healthScore.whatsappPts}pts)</span>
                  )} ·{' '}
                  Nível: <strong className="text-white/85 capitalize">{healthScore.nivel}</strong> ·
                  Sessões: <strong className="text-white/85">{momentosFeitos}/{timeline.length}</strong> ·
                  Contatos: <strong className="text-white/85">{contatos.length}</strong>
                </p>
              </div>
            </Card>
          )}
        </div>

        {/* ── Sidebar direita (oculta via FEATURES) ── */}
        {mostrarLateral && (
          <div className="space-y-4">
            {FEATURES.contextoPaciente && <PatientContextCard patient={paciente} />}
            {FEATURES.correcoesRota && (
              <QuickRouteCorrection
                pacienteId={paciente.id}
                correcoes={correcoes}
                onAdd={(nova) => setCorrecoes((prev) => [nova, ...prev])}
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function PlanoStat({
  label, value, tone,
}: {
  label: string; value: string | number; tone: 'emerald' | 'amber' | 'red' | 'neutro'
}) {
  const toneCls: Record<string, string> = {
    emerald: 'text-emerald-400',
    amber:   'text-amber-400',
    red:     'text-red-400',
    neutro:  'text-white/70',
  }
  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
      <div className={cn('text-lg font-semibold', toneCls[tone])}>{value}</div>
      <div className="text-[10px] text-white/35 uppercase tracking-wide mt-0.5">{label}</div>
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
      alert ? 'text-amber-500' : success ? 'text-emerald-400' : 'text-white/50'
    )}>
      <Icon className="w-3.5 h-3.5 flex-shrink-0" />
      {label}
    </span>
  )
}
