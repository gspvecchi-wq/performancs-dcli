'use client'

import { useState, useMemo } from 'react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { format, parseISO, startOfWeek, eachWeekOfInterval, subDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { TrendingDown, TrendingUp, Users, MessageSquare, Scale, Download } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge, levelToBadge } from '@/components/ui/Badge'
import type { Patient, Contact, WeightRecord } from '@/types/patient'

interface Props {
  pacientes: Patient[]
  contatos: Contact[]
  pesos: WeightRecord[]
}

const COLORS = ['#10b981', '#34d399', '#f59e0b', '#ef4444']

export function RelatoriosClient({ pacientes, contatos, pesos }: Props) {
  const [periodo, setPeriodo] = useState<7 | 14 | 30>(30)

  // ── Estatísticas gerais ────────────────────────────────────────────────
  const ativos      = pacientes.filter(p => p.status === 'ativo')
  const emRisco     = ativos.filter(p => p.score < 50)
  const bom         = ativos.filter(p => p.score >= 50 && p.score < 75)
  const excelente   = ativos.filter(p => p.score >= 75)
  const inadimpl    = ativos.filter(p => p.status_pagamento !== 'adimplente')

  // ── Engajamento por nível ──────────────────────────────────────────────
  const pieData = [
    { name: 'Excelente', value: excelente.length, color: '#10b981' },
    { name: 'Bom',       value: bom.length,       color: '#34d399' },
    { name: 'Em risco',  value: emRisco.length,   color: '#ef4444' },
  ]

  // ── Contatos dos últimos N dias ────────────────────────────────────────
  const contatosFiltrados = useMemo(() => {
    const corte = subDays(new Date(), periodo)
    return contatos.filter(c => parseISO(c.criado_em) >= corte)
  }, [contatos, periodo])

  // Agrupar contatos por semana
  const contatosPorSemana = useMemo(() => {
    if (!contatosFiltrados.length) return []
    const inicio = subDays(new Date(), periodo)
    const fim    = new Date()
    const semanas = eachWeekOfInterval({ start: inicio, end: fim }, { locale: ptBR })
    return semanas.map(semana => {
      const fim = new Date(semana.getTime() + 7 * 24 * 60 * 60 * 1000)
      const enviados  = contatosFiltrados.filter(c => c.tipo === 'enviado'    && parseISO(c.criado_em) >= semana && parseISO(c.criado_em) < fim)
      const recebidos = contatosFiltrados.filter(c => c.tipo === 'recebido'   && parseISO(c.criado_em) >= semana && parseISO(c.criado_em) < fim)
      const automat   = contatosFiltrados.filter(c => c.tipo === 'automatico' && parseISO(c.criado_em) >= semana && parseISO(c.criado_em) < fim)
      return {
        semana: format(semana, 'dd/MM', { locale: ptBR }),
        enviados:  enviados.length,
        recebidos: recebidos.length,
        automatico: automat.length,
      }
    })
  }, [contatosFiltrados, periodo])

  // ── Score médio por semana ─────────────────────────────────────────────
  const scoreData = useMemo(() => {
    // Distribuição de scores em buckets de 10
    const buckets: Record<string, number> = {}
    for (let i = 0; i <= 100; i += 10) buckets[`${i}-${i + 9}`] = 0
    ativos.forEach(p => {
      const bucket = Math.floor(p.score / 10) * 10
      const key    = `${bucket}-${bucket + 9}`
      if (key in buckets) buckets[key]++
    })
    return Object.entries(buckets).map(([range, count]) => ({ range, count }))
  }, [ativos])

  // ── Top 5 pacientes mais engajados ─────────────────────────────────────
  const top5 = [...ativos].sort((a, b) => b.score - a.score).slice(0, 5)

  // ── Top 5 pacientes em risco ──────────────────────────────────────────
  const risco5 = [...ativos].sort((a, b) => a.score - b.score).slice(0, 5)

  // ── Resumo de pesagens ─────────────────────────────────────────────────
  const pesosManipulados = pesos.filter(p => !p.data_real_conhecida)
  const mediaPeso = pesos.length
    ? (pesos.reduce((s, p) => s + p.peso_kg, 0) / pesos.length).toFixed(1)
    : '—'

  return (
    <>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-display text-[28px] text-white leading-tight">Relatórios</h1>
          <p className="text-sm text-white/50 mt-1">Análise de engajamento e resultados da clínica</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-white/[0.07] rounded-lg p-1 gap-1">
            {([7, 14, 30] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriodo(p)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  periodo === p ? 'bg-white/[0.12] text-white' : 'text-white/40 hover:text-white/70'
                }`}
              >
                {p}d
              </button>
            ))}
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white/50 border border-white/[0.1] rounded-lg hover:bg-white/[0.07] transition-colors">
            <Download className="w-3.5 h-3.5" />
            Exportar
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Pacientes ativos', value: ativos.length,   icon: Users,          color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
          { label: 'Em risco',         value: emRisco.length,  icon: TrendingDown,   color: 'text-red-400',     bg: 'bg-red-500/15' },
          { label: 'Inadimplentes',    value: inadimpl.length, icon: TrendingUp,     color: 'text-amber-400',   bg: 'bg-amber-500/15' },
          { label: 'Contatos (período)', value: contatosFiltrados.length, icon: MessageSquare, color: 'text-blue-400', bg: 'bg-blue-500/15' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label} className="p-4">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-4.5 h-4.5 ${color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{value}</p>
                <p className="text-xs text-white/40 mt-0.5">{label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Distribuição de engajamento */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Engajamento</CardTitle>
          </CardHeader>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90}
                  dataKey="value" paddingAngle={3}>
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [`${v} pacientes`]} />
                <Legend iconType="circle" iconSize={8} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Histograma de scores */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Scores</CardTitle>
          </CardHeader>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={scoreData} barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="range" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.30)' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.30)' }} />
                <Tooltip contentStyle={{ background: '#0C1F18', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} name="Pacientes" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Contatos por semana */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Contatos por Semana</CardTitle>
          </CardHeader>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={contatosPorSemana} barSize={16} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="semana" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.30)' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.30)' }} />
                <Tooltip contentStyle={{ background: '#0C1F18', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="enviados"   fill="#10b981" radius={[3, 3, 0, 0]} name="Enviados" />
                <Bar dataKey="recebidos"  fill="#34d399" radius={[3, 3, 0, 0]} name="Recebidos" />
                <Bar dataKey="automatico" fill="#6ee7b7" radius={[3, 3, 0, 0]} name="Automático" />
                <Legend iconType="circle" iconSize={8} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Rankings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Top 5 engajados */}
        <Card>
          <CardHeader>
            <CardTitle>🏆 Mais Engajados</CardTitle>
          </CardHeader>
          <div className="divide-y divide-white/[0.04]">
            {top5.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                <span className="w-5 text-xs font-bold text-white/35">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white/90 truncate">{p.nome}</p>
                  <p className="text-xs text-white/35 truncate">{p.especialidade ?? 'Sem especialidade'}</p>
                </div>
                <Badge variant={levelToBadge(p.nivel)} size="sm">{p.score}/100</Badge>
              </div>
            ))}
            {top5.length === 0 && <p className="px-4 py-6 text-sm text-white/35 text-center">Nenhum dado</p>}
          </div>
        </Card>

        {/* Top 5 em risco */}
        <Card>
          <CardHeader>
            <CardTitle>⚠️ Precisam de Atenção</CardTitle>
          </CardHeader>
          <div className="divide-y divide-white/[0.04]">
            {risco5.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                <span className="w-5 text-xs font-bold text-white/35">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white/90 truncate">{p.nome}</p>
                  <p className="text-xs text-white/35 truncate">{p.especialidade ?? 'Sem especialidade'}</p>
                </div>
                <Badge variant="risco" size="sm">{p.score}/100</Badge>
              </div>
            ))}
            {risco5.length === 0 && <p className="px-4 py-6 text-sm text-white/35 text-center">Nenhum risco</p>}
          </div>
        </Card>
      </div>

      {/* Resumo de pesagens */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-white/30" />
            Resumo de Pesagens (últimos {periodo} dias)
          </CardTitle>
        </CardHeader>
        <div className="grid grid-cols-3 divide-x divide-white/[0.05] p-4">
          <div className="pr-4 text-center">
            <p className="text-2xl font-bold text-white">{pesos.length}</p>
            <p className="text-xs text-white/40 mt-0.5">Total de registros</p>
          </div>
          <div className="px-4 text-center">
            <p className="text-2xl font-bold text-white">{mediaPeso}</p>
            <p className="text-xs text-white/40 mt-0.5">Média de peso (kg)</p>
          </div>
          <div className="pl-4 text-center">
            <p className={`text-2xl font-bold ${pesosManipulados.length > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {pesosManipulados.length}
            </p>
            <p className="text-xs text-white/40 mt-0.5">Datas manipuladas</p>
          </div>
        </div>
      </Card>
    </>
  )
}
