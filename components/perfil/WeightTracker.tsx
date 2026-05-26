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
      {progress && (
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
      )}

      {/* Alerta de registros com data manipulada */}
      {sorted.some((p) => !p.data_real_conhecida) && (
        <ManipulatedDateAlert />
      )}

      {/* Gráfico */}
      {chartData.length > 1 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
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
        <div className="bg-gray-50 rounded-xl border border-dashed border-gray-200 p-6 text-center">
          <Scale className="w-7 h-7 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-400">Registre 2 ou mais pesagens para ver o gráfico</p>
        </div>
      )}

      {/* Histórico de pesagens */}
      {sorted.length > 0 && (
        <div className="space-y-1.5">
          {[...sorted].reverse().slice(0, 6).map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-3 px-4 py-2.5 bg-white rounded-lg border border-gray-100"
            >
              {!p.data_real_conhecida && (
                <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
              )}
              <span className="text-xs text-gray-500 w-16">{formatDate(p.data_pesagem, 'dd MMM')}</span>
              <span className="text-sm font-semibold text-gray-800">{formatWeight(p.peso_kg)}</span>
              {p.observacao && (
                <span className="text-xs text-gray-400 truncate flex-1">{p.observacao}</span>
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
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Peso (kg)</label>
              <input
                type="number"
                step="0.1"
                value={pesoKg}
                onChange={(e) => setPesoKg(e.target.value)}
                placeholder="ex: 82.5"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg
                           focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Data</label>
              <input
                type="date"
                value={dataPesagem}
                onChange={(e) => setDataPesagem(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg
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
                  className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
                    !dataConhecida ? 'left-4' : 'left-0.5'
                  }`}
                />
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`text-xs font-medium ${!dataConhecida ? 'text-red-700' : 'text-gray-600'}`}>
                Não sei a data real da pesagem
              </span>
              <HelpCircle className="w-3.5 h-3.5 text-gray-400" />
            </div>
          </label>
          {!dataConhecida && (
            <ManipulatedDateAlert dataPesagem={dataPesagem} className="text-xs" />
          )}

          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">
              Observação (opcional)
            </label>
            <input
              type="text"
              value={obs}
              onChange={(e) => setObs(e.target.value)}
              placeholder="ex: Semana com muitas saídas..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg
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
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
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
    <div className="bg-white rounded-lg border border-gray-200 px-4 py-3">
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-xl font-bold ${highlight ? (positive ? 'text-emerald-700' : 'text-red-600') : 'text-gray-800'}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}
