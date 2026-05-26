'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageSquare, Edit3, User, CheckCircle, Brain,
  Send, XCircle, ListChecks, Loader2, Clock
} from 'lucide-react'
import { Badge, scoreToBadge } from '@/components/ui/Badge'
import { PatientAvatar } from '@/components/pacientes/PatientAvatar'
import { Button } from '@/components/ui/Button'
import { ManipulatedDateAlert } from '@/components/ui/ManipulatedDateAlert'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import Link from 'next/link'
import type { FilaItem, Patient } from '@/types/patient'

type FilaItemWithPaciente = FilaItem & { paciente?: Patient }

interface Props {
  fila: FilaItemWithPaciente[]
  clinicaId: string
  hoje: string
}

export function FilaClient({ fila: filaInicial, clinicaId, hoje }: Props) {
  const [fila, setFila] = useState(filaInicial)
  const supabase = createClient()

  const pendentes = fila.filter((f) => f.status === 'pendente')
  const concluidos = fila.filter((f) => f.status !== 'pendente')

  return (
    <>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-display text-[28px] text-gray-900 leading-tight">Fila do dia</h1>
          <p className="text-sm text-gray-500 mt-1">
            {pendentes.length > 0
              ? `${pendentes.length} paciente${pendentes.length > 1 ? 's' : ''} para acionar hoje · ordenados por prioridade`
              : '🎉 Todos os acionamentos do dia foram realizados!'}
          </p>
        </div>
      </div>

      {pendentes.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3 opacity-60" />
          <p className="text-base font-semibold text-gray-600 mb-1">Fila do dia completa!</p>
          <p className="text-sm text-gray-400">Todos os acionamentos foram realizados.</p>
        </div>
      )}

      <div className="space-y-4">
        {pendentes.map((item, i) => (
          <FilaCard
            key={item.id}
            item={item}
            index={i}
            onUpdate={(updated) =>
              setFila((prev) => prev.map((f) => f.id === updated.id ? updated : f))
            }
          />
        ))}
      </div>

      {/* Concluídos */}
      {concluidos.length > 0 && (
        <div className="mt-8">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Concluídos hoje ({concluidos.length})
          </p>
          <div className="space-y-2">
            {concluidos.map((item) => (
              <div key={item.id} className="flex items-center gap-3 px-4 py-3 bg-white rounded-lg border border-gray-100 opacity-60">
                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span className="text-sm text-gray-600">{item.paciente?.nome}</span>
                <Badge variant="bom" size="sm">concluído</Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}

interface FilaCardProps {
  item: FilaItemWithPaciente
  index: number
  onUpdate: (updated: FilaItemWithPaciente) => void
}

function FilaCard({ item, index, onUpdate }: FilaCardProps) {
  const [msg, setMsg] = useState(item.mensagem_sugerida)
  const [editMode, setEditMode] = useState(false)
  const [resposta, setResposta] = useState('')
  const [respostaMode, setRespostaMode] = useState(false)
  const [iaResult, setIaResult] = useState('')
  const [sendingMsg, setSendingMsg] = useState(false)
  const [analyzingIA, setAnalyzingIA] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const supabase = createClient()
  const p = item.paciente

  const URGENCIA_VARIANT = {
    urgente: 'risco' as const,
    atencao: 'atencao' as const,
    normal:  'bom' as const,
  }
  const urgencia = item.prioridade === 1 ? 'urgente' : item.prioridade <= 2 ? 'atencao' : 'normal'
  const leftBorder = urgencia === 'urgente' ? 'border-l-red-500' : urgencia === 'atencao' ? 'border-l-amber-500' : 'border-l-emerald-500'

  async function handleEnviar() {
    setSendingMsg(true)
    const { data: { user } } = await supabase.auth.getUser()

    // Salva contato
    const { data: contato } = await supabase
      .from('contatos')
      .insert({
        paciente_id:         item.paciente_id,
        clinica_id:          item.clinica_id,
        tipo:                'enviado',
        canal:               'whatsapp',
        mensagem:            msg,
        enviado_por:         user?.id ?? null,
        execucao_id:         null,
        resposta:            null,
        analise_ia:          null,
        status_whatsapp:     null,
        whatsapp_message_id: null,
      })
      .select()
      .single()

    // Atualiza fila
    await supabase
      .from('fila_do_dia')
      .update({ status: 'enviado', enviado_em: new Date().toISOString(), contato_id: contato?.id })
      .eq('id', item.id)

    setSendingMsg(false)
    setEnviado(true)
    setRespostaMode(true)
    toast.success(`Mensagem enviada para ${p?.nome}`)
    onUpdate({ ...item, status: 'enviado' })
  }

  async function handleAnalisarIA() {
    if (!resposta.trim()) { toast.error('Cole a resposta do paciente'); return }
    setAnalyzingIA(true)
    // Mock de IA — substitua por chamada real para /api/ai/analyze
    await new Promise((r) => setTimeout(r, 1200))
    const mocks: Record<string, string> = {
      'baixo':  'Tom de desengajamento. Menciona problemas externos. Há abertura — não é abandono definitivo. Agendar ligação humanizada.',
      'medio':  'Resposta moderada. Ainda buscando resultados. Abordar com dados concretos de evolução.',
      'alto':   'Resposta entusiasmada e proativa. Engajamento alto. Candidato a upsell ou renovação antecipada.',
    }
    const ia = mocks[p?.nivel ?? 'medio']
    setIaResult(ia)
    setAnalyzingIA(false)

    // Atualiza o último contato com a resposta
    if (item.contato_id) {
      await supabase
        .from('contatos')
        .update({ resposta: resposta.trim(), analise_ia: ia })
        .eq('id', item.contato_id)
    }
    toast.success('Resposta analisada pela IA')
  }

  async function handleConcluir() {
    await supabase
      .from('fila_do_dia')
      .update({ status: 'concluido' })
      .eq('id', item.id)
    toast.success('Acionamento concluído')
    onUpdate({ ...item, status: 'concluido' })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      className={`bg-white rounded-xl border border-gray-200 border-l-[4px] shadow-sm overflow-hidden ${leftBorder}`}
    >
      <div className="p-5">
        {/* Header do card */}
        <div className="flex items-start gap-3 mb-3">
          {p && <PatientAvatar nome={p.nome} nivel={p.nivel} size="md" />}
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-gray-900">{p?.nome}</span>
              <Badge variant={URGENCIA_VARIANT[urgencia]} size="sm" dot>{urgencia}</Badge>
              {p && <Badge variant={scoreToBadge(p.score)} size="sm">score {p.score}</Badge>}
            </div>
          </div>
          <Link href={`/pacientes/${item.paciente_id}`}>
            <Button variant="ghost" size="sm"><User className="w-3.5 h-3.5" /></Button>
          </Link>
        </div>

        {/* Motivo */}
        <p className="text-xs text-gray-500 mb-3 leading-relaxed">
          ℹ {item.motivo}
        </p>

        {/* Mensagem */}
        {editMode ? (
          <div className="space-y-2">
            <textarea
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              rows={3}
              className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg resize-none
                         focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={() => { setEditMode(false); handleEnviar() }}>
                <Send className="w-3.5 h-3.5" /> Salvar e enviar
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setEditMode(false)}>Cancelar</Button>
            </div>
          </div>
        ) : (
          <blockquote className="bg-gray-50 border-l-2 border-gray-200 pl-4 pr-4 py-3 text-sm
                                  text-gray-700 italic rounded-r-lg mb-4 leading-relaxed">
            "{msg}"
          </blockquote>
        )}

        {/* Análise da IA */}
        <AnimatePresence>
          {iaResult && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 mb-4"
            >
              <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5" /> Análise da IA
              </p>
              <p className="text-sm text-emerald-800 leading-relaxed">{iaResult}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Campo de resposta */}
        <AnimatePresence>
          {respostaMode && !iaResult && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 space-y-2"
            >
              <textarea
                value={resposta}
                onChange={(e) => setResposta(e.target.value)}
                rows={2}
                placeholder="Cole aqui o que o paciente respondeu para a IA analisar..."
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg resize-none
                           focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleAnalisarIA} disabled={analyzingIA}>
                  {analyzingIA
                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Analisando...</>
                    : <><Brain className="w-3.5 h-3.5" /> Analisar com IA</>}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Ações */}
        {!editMode && (
          <div className="flex gap-2 flex-wrap">
            {!enviado ? (
              <>
                <Button size="sm" onClick={handleEnviar} loading={sendingMsg}>
                  <Send className="w-3.5 h-3.5" /> Enviar
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setEditMode(true)}>
                  <Edit3 className="w-3.5 h-3.5" /> Editar mensagem
                </Button>
              </>
            ) : (
              <>
                {!respostaMode && (
                  <Button variant="secondary" size="sm" onClick={() => setRespostaMode(true)}>
                    <MessageSquare className="w-3.5 h-3.5" /> Registrar resposta
                  </Button>
                )}
                <Button variant="secondary" size="sm" onClick={handleConcluir}>
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Concluir
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}
