'use client'

import { useState, useMemo } from 'react'
import { Search, UserPlus, Filter, CheckCircle2, Activity, AlertTriangle } from 'lucide-react'
import { PatientRow } from '@/components/pacientes/PatientRow'
import { Button } from '@/components/ui/Button'
import type { PatientWithStats } from './page'
import { motion, AnimatePresence } from 'framer-motion'

// ── Tipos ──────────────────────────────────────────────────────────────────

type TabView    = 'ativos' | 'vencidos' | 'concluidos'
type ScoreFilter = 'todos' | 'risco' | 'bom' | 'excelente'

const SCORE_FILTERS: { key: ScoreFilter; label: string }[] = [
  { key: 'todos',     label: 'Todos' },
  { key: 'risco',     label: '🔴 Em risco' },
  { key: 'bom',       label: '🟢 Bom' },
  { key: 'excelente', label: '✨ Excelente' },
]

function applyFilters(
  pacientes: PatientWithStats[],
  search: string,
  score: ScoreFilter,
): PatientWithStats[] {
  return pacientes.filter((p) => {
    const matchSearch =
      p.nome.toLowerCase().includes(search.toLowerCase()) ||
      (p.especialidade?.toLowerCase().includes(search.toLowerCase()) ?? false)

    const matchScore =
      score === 'todos' ||
      (score === 'risco'     && p.score < 50) ||
      (score === 'bom'       && p.score >= 50 && p.score < 75) ||
      (score === 'excelente' && p.score >= 75)

    return matchSearch && matchScore
  })
}

// ── Componente principal ───────────────────────────────────────────────────

