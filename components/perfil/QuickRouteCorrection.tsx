'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GitBranch, ChevronDown, Check, X, Loader2, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils/format'
import type { RouteCorrection } from '@/types/patient'

interface QuickRouteCorrectionProps {
  pacienteId: string
  correcoes: RouteCorrection[]
  onAdd?: (nova: RouteCorrection) => void
}

export function QuickRouteCorrection({ pacienteId, correcoes, onAdd }: QuickRouteCorrectionProps) {
  const [open, setOpen] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [desvio, setDesvio] = useState('')
  const [acao, setAcao] = useState('')
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  async function handleSave() {
    if (!desvio.trim() || !acao.trim()) {
      toast.error('Preencha o desvio e a ação corretiva')
      return
    }
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('correcoes_rota')
      .insert({
        paciente_id:     pacienteId,
        registrado_por:  user.id,
        desvio:          desvio.trim(),
        acao_corretiva:  acao.trim(),
      })
      .select()
      .single()

    setSaving(false)
    if (error) {
      toast.error('Erro ao salvar correção')
      return
    }
    toast.success('Correção de rota registrada')
    setDesvio('')
    setAcao('')
    setFormOpen(false)
    if (data && onAdd) onAdd(data as RouteCorrection)
  }

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/30 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-amber-50/60 transition-colors"
      >
        <GitBranch className="w-4 h-4 text-amber-600 flex-shrink-0" />
        <span className="flex-1 text-sm font-semibold text-amber-800">
          Correções de rota
        </span>
        {correcoes.length > 0 && (
          <span className="text-[11px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
            {correcoes.length}
          </span>
        )}
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-4 h-4 text-amber-500" />
        </motion.div>
      </button>

      {/* Conteúdo */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="border-t border-amber-200/60 px-5 py-4 space-y-3">
              {/* Histórico */}
              {correcoes.length === 0 ? (
                <p className="text-sm text-amber-700/50 italic">Nenhuma correção registrada.</p>
              ) : (
                correcoes.map((c) => (
                  <div key={c.id} className="bg-[#0C1F18] rounded-lg border border-amber-100 px-4 py-3">
                    <div className="flex items-start gap-2">
                      <X className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-white/60 mb-0.5">Desvio</p>
                        <p className="text-sm text-white/50">{c.desvio}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 mt-2">
                      <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-white/60 mb-0.5">Ação corretiva</p>
                        <p className="text-sm text-white/50">{c.acao_corretiva}</p>
                      </div>
                    </div>
                    <p className="text-[11px] text-white/30 mt-2">{formatDate(c.criado_em, 'dd MMM yyyy')}</p>
                  </div>
                ))
              )}

              {/* Formulário inline */}
              <AnimatePresence>
                {formOpen ? (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="bg-[#0C1F18] rounded-lg border border-amber-200 p-4 space-y-3"
                  >
                    <div>
                      <label className="text-xs font-semibold text-white/50 mb-1.5 block">
                        O que desviou?
                      </label>
                      <textarea
                        value={desvio}
                        onChange={(e) => setDesvio(e.target.value)}
                        rows={2}
                        placeholder="Descreva o desvio observado no tratamento..."
                        className="w-full px-3 py-2 text-sm border border-white/[0.10] rounded-lg resize-none
                                   focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-white/50 mb-1.5 block">
                        Ação corretiva
                      </label>
                      <textarea
                        value={acao}
                        onChange={(e) => setAcao(e.target.value)}
                        rows={2}
                        placeholder="O que foi feito ou combinado para corrigir..."
                        className="w-full px-3 py-2 text-sm border border-white/[0.10] rounded-lg resize-none
                                   focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 text-white text-xs
                                   font-semibold rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-60"
                      >
                        {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                        Salvar
                      </button>
                      <button
                        onClick={() => { setFormOpen(false); setDesvio(''); setAcao('') }}
                        className="px-3 py-1.5 text-xs text-white/50 border border-white/[0.10] rounded-lg hover:bg-white/[0.03]"
                      >
                        Cancelar
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <button
                    onClick={() => setFormOpen(true)}
                    className="flex items-center gap-2 text-xs text-amber-700 font-semibold
                               hover:text-amber-800 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Registrar correção de rota
                  </button>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
