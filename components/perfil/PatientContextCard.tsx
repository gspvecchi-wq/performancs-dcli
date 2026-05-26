'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Heart, FileText, AlertCircle, UserCircle } from 'lucide-react'
import type { Patient } from '@/types/patient'
import { cn } from '@/lib/utils/cn'

interface PatientContextCardProps {
  patient: Patient
}

export function PatientContextCard({ patient: p }: PatientContextCardProps) {
  const [open, setOpen] = useState(false)

  const hasContent = p.motivacao || p.historico_saude || p.alertas_contexto

  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 overflow-hidden">
      {/* Trigger — um clique revela o contexto */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'w-full flex items-center gap-3 px-5 py-4 text-left transition-colors duration-150',
          open ? 'bg-emerald-100/50' : 'hover:bg-emerald-50/70'
        )}
      >
        <UserCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-emerald-800">
            Quem é {p.nome.split(' ')[0]}?
          </p>
          {!open && (
            <p className="text-xs text-emerald-600/70 mt-0.5 truncate">
              {p.motivacao ? p.motivacao.slice(0, 60) + '…' : 'Clique para ver o contexto do paciente'}
            </p>
          )}
        </div>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4 text-emerald-500" />
        </motion.div>
      </button>

      {/* Conteúdo expandido */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-1 space-y-4 border-t border-emerald-200/60">
              {!hasContent && (
                <p className="text-sm text-emerald-700/60 italic">
                  Nenhum contexto cadastrado para este paciente.
                </p>
              )}

              {p.motivacao && (
                <ContextSection
                  icon={Heart}
                  title="Motivação"
                  content={p.motivacao}
                  color="text-rose-600"
                />
              )}

              {p.historico_saude && (
                <ContextSection
                  icon={FileText}
                  title="Histórico de saúde"
                  content={p.historico_saude}
                  color="text-blue-600"
                />
              )}

              {p.alertas_contexto && (
                <ContextSection
                  icon={AlertCircle}
                  title="Alertas e observações"
                  content={p.alertas_contexto}
                  color="text-amber-600"
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ContextSection({
  icon: Icon,
  title,
  content,
  color,
}: {
  icon: React.ElementType
  title: string
  content: string
  color: string
}) {
  return (
    <div>
      <div className={cn('flex items-center gap-1.5 mb-1.5', color)}>
        <Icon className="w-3.5 h-3.5" />
        <span className="text-xs font-semibold uppercase tracking-wide">{title}</span>
      </div>
      <p className="text-sm text-gray-700 leading-relaxed">{content}</p>
    </div>
  )
}
