'use client'

import { useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle, Info, Check, X, Stethoscope, TrendingUp, LayoutList } from 'lucide-react'
import { Badge, ALERT_LABELS, ALERT_BADGE, severityToBadge } from '@/components/ui/Badge'
import { PatientAvatar } from '@/components/pacientes/PatientAvatar'
import { Button } from '@/components/ui/Button'
import { toast } from 'sonner'
import { formatRelative } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'
import Link from 'next/link'
import type { Alert, Patient } from '@/types/patient'

type AlertWithPaciente = Alert & { paciente?: Patient | null }

const SEVERITY_ICON = {
  critico: AlertTriangle,
  atencao: Info,
  info:    CheckCircle,
}

const SEVERITY_BG = {
  critico: 'bg-red-500/[0.08] border-red-500/20',
  atencao: 'bg-amber-500/[0.08] border-amber-500/20',
  info:    'bg-blue-500/[0.08] border-blue-500/20',
}

interface OpcaoAcao {
  valor: string
  label: string
  /** false = etapa intermediária: registra o avanço e mantém o alerta aberto */
  encerra: boolean
}

// Enfermagem — tratou a falta, alerta fecha
const ACOES_ENFERMAGEM: OpcaoAcao[] = [
  { valor: 'reagendado', label: 'Reagendado', encerra: true },
  { valor: 'contatado',  label: 'Contatado',  encerra: true },
  { valor: 'adiado',     label: 'Adiado',     encerra: true },
  { valor: 'desistiu',   label: 'Desistiu',   encerra: true },
  { valor: 'outro',      label: 'Outro',      encerra: true },
]

// Comercial — pipeline de CRM: só ganho/perda encerram
const ETAPAS_COMERCIAL: OpcaoAcao[] = [
  { valor: 'em_contato',         label: 'Em contato',        encerra: false },
  { valor: 'oferta_apresentada', label: 'Apresentou oferta', encerra: false },
  { valor: 'negociando',         label: 'Negociando',        encerra: false },
  { valor: 'ganho',              label: 'Fechou / Renovou',  encerra: true  },
  { valor: 'perdido',            label: 'Não quis',          encerra: true  },
]

function opcoesDaArea(area: string): OpcaoAcao[] {
  return area === 'comercial' ? ETAPAS_COMERCIAL : ACOES_ENFERMAGEM
}

const TODAS_OPCOES = [...ACOES_ENFERMAGEM, ...ETAPAS_COMERCIAL]
const labelDaAcao = (valor?: string | null) =>
  TODAS_OPCOES.find((o) => o.valor === valor)?.label ?? valor ?? ''

type Aba = 'todos' | 'enfermagem' | 'comercial'

const ABAS: { chave: Aba; label: string; icon: React.ElementType }[] = [
  { chave: 'todos',      label: 'Todos',      icon: LayoutList },
  { chave: 'enfermagem', label: 'Enfermagem', icon: Stethoscope },
  { chave: 'comercial',  label: 'Comercial',  icon: TrendingUp },
]