export function PatientListClient({ pacientes }: { pacientes: PatientWithStats[] }) {
  const [tab, setTab]     = useState<TabView>('ativos')
  const [search, setSearch] = useState('')
  const [score, setScore]   = useState<ScoreFilter>('todos')

  // Separação pela situação derivada do plano (ver page.tsx)
  const ativos     = useMemo(() => pacientes.filter((p) => p.situacao === 'em_tratamento'), [pacientes])
  const vencidos   = useMemo(() => pacientes.filter((p) => p.situacao === 'vencido'),       [pacientes])
  const concluidos = useMemo(() => pacientes.filter((p) => p.situacao === 'concluido'),     [pacientes])

  // Lista exibida na tab ativa, com filtros aplicados
  const base     = tab === 'ativos' ? ativos : tab === 'vencidos' ? vencidos : concluidos
  const filtered = useMemo(
    () => applyFilters(base, search, tab === 'ativos' ? score : 'todos'),
    [base, search, score, tab],
  )

  // Reset filtros ao trocar de aba
  function switchTab(next: TabView) {
    setTab(next)
    setSearch('')
    setScore('todos')
  }

  return (
    <>
      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-[11px] font-semibold text-white/30 uppercase tracking-widest mb-1">
            D&apos;Clinique · Carteira
          </p>
          <h1 className="font-display text-[32px] text-white leading-tight">Pacientes</h1>
          <p className="text-sm text-white/50 mt-1">
            {tab === 'ativos'
              ? `${ativos.length} paciente${ativos.length !== 1 ? 's' : ''} em tratamento ativo`
              : tab === 'vencidos'
              ? `${vencidos.length} plano${vencidos.length !== 1 ? 's' : ''} vencido${vencidos.length !== 1 ? 's' : ''} com sessões pendentes`
              : `${concluidos.length} paciente${concluidos.length !== 1 ? 's' : ''} com plano 100% concluído`}
          </p>
        </div>
        <Button size="sm">
          <UserPlus className="w-3.5 h-3.5" />
          Novo paciente
        </Button>
      </div>

      {/* ── Tabs ── */}
      <div className="flex border-b border-white/[0.07] mb-5">
        <TabButton
          active={tab === 'ativos'}
          count={ativos.length}
          icon={Activity}
          label="Em Tratamento"
          onClick={() => switchTab('ativos')}
        />
        <TabButton
          active={tab === 'vencidos'}
          count={vencidos.length}
          icon={AlertTriangle}
          label="Vencidos"
          onClick={() => switchTab('vencidos')}
          dimWhenEmpty
        />
        <TabButton
          active={tab === 'concluidos'}
          count={concluidos.length}
          icon={CheckCircle2}
          label="Concluídos"
          onClick={() => switchTab('concluidos')}
          dimWhenEmpty
        />
      </div>

      {/* ── Busca + filtros de score (só na aba Ativos) ── */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              tab === 'ativos'
                ? 'Buscar por nome ou especialidade...'
                : 'Buscar paciente concluído...'
            }
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-white/[0.1] rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent
                       bg-white/[0.05] placeholder:text-white/25 text-white transition-all duration-150"
          />
        </div>

        {tab === 'ativos' && (
          <div className="flex gap-2">
            {SCORE_FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setScore(f.key)}
                className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all duration-150
                  ${score === f.key
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : 'bg-white/[0.05] text-white/50 border-white/[0.08] hover:bg-white/[0.09]'
                  }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Lista ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2 }}
          className="bg-[#0C1F18] rounded-2xl border border-[#14402C] overflow-hidden"
        >
          {filtered.length === 0 ? (
            <EmptyState tab={tab} search={search} />
          ) : (
            <div>
              {/* Cabeçalho da tabela */}
              <div className="grid grid-cols-[1fr_120px_90px_90px_90px_90px_90px_80px] gap-3 px-5 py-2.5
                              text-[11px] font-semibold text-white/35 uppercase tracking-wider
                              border-b border-[#14402C] bg-white/[0.03]">
                <span>Paciente</span>
                <span>Plano</span>
                <span className="text-center">Sessões</span>
                <span className="text-center">Realizadas</span>
                <span className="text-center">Conclusão</span>
                <span className="text-right">Orçamento</span>
                <span className="text-right">Pago</span>
                <span className="text-right">Score</span>
              </div>

              {filtered.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03, duration: 0.2 }}
                >
                  <PatientRow patient={p} />
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </>
  )
}

// ── Sub-componentes ────────────────────────────────────────────────────────

function TabButton({
  active, count, icon: Icon, label, onClick, dimWhenEmpty = false,
}: {
  active: boolean
  count: number
  icon: React.ElementType
  label: string
  onClick: () => void
  dimWhenEmpty?: boolean
}) {
  const isEmpty = dimWhenEmpty && count === 0

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-all
        ${active
          ? 'border-emerald-500 text-white'
          : 'border-transparent text-white/40 hover:text-white/60'
        }
        ${isEmpty ? 'opacity-50' : ''}
      `}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
      <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold
        ${active
          ? 'bg-emerald-500/20 text-emerald-400'
          : 'bg-white/[0.07] text-white/35'
        }`}
      >
        {count}
      </span>
    </button>
  )
}

function EmptyState({ tab, search }: { tab: TabView; search: string }) {
  if (search) {
    return (
      <div className="text-center py-14">
        <Search className="w-8 h-8 text-white/20 mx-auto mb-3" />
        <p className="text-sm text-white/35 font-medium">
          Nenhum paciente encontrado para &quot;{search}&quot;
        </p>
      </div>
    )
  }

  if (tab === 'vencidos') {
    return (
      <div className="text-center py-14">
        <CheckCircle2 className="w-8 h-8 text-emerald-400/40 mx-auto mb-3" />
        <p className="text-sm text-white/35 font-medium">Nenhum plano vencido com pendências.</p>
        <p className="text-xs text-white/25 mt-1">
          Aqui aparecem os planos que chegaram ao fim com sessões não realizadas.
        </p>
      </div>
    )
  }

  if (tab === 'concluidos') {
    return (
      <div className="text-center py-14">
        <CheckCircle2 className="w-8 h-8 text-white/20 mx-auto mb-3" />
        <p className="text-sm text-white/35 font-medium">Nenhum plano 100% concluído ainda.</p>
        <p className="text-xs text-white/25 mt-1">
          O paciente entra aqui quando realiza todas as sessões previstas.
        </p>
      </div>
    )
  }

  return (
    <div className="text-center py-14">
      <Filter className="w-8 h-8 text-white/20 mx-auto mb-3" />
      <p className="text-sm text-white/35 font-medium">Nenhum paciente nesta categoria.</p>
    </div>
  )
}
