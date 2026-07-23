'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Scale, TrendingDown, TrendingUp, AlertTriangle, Plus, HelpCircle } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer
} from 'recharts'
import { ManipulatedDateAlert } from '@/components/ui/ManipulatedDateAlert'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { formatDate, formatWeight, formatWeightDiff } from '@/lib/utils/format'
import { calcWeightProgress } from '@/lib/weight/weightStats'
import type { WeightRecord, Patient } from '@/types/patient'

interface WeightTrackerProps {
  patient: Patient
  pesos: WeightRecord[]
  clinicaId: string
  onAdd?: (p: WeightRecord) => void
}

export function WeightTracker({ patient, pesos, clinicaId, onAdd }: WeightTrackerProps) {
  const [formOpen, setFormOpen] = useState(false)
  const [pesoKg, setPesoKg] = useState('')
  const [dataPesagem, setDataPesagem] = useState(new Date().toISOString().split('T')[0])
  const [dataConhecida, setDataConhecida] = useState(true)
  const [obs, setObs] = useState('')
  const [saving, setSaving] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  // ── Definição da meta de peso (não vem na importação) ──
  const [metaOpen, setMetaOpen] = useState(false)
  const [savingMeta, setSavingMeta] = useState(false)
  const [pesoInicialInput, setPesoInicialInput] = useState('')
  const [pesoMetaInput, setPesoMetaInput] = useState('')
  const [objetivoInput, setObjetivoInput] =
    useState<'emagrecimento' | 'massa_muscular'>('emagrecimento')

  function abrirMeta() {
    const maisAntigo = [...pesos].sort(
      (a, b) => new Date(a.data_pesagem).getTime() - new Date(b.data_pesagem).getTime()
    )[0]
    setPesoInicialInput(String(patient.peso_inicial ?? maisAntigo?.peso_kg ?? ''))
    setPesoMetaInput(
      patient.peso_inicial && patient.meta_kg
        ? String(patient.peso_inicial + patient.meta_kg)
        : ''
    )
    setObjetivoInput(
      patient.objetivo === 'massa_muscular' ? 'massa_muscular' : 'emagrecimento'
    )
    setMetaOpen(true)
  }

  /** Ao digitar o peso meta, sugere o objetivo pela direção (menor = emagrecer). */
  function onPesoMetaChange(valor: string) {
    setPesoMetaInput(valor)
    const alvo = parseFloat(valor)
    const inicial = parseFloat(pesoInicialInput)
    if (alvo && inicial && !isNaN(alvo) && !isNaN(inicial) && alvo !== inicial) {
      setObjetivoInput(alvo > inicial ? 'massa_muscular' : 'emagrecimento')
    }
  }

  async function salvarMeta() {
    const inicial = parseFloat(pesoInicialInput)
    const alvo    = parseFloat(pesoMetaInput)
    if (!inicial || isNaN(inicial) || !alvo || isNaN(alvo)) {
      toast.error('Informe o peso inicial e o peso meta')
      return
    }
    setSavingMeta(true)
    // meta_kg é a variação desejada (negativa = perda, positiva = ganho)
    const { error } = await supabase
      .from('pacientes')
      .update({
        peso_inicial: inicial,
        meta_kg: alvo - inicial,
        objetivo: objetivoInput,
      })
      .eq('id', patient.id)
    setSavingMeta(false)
    if (error) {
      toast.error('Não foi possível salvar a meta')
      return
    }
    toast.success('Meta definida')
    setMetaOpen(false)
    router.refresh()
  }

  const sorted = [...pesos].sort(
    (a, b) => new Date(a.data_pesagem).getTime() - new Date(b.data_pesagem).getTime()
  )

  const progress = patient.peso_inicial && patient.meta_kg
    ? calcWeightProgress(pesos, patient.meta_kg, patient.objetivo, patient.peso_inicial)
    : null

  // Dados para gráfico
  const chartData = sorted.map((p) => ({
    data:   formatDate(p.data_pesagem, 'dd/MM'),
    peso:   p.peso_kg,
    manipulado: !p.data_real_conhecida,
  }))

  // Meta semanal esperada (4-5 kg/mês → ~0.92-1.15 kg/semana)
  const metaFim = patient.peso_inicial && patient.meta_kg
    ? patient.peso_inicial + patient.meta_kg
    : null

  async function handleSave() {
    const kg = parseFloat(pesoKg)
    if (!kg || isNaN(kg) || kg < 20 || kg > 400) {
      toast.error('Peso inválido (deve ser entre 20 e 400 kg)')
      return
    }
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('pesos')
      .insert({
        paciente_id:          patient.id,
        clinica_id:           clinicaId,
        peso_kg:              kg,
        data_pesagem:         dataPesagem,
        data_real_conhecida:  dataConhecida,
        observacao:           obs.trim() || null,
        registrado_por:       user?.id ?? null,
      })
      .select()
      .single()

    setSaving(false)
    if (error) {
      if (error.code === '23505') toast.error('Já existe um registro para esta data')
      else toast.error('Erro ao salvar peso')
      return
    }
    toast.success(!dataConhecida ? '⚠️ Peso salvo — alerta de data manipulada gerado' : 'Peso registrado com sucesso')
    setPesoKg('')
    setObs('')
    setDataConhecida(true)
    setFormOpen(false)
    if (data && onAdd) onAdd(data as WeightRecord)
  }

  return (
    <div className="space-y-4">
      {/* Cards de progresso */}
      {progress ? (
        <div>
          <div className="grid grid-cols-3 gap-3">
            <ProgressStat
              label="Peso atual"
              value={formatWeight(progress.pesoAtual)}
              sub={`inicial: ${formatWeight(progress.pesoInicial)}`}
            />
            <ProgressStat
              label="Variação total"
              value={formatWeightDiff(progress.variacao)}
              sub={`meta: ${formatWeight(progress.metaKg)}`}
              highlight={progress.variacao !== 0}
              positive={patient.objetivo === 'emagrecimento' ? progress.variacao < 0 : progress.variacao > 0}
            />
            <ProgressStat
              label="Meta atingida"
              value={`${Math.round(progress.percentualMeta)}%`}
              sub={progress.dentroMeta ? 'dentro da meta' : 'fora da meta'}
              highlight
              positive={progress.dentroMeta}
            />
          </div>
          {!metaOpen && (
            <button
              onClick={abrirMeta}
              className="text-[11px] text-white/35 hover:text-emerald-400 transition-colors mt-2"
            >
              ajustar meta
            </button>
          )}
        </div>
      ) : !metaOpen && (
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
          <p className="text-sm text-white/70 font-medium">Meta de peso não definida</p>
          <p className="text-xs text-white/40 mt-1 mb-3">
            A importação não traz meta de peso — defina aqui para acompanhar o progresso.
          </p>
          <Button size="sm" onClick={abrirMeta}>Definir meta</Button>
        </div>
      )}

      {/* Formulário da meta */}
      {metaOpen && (
        <div className="rounded-xl border border-emerald-500/25 bg-white/[0.02] p-4 space-y-3">
          <div className="flex gap-4 flex-wrap">
            <label className="text-[11px] text-white/40">
              <div className="mb-1">Peso inicial (kg)</div>
              <input
                type="number" step="0.1" min={20} max={400}
                value={pesoInicialInput}
                onChange={(e) => setPesoInicialInput(e.target.value)}
                className="w-28 bg-white/[0.04] border border-white/[0.08] rounded px-2 py-1.5 text-sm text-white/85 focus:border-emerald-500/50 focus:outline-none"
              />
            </label>
            <label className="text-[11px] text-white/40">
              <div className="mb-1">Peso meta (kg)</div>
              <input
                type="number" step="0.1" min={20} max={400}
                value={pesoMetaInput}
                onChange={(e) => onPesoMetaChange(e.target.value)}
                className="w-28 bg-white/[0.04] border border-white/[0.08] rounded px-2 py-1.5 text-sm text-white/85 focus:border-emerald-500/50 focus:outline-none"
              />
            </label>
            <label className="text-[11px] text-white/40">
              <div className="mb-1">Objetivo</div>
              <select
                value={objetivoInput}
                onChange={(e) => setObjetivoInput(e.target.value as 'emagrecimento' | 'massa_muscular')}
                className="bg-white/[0.04] border border-white/[0.08] rounded px-2 py-1.5 text-sm text-white/85 focus:border-emerald-500/50 focus:outline-none"
              >
                <option value="emagrecimento" className="bg-[#0C1F18] text-white">↓ Emagrecimento</option>
                <option value="massa_muscular" className="bg-[#0C1F18] text-white">↑ Hipertrofia</option>
              </select>
            </label>
          </div>
          <p className="text-[11px] text-white/35">
            {objetivoInput === 'massa_muscular'
              ? 'O progresso conta o peso ganho até a meta.'
              : 'O progresso conta o peso perdido até a meta.'}
          </p>
          <div className="flex gap-2">
            <Button size="sm" variant="success" onClick={salvarMeta} loading={savingMeta}>
              Salvar meta
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setMetaOpen(false)} disabled={savingMeta}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Alerta de registros com data manipulada */}
      {sorted.some((p) => !p.data_real_conhecida) && (
        <ManipulatedDateAlert />
      )}

      {/* Gráfico */}
      {chartData.length > 1 ? (
        <div className="bg-[#0C1F18] rounded-xl border border-white/[0.07] p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">
              Evolução de peso
            </p>
            {metaFim && (
              <span className="text-xs text-emerald-600 font-medium">
                Meta: {formatWeight(metaFim)}
              </span>
            )}
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="data" tick={{ fontSize: 10 }} />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              {metaFim && (
                <ReferenceLine
                  y={metaFim}
                  stroke="#059669"
                  strokeDasharray="4 4"
                  label={{ value: 'Meta', position: 'right', fontSize: 10, fill: '#059669' }}
                />
              )}
              <Line
                type="monotone"
                dataKey="peso"
                stroke="#16a34a"
                strokeWidth={2}
                dot={{ r: 3, fill: '#16a34a' }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="bg-white/[0.03] rounded-xl border border-dashed border-white/[0.07] p-6 text-center">
          <Scale className="w-7 h-7 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-white/30">Registre 2 ou mais pesagens para ver o gráfico</p>
        </div>
      )}

      {/* Histórico de pesagens */}
      {sorted.length > 0 && (
        <div className="space-y-1.5">
          {[...sorted].reverse().slice(0, 6).map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-3 px-4 py-2.5 bg-[#0C1F18] rounded-lg border border-gray-100"
            >
              {!p.data_real_conhecida && (
                <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
              )}
              <span className="text-xs text-white/40 w-16">{formatDate(p.data_pesagem, 'dd MMM')}</span>
              <span className="text-sm font-semibold text-white/80">{formatWeight(p.peso_kg)}</span>
              {p.observacao && (
                <span className="text-xs text-white/30 truncate flex-1">{p.observacao}</span>
              )}
              {!p.data_real_conhecida && (
                <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-medium">
                  data incerta
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Formulário de registro */}
      {!formOpen ? (
        <button
          onClick={() => setFormOpen(true)}
          className="flex items-center gap-2 text-sm text-emerald-700 font-semibold hover:text-emerald-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Registrar pesagem
        </button>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-50/40 rounded-xl border border-emerald-200 p-4 space-y-3"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-white/50 mb-1 block">Peso (kg)</label>
              <input
                type="number"
                step="0.1"
                value={pesoKg}
                onChange={(e) => setPesoKg(e.target.value)}
                placeholder="ex: 82.5"
                className="w-full px-3 py-2 text-sm border border-white/[0.10] rounded-lg
                           focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-white/50 mb-1 block">Data</label>
              <input
                type="date"
                value={dataPesagem}
                onChange={(e) => setDataPesagem(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-white/[0.10] rounded-lg
                           focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Toggle "Data manipulada" */}
          <label className="flex items-center gap-2.5 cursor-pointer group">
            <div className="relative">
              <input
                type="checkbox"
                checked={!dataConhecida}
                onChange={(e) => setDataConhecida(!e.target.checked)}
                className="sr-only"
              />
              <div
                className={`w-9 h-5 rounded-full transition-colors duration-200 ${
                  !dataConhecida ? 'bg-red-500' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`absolute top-0.5 w-4 h-4 bg-[#0C1F18] rounded-full shadow transition-transform duration-200 ${
                    !dataConhecida ? 'left-4' : 'left-0.5'
                  }`}
                />
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`text-xs font-medium ${!dataConhecida ? 'text-red-700' : 'text-white/50'}`}>
                Não sei a data real da pesagem
              </span>
              <HelpCircle className="w-3.5 h-3.5 text-white/30" />
            </div>
          </label>
          {!dataConhecida && (
            <ManipulatedDateAlert dataPesagem={dataPesagem} className="text-xs" />
          )}

          <div>
            <label className="text-xs font-semibold text-white/50 mb-1 block">
              Observação (opcional)
            </label>
            <input
              type="text"
              value={obs}
              onChange={(e) => setObs(e.target.value)}
              placeholder="ex: Semana com muitas saídas..."
              className="w-full px-3 py-2 text-sm border border-white/[0.10] rounded-lg
                         focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg
                         hover:bg-emerald-700 transition-colors disabled:opacity-60 flex items-center gap-1.5"
            >
              {saving ? 'Salvando...' : 'Salvar pesagem'}
            </button>
            <button
              onClick={() => setFormOpen(false)}
              className="px-4 py-2 text-sm text-white/50 border border-white/[0.10] rounded-lg hover:bg-white/[0.03]"
            >
              Cancelar
            </button>
          </div>
        </motion.div>
      )}
    </div>
  )
}

function ProgressStat({
  label, value, sub, highlight, positive
}: {
  label: string; value: string; sub?: string; highlight?: boolean; positive?: boolean
}) {
  return (
    <div className="bg-[#0C1F18] rounded-lg border border-white/[0.07] px-4 py-3">
      <p className="text-[11px] font-semibold text-white/30 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-xl font-bold ${highlight ? (positive ? 'text-emerald-700' : 'text-red-600') : 'text-white/80'}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-white/30 mt-0.5">{sub}</p>}
    </div>
  )
}