export function AlertasClient({ alertas: alertasInit }: { alertas: AlertWithPaciente[] }) {
  const [alertas, setAlertas] = useState(alertasInit)
  const [aba, setAba] = useState<Aba>('todos')
  const [resolvendo, setResolvendo] = useState<string | null>(null)

  const abertos = useMemo(() => alertas.filter((a) => !a.resolvido), [alertas])
  const resolvidos = useMemo(() => alertas.filter((a) => a.resolvido), [alertas])

  const contagem = useMemo(() => ({
    todos:      abertos.length,
    enfermagem: abertos.filter((a) => a.area === 'enfermagem').length,
    comercial:  abertos.filter((a) => a.area === 'comercial').length,
  }), [abertos])

  const visiveis = aba === 'todos' ? abertos : abertos.filter((a) => a.area === aba)

  async function registrar(id: string, acao: string, justificativa: string) {
    setResolvendo(id)
    try {
      const res = await fetch('/api/alertas/resolver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alerta_id: id, acao, justificativa }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error ?? 'Erro ao registrar')
      // Etapa intermediária do comercial mantém o alerta aberto, só atualiza a etapa
      setAlertas((prev) => prev.map((a) =>
        a.id === id ? { ...a, acao, resolvido: d.encerrado ? true : a.resolvido } : a,
      ))
      toast.success(d.message)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao registrar')
    } finally {
      setResolvendo(null)
    }
  }

  return (
    <>
      <div className="mb-6">
        <p className="text-[11px] font-semibold text-white/30 uppercase tracking-widest mb-1">
          D&apos;Clinique · Operação
        </p>
        <h1 className="font-display text-[32px] text-white leading-tight">Alertas</h1>
        <p className="text-sm text-white/50 mt-1">
          {abertos.length} pendente{abertos.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Abas por área */}
      <div className="flex border-b border-white/[0.07] mb-5">
        {ABAS.map(({ chave, label, icon: Icon }) => (
          <button
            key={chave}
            onClick={() => setAba(chave)}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-all',
              aba === chave
                ? 'border-emerald-500 text-white'
                : 'border-transparent text-white/40 hover:text-white/60',
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
            <span className={cn(
              'inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold',
              aba === chave ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/[0.07] text-white/35',
            )}>
              {contagem[chave]}
            </span>
          </button>
        ))}
      </div>

      {visiveis.length === 0 ? (
        <div className="bg-[#0C1F18] rounded-2xl border border-[#14402C] p-12 text-center">
          <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-3 opacity-50" />
          <p className="text-sm font-medium text-white/50">Nenhum alerta pendente aqui!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visiveis.map((a) => (
            <AlertaCard
              key={a.id}
              alerta={a}
              salvando={resolvendo === a.id}
              onRegistrar={(acao, just) => registrar(a.id, acao, just)}
            />
          ))}
        </div>
      )}

      {/* Resolvidos */}
      {resolvidos.length > 0 && (
        <div className="mt-8">
          <p className="text-xs font-semibold text-white/35 uppercase tracking-wider mb-3">
            Resolvidos ({resolvidos.length})
          </p>
          <div className="space-y-2">
            {resolvidos.slice(0, 10).map((a) => (
              <div key={a.id} className="flex items-center gap-3 px-4 py-2.5 bg-white/[0.04] rounded-xl border border-white/[0.05] opacity-60">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                <span className="text-sm text-white/60 flex-1 truncate">{a.titulo}</span>
                {a.acao && (
                  <span className="text-[10px] text-emerald-400/70 uppercase tracking-wide flex-shrink-0">
                    {labelDaAcao(a.acao)}
                  </span>
                )}
                <span className="text-[11px] text-white/35 flex-shrink-0">{formatRelative(a.criado_em)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}

// ── Card com a caixa de decisão ────────────────────────────────────────────

function AlertaCard({
  alerta: a, salvando, onRegistrar,
}: {
  alerta: AlertWithPaciente
  salvando: boolean
  onRegistrar: (acao: string, justificativa: string) => void
}) {
  const opcoes = opcoesDaArea(a.area)
  const isComercial = a.area === 'comercial'

  const [aberto, setAberto] = useState(false)
  const [acao, setAcao] = useState(a.acao ?? opcoes[0].valor)
  const [justificativa, setJustificativa] = useState('')

  const SevIcon = SEVERITY_ICON[a.severidade]
  const pac = a.paciente
  const opcaoEscolhida = opcoes.find((o) => o.valor === acao)

  return (
    <div className={cn('rounded-xl border', SEVERITY_BG[a.severidade])}>
      <div className="flex items-center gap-4 px-5 py-4">
        <SevIcon className={cn('w-5 h-5 flex-shrink-0',
          a.severidade === 'critico' ? 'text-red-400'
          : a.severidade === 'atencao' ? 'text-amber-400' : 'text-blue-400')} />

        {pac && (
          <Link href={`/pacientes/${pac.id}`} className="flex-shrink-0">
            <PatientAvatar nome={pac.nome} nivel={pac.nivel} size="sm" />
          </Link>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            {pac && (
              <Link href={`/pacientes/${pac.id}`} className="text-sm font-semibold text-white/90 hover:underline">
                {pac.nome}
              </Link>
            )}
            <Badge variant={ALERT_BADGE[a.tipo] ?? 'neutro'} size="sm">
              {ALERT_LABELS[a.tipo] ?? a.tipo}
            </Badge>
            <Badge variant={severityToBadge(a.severidade)} size="sm">{a.severidade}</Badge>
            {/* Etapa atual do pipeline comercial */}
            {isComercial && a.acao && (
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md
                               bg-sky-500/15 text-sky-300 border border-sky-500/25">
                {labelDaAcao(a.acao)}
              </span>
            )}
          </div>
          {a.descricao && <p className="text-xs text-white/60 leading-relaxed">{a.descricao}</p>}
          <p className="text-[11px] text-white/35 mt-1">{formatRelative(a.criado_em)}</p>
        </div>

        <button
          onClick={() => setAberto((v) => !v)}
          className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center border transition-colors flex-shrink-0',
            aberto
              ? 'border-white/[0.15] bg-white/[0.08] text-white/60'
              : 'border-white/[0.1] bg-white/[0.05] text-white/40 hover:bg-emerald-500/15 hover:border-emerald-500/30 hover:text-emerald-400',
          )}
          title={aberto ? 'Cancelar' : 'Resolver'}
        >
          {aberto ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
        </button>
      </div>

      {/* Caixa de decisão */}
      {aberto && (
        <div className="border-t border-white/[0.08] px-5 py-4 space-y-3">
          <div>
            <label className="text-[11px] text-white/40 block mb-1.5">
              {isComercial ? 'Em que etapa está?' : 'O que foi feito?'}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {opcoes.map((op) => (
                <button
                  key={op.valor}
                  onClick={() => setAcao(op.valor)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                    acao === op.valor
                      ? op.encerra
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        : 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                      : 'bg-white/[0.04] text-white/50 border-white/[0.08] hover:bg-white/[0.08]',
                  )}
                >
                  {op.label}
                </button>
              ))}
            </div>
            {isComercial && (
              <p className="text-[11px] text-white/30 mt-1.5">
                {opcaoEscolhida?.encerra
                  ? 'Esta etapa encerra o acompanhamento.'
                  : 'Etapa intermediária — o alerta continua aberto para acompanhar.'}
              </p>
            )}
          </div>

          <div>
            <label className="text-[11px] text-white/40 block mb-1.5">
              Motivo / observação <span className="text-white/25">(opcional)</span>
            </label>
            <textarea
              value={justificativa}
              onChange={(e) => setJustificativa(e.target.value)}
              rows={2}
              placeholder={isComercial
                ? 'Ex.: enviou proposta de renovação 12 sessões, aguardando retorno…'
                : 'Ex.: paciente viajou, remarcou para dia 12…'}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-xs
                         text-white/85 placeholder:text-white/25 focus:border-emerald-500/50 focus:outline-none"
            />
          </div>

          <Button size="sm" variant="success" loading={salvando}
            onClick={() => onRegistrar(acao, justificativa)}>
            {!salvando && <Check className="w-3.5 h-3.5" />}
            {opcaoEscolhida?.encerra ? 'Confirmar e encerrar' : 'Registrar etapa'}
          </Button>
        </div>
      )}
    </div>
  )
}
