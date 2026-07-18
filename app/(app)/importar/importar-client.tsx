'use client'

import { useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import {
  Upload, FileText, FileSpreadsheet, CalendarDays,
  CheckCircle2, AlertTriangle, ChevronDown, ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils/cn'

// ─── Tipos do preview (espelham /api/plano/preview, sem puxar os parsers) ──────

interface ItemPreview {
  procedimento: string
  categoria: string
  qtd_prevista: number
  qtd_realizada: number
  qtd_restante: number
  status: string
  frequencia_dias: number | null
  fontes: string[]
}

interface PacientePreview {
  nome: string
  prontuario: string | null
  cpf: string | null
  telefone: string | null
  plano_inicio: string | null
  plano_fim: string | null
  itens: ItemPreview[]
  agendamentos: { truncado?: boolean }[]
  _avisos: string[]
  incluir: boolean          // controle local de seleção
  aberto: boolean           // controle local de expandir
}

interface PreviewResponse {
  pacientes: Omit<PacientePreview, 'incluir' | 'aberto'>[]
  resumo: {
    pacientes: number
    com_plano: number
    itens_rastreaveis: number
    agendamentos: number
    truncados: number
  }
  avisos: string[]
}

// ─── Componente ────────────────────────────────────────────────────────────────

export function ImportarClient() {
  const [planos, setPlanos] = useState<File[]>([])
  const [frequencia, setFrequencia] = useState<File | null>(null)
  const [agendamentos, setAgendamentos] = useState<File[]>([])

  const [loading, setLoading] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [pacientes, setPacientes] = useState<PacientePreview[]>([])
  const [resumo, setResumo] = useState<PreviewResponse['resumo'] | null>(null)
  const [avisos, setAvisos] = useState<string[]>([])

  const temArquivo = planos.length > 0 || !!frequencia || agendamentos.length > 0

  // Só mostramos pacientes com itens de plano (a visão feito × falta é o foco)
  const pacientesComPlano = useMemo(
    () => pacientes.filter((p) => p.itens.length > 0),
    [pacientes],
  )
  const selecionados = pacientesComPlano.filter((p) => p.incluir).length

  async function processar() {
    if (!temArquivo) return
    setLoading(true)
    try {
      const form = new FormData()
      planos.forEach((f) => form.append('planos', f))
      if (frequencia) form.append('frequencia', frequencia)
      agendamentos.forEach((f) => form.append('agendamentos', f))

      const res = await fetch('/api/plano/preview', { method: 'POST', body: form })
      const raw = await res.text()
      let data: (PreviewResponse & { error?: string }) | null = null
      try { data = JSON.parse(raw) } catch { /* resposta não-JSON (ex.: HTML de erro/timeout) */ }
      if (!res.ok || !data) {
        throw new Error(data?.error ?? `Erro ${res.status} do servidor: ${raw.slice(0, 140)}`)
      }

      const nComPlano = data.pacientes.filter((p) => p.itens.length > 0).length
      setPacientes(
        // abre já expandido quando são poucos pacientes (facilita a edição)
        data.pacientes.map((p) => ({
          ...p,
          incluir: p.itens.length > 0,
          aberto: p.itens.length > 0 && nComPlano <= 3,
        })),
      )
      setResumo(data.resumo)
      setAvisos(data.avisos ?? [])
      toast.success(`${data.resumo.itens_rastreaveis} itens de plano em ${data.resumo.com_plano || data.pacientes.length} paciente(s)`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  async function confirmar() {
    const paraImportar = pacientesComPlano.filter((p) => p.incluir)
    if (paraImportar.length === 0) {
      toast.error('Nenhum paciente selecionado')
      return
    }
    setConfirming(true)
    try {
      const res = await fetch('/api/plano/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pacientes: paraImportar }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erro ao gravar')
      toast.success(data.message ?? 'Importação concluída')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao gravar')
    } finally {
      setConfirming(false)
    }
  }

  // helpers de edição
  function patchPaciente(idx: number, patch: Partial<PacientePreview>) {
    setPacientes((prev) => {
      const nome = pacientesComPlano[idx].nome
      return prev.map((p) => (p.nome === nome ? { ...p, ...patch } : p))
    })
  }
  function patchItem(pacIdx: number, itemIdx: number, patch: Partial<ItemPreview>) {
    setPacientes((prev) => {
      const nome = pacientesComPlano[pacIdx].nome
      return prev.map((p) => {
        if (p.nome !== nome) return p
        const itens = p.itens.map((it, i) => {
          if (i !== itemIdx) return it
          const merged = { ...it, ...patch }
          merged.qtd_restante = Math.max(merged.qtd_prevista - merged.qtd_realizada, 0)
          return merged
        })
        return { ...p, itens }
      })
    })
  }

  return (
    <div className="max-w-5xl mx-auto px-8 py-8">
      <header className="mb-6">
        <h1 className="font-serif text-2xl text-white/90 flex items-center gap-2">
          <Upload className="w-5 h-5 text-emerald-400" /> Importar plano de acompanhamento
        </h1>
        <p className="text-sm text-white/40 mt-1">
          Suba os arquivos, confira e edite os dados, e confirme para gravar.
        </p>
      </header>

      {/* Uploads */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <FilePicker
          icon={FileText} label="Planos (PDF)" hint="1 por paciente" accept=".pdf" multiple
          files={planos} onChange={setPlanos}
        />
        <FilePicker
          icon={FileSpreadsheet} label="Frequência (Excel)" hint="feito × falta" accept=".xlsx,.xls"
          files={frequencia ? [frequencia] : []} onChange={(fs) => setFrequencia(fs[0] ?? null)}
        />
        <FilePicker
          icon={CalendarDays} label="Agendamentos" hint="Excel ou PDF" accept=".xlsx,.xls,.pdf" multiple
          files={agendamentos} onChange={setAgendamentos}
        />
      </div>

      <div className="flex items-center gap-3 mb-8">
        <Button onClick={processar} loading={loading} disabled={!temArquivo}>
          {!loading && <Upload className="w-3.5 h-3.5" />} Processar arquivos
        </Button>
        {resumo && (
          <span className="text-xs text-white/40">
            {resumo.pacientes} pacientes lidos · {resumo.agendamentos} agendamentos
            {resumo.truncados > 0 && ` · ${resumo.truncados} truncados`}
          </span>
        )}
      </div>

      {/* Avisos globais */}
      {avisos.length > 0 && (
        <div className="mb-6 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] p-4">
          <div className="flex items-center gap-2 text-amber-300 text-xs font-semibold mb-2">
            <AlertTriangle className="w-4 h-4" /> Avisos ({avisos.length})
          </div>
          <ul className="text-xs text-amber-200/70 space-y-1 list-disc list-inside">
            {avisos.slice(0, 8).map((a, i) => <li key={i}>{a}</li>)}
          </ul>
        </div>
      )}

      {/* Resultado */}
      {pacientesComPlano.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-white/70">
              {pacientesComPlano.length} paciente(s) com plano · {selecionados} selecionado(s)
            </h2>
            <Button variant="success" onClick={confirmar} loading={confirming} disabled={selecionados === 0}>
              {!confirming && <CheckCircle2 className="w-3.5 h-3.5" />} Confirmar importação
            </Button>
          </div>

          <div className="space-y-2">
            {pacientesComPlano.map((p, idx) => (
              <PacienteCard
                key={p.nome}
                p={p}
                onToggleIncluir={() => patchPaciente(idx, { incluir: !p.incluir })}
                onToggleAberto={() => patchPaciente(idx, { aberto: !p.aberto })}
                onPatchPaciente={(patch) => patchPaciente(idx, patch)}
                onPatchItem={(itemIdx, patch) => patchItem(idx, itemIdx, patch)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ─── File picker ────────────────────────────────────────────────────────────────

function FilePicker({
  icon: Icon, label, hint, accept, multiple, files, onChange,
}: {
  icon: React.ElementType; label: string; hint: string; accept: string
  multiple?: boolean; files: File[]; onChange: (files: File[]) => void
}) {
  const ref = useRef<HTMLInputElement>(null)
  return (
    <div
      onClick={() => ref.current?.click()}
      className="rounded-xl border border-dashed border-white/[0.12] bg-[#0F1C18] p-4 cursor-pointer hover:border-emerald-500/40 hover:bg-[#132219] transition-colors"
    >
      <input
        ref={ref} type="file" accept={accept} multiple={multiple} className="hidden"
        onChange={(e) => onChange(Array.from(e.target.files ?? []))}
      />
      <div className="flex items-center gap-2 text-white/70 text-sm font-medium">
        <Icon className="w-4 h-4 text-emerald-400" /> {label}
      </div>
      <div className="text-[11px] text-white/30 mt-0.5">{hint}</div>
      {files.length > 0 && (
        <div className="mt-2 space-y-1">
          {files.map((f, i) => (
            <div key={i} className="text-[11px] text-emerald-300/80 truncate flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 flex-shrink-0" /> {f.name}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Card de paciente ───────────────────────────────────────────────────────────

function PacienteCard({
  p, onToggleIncluir, onToggleAberto, onPatchPaciente, onPatchItem,
}: {
  p: PacientePreview
  onToggleIncluir: () => void
  onToggleAberto: () => void
  onPatchPaciente: (patch: Partial<PacientePreview>) => void
  onPatchItem: (itemIdx: number, patch: Partial<ItemPreview>) => void
}) {
  const totalPrev = p.itens.reduce((n, it) => n + it.qtd_prevista, 0)
  const totalFeito = p.itens.reduce((n, it) => n + it.qtd_realizada, 0)
  const truncados = p.agendamentos.filter((a) => a.truncado).length

  return (
    <div className={cn(
      'rounded-xl border bg-[#0F1C18] overflow-hidden transition-colors',
      p.incluir ? 'border-emerald-500/25' : 'border-white/[0.06] opacity-60',
    )}>
      {/* Header */}
      <div className="flex items-center gap-3 p-3">
        <input
          type="checkbox" checked={p.incluir} onChange={onToggleIncluir}
          className="w-4 h-4 accent-emerald-500 flex-shrink-0"
        />
        <button onClick={onToggleAberto} className="text-white/30 hover:text-white/60 flex-shrink-0">
          {p.aberto ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
        <div onClick={onToggleAberto} className="flex-1 min-w-0 cursor-pointer">
          <div className="text-sm text-white/85 font-medium truncate">{p.nome}</div>
          <div className="text-[11px] text-white/35">
            {p.prontuario ? `Prontuário ${p.prontuario}` : 'sem prontuário'}
            {p.plano_inicio && ` · início ${fmt(p.plano_inicio)}`}
            {p.plano_fim && ` → fim ${fmt(p.plano_fim)}`}
            {!p.aberto && <span className="text-emerald-400/60"> · clique para editar</span>}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-sm text-emerald-300 font-semibold">{totalFeito}/{totalPrev}</div>
          <div className="text-[10px] text-white/30 uppercase tracking-wide">feito/prev</div>
        </div>
      </div>

      {/* Corpo expandido */}
      {p.aberto && (
        <div className="border-t border-white/[0.06] p-3 space-y-3">
          {/* Datas do plano editáveis */}
          <div className="flex flex-wrap gap-4">
            <LabeledDate label="Início do plano" value={p.plano_inicio} onChange={(v) => onPatchPaciente({ plano_inicio: v })} />
            <LabeledDate label="Fim do plano" value={p.plano_fim} onChange={(v) => onPatchPaciente({ plano_fim: v })} />
          </div>

          {/* Itens — nome e frequência editáveis */}
          <div className="rounded-lg border border-white/[0.06] divide-y divide-white/[0.04]">
            {p.itens.map((it, i) => (
              <div key={i} className="p-2.5 space-y-2">
                {/* Nome do procedimento (editável) */}
                <div className="flex items-center gap-2">
                  <input
                    type="text" value={it.procedimento}
                    onChange={(e) => onPatchItem(i, { procedimento: e.target.value })}
                    className="flex-1 min-w-0 text-xs bg-white/[0.04] border border-white/[0.08] rounded px-2 py-1 text-white/80 focus:border-emerald-500/50 focus:outline-none"
                  />
                  <span className="text-[9px] text-white/25 flex-shrink-0">{it.fontes.includes('pdf_plano') ? 'PDF' : 'XLS'}</span>
                </div>
                {/* Frequência + quantidades */}
                <div className="flex items-center gap-2 flex-wrap">
                  <FreqSelect value={it.frequencia_dias} onChange={(v) => onPatchItem(i, { frequencia_dias: v })} />
                  <LabeledNum label="Prev." value={it.qtd_prevista} onChange={(v) => onPatchItem(i, { qtd_prevista: v })} />
                  <LabeledNum label="Feito" value={it.qtd_realizada} onChange={(v) => onPatchItem(i, { qtd_realizada: v })} />
                  <div className="text-[11px] ml-auto">
                    <span className="text-white/35">Falta </span>
                    <span className={cn('font-semibold', it.qtd_restante > 0 ? 'text-amber-300' : 'text-emerald-400')}>{it.qtd_restante}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-[11px] text-white/35">
            {p.agendamentos.length} agendamento(s)
            {truncados > 0 && <span className="text-amber-300/80"> · {truncados} com procedimentos truncados (confira)</span>}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Sub-componentes de input ────────────────────────────────────────────────────

const FREQ_OPTS: { dias: number; label: string }[] = [
  { dias: 7, label: 'Semanal' },
  { dias: 14, label: 'Quinzenal' },
  { dias: 30, label: 'Mensal' },
  { dias: 0, label: 'Dose única' },
]

function FreqSelect({ value, onChange }: { value: number | null; onChange: (v: number) => void }) {
  return (
    <select
      value={value ?? 7}
      onChange={(e) => onChange(parseInt(e.target.value))}
      className="text-xs bg-white/[0.04] border border-white/[0.08] rounded px-2 py-1 text-white/80 focus:border-emerald-500/50 focus:outline-none"
    >
      {FREQ_OPTS.map((o) => <option key={o.dias} value={o.dias}>{o.label}</option>)}
    </select>
  )
}

function LabeledNum({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="flex items-center gap-1 text-[11px] text-white/40">
      {label}
      <input
        type="number" min={0} value={value}
        onChange={(e) => onChange(Math.max(0, parseInt(e.target.value) || 0))}
        className="w-14 text-center text-xs bg-white/[0.04] border border-white/[0.08] rounded px-1 py-1 text-white/80 focus:border-emerald-500/50 focus:outline-none"
      />
    </label>
  )
}

function LabeledDate({ label, value, onChange }: { label: string; value: string | null; onChange: (v: string) => void }) {
  return (
    <label className="text-[11px] text-white/40">
      <div className="mb-1">{label}</div>
      <input
        type="date" value={value ?? ''} onChange={(e) => onChange(e.target.value)}
        className="bg-white/[0.04] border border-white/[0.08] rounded px-2 py-1 text-xs text-white/80 focus:border-emerald-500/50 focus:outline-none"
      />
    </label>
  )
}

function fmt(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}
