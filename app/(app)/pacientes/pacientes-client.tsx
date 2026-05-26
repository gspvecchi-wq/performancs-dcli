'use client'

import { useState, useMemo } from 'react'
import { Search, UserPlus, Filter } from 'lucide-react'
import { PatientRow } from '@/components/pacientes/PatientRow'
import { Button } from '@/components/ui/Button'
import type { Patient } from '@/types/patient'
import { motion } from 'framer-motion'

type FilterType = 'todos' | 'risco' | 'bom' | 'excelente'

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'todos',     label: 'Todos' },
  { key: 'risco',     label: '🔴 Em risco' },
  { key: 'bom',       label: '🟢 Bom' },
  { key: 'excelente', label: '✨ Excelente' },
]

function filterPatients(pacientes: Patient[], search: string, filter: FilterType): Patient[] {
  return pacientes.filter((p) => {
    const matchSearch =
      p.nome.toLowerCase().includes(search.toLowerCase()) ||
      (p.especialidade?.toLowerCase().includes(search.toLowerCase()) ?? false)

    const matchFilter =
      filter === 'todos' ||
      (filter === 'risco'     && p.score < 50) ||
      (filter === 'bom'       && p.score >= 50 && p.score < 75) ||
      (filter === 'excelente' && p.score >= 75)

    return matchSearch && matchFilter
  })
}

export function PatientListClient({ pacientes }: { pacientes: Patient[] }) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterType>('todos')

  const filtered = useMemo(
    () => filterPatients(pacientes, search, filter),
    [pacientes, search, filter]
  )

  return (
    <>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-display text-[28px] text-gray-900 leading-tight">Pacientes</h1>
          <p className="text-sm text-gray-500 mt-1">
            {pacientes.length} paciente{pacientes.length !== 1 ? 's' : ''} na carteira ativa
          </p>
        </div>
        <Button size="sm">
          <UserPlus className="w-3.5 h-3.5" />
          Novo paciente
        </Button>
      </div>

      {/* Barra de busca + filtros */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou especialidade..."
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent
                       bg-white placeholder:text-gray-400 transition-all duration-150"
          />
        </div>
        <div className="flex gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all duration-150
                ${filter === f.key
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-14">
            <Filter className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-400 font-medium">
              {search ? 'Nenhum paciente encontrado para essa busca.' : 'Nenhum paciente nesta categoria.'}
            </p>
          </div>
        ) : (
          <div>
            {/* Header da tabela */}
            <div className="grid grid-cols-[1fr_160px_120px_100px] gap-4 px-5 py-2.5
                            text-[11px] font-semibold text-gray-400 uppercase tracking-wider
                            border-b border-gray-100 bg-gray-50/60">
              <span>Paciente</span>
              <span>Plano</span>
              <span>Engajamento</span>
              <span className="text-right">Score</span>
            </div>
            {filtered.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.25 }}
              >
                <PatientRow patient={p} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
