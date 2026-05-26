'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, CreditCard, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import { Badge, paymentToBadge, scoreToBadge } from '@/components/ui/Badge'
import { PatientAvatar } from '@/components/pacientes/PatientAvatar'
import type { Patient, PaymentStatus } from '@/types/patient'
import Link from 'next/link'
import { formatDate, daysUntil } from '@/lib/utils/format'

const PAYMENT_LABELS: Record<PaymentStatus, string> = {
  adimplente:   'Adimplente',
  inadimplente: 'Inadimplente',
  em_atraso:    'Em atraso',
  desconhecido: 'Não informado',
}

const PAYMENT_ICONS: Record<PaymentStatus, React.ElementType> = {
  adimplente:   CheckCircle,
  inadimplente: AlertTriangle,
  em_atraso:    Clock,
  desconhecido: CreditCard,
}

interface RiskDrawerProps {
  open: boolean
  onClose: () => void
  patients: Patient[]
}

export function RiskDrawer({ open, onClose, patients }: RiskDrawerProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/30 z-40"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-[420px] bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  Pacientes em risco
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {patients.length} paciente{patients.length !== 1 ? 's' : ''} com score abaixo de 50%
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400
                           hover:bg-gray-100 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Lista */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {patients.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <CheckCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">Nenhum paciente em risco</p>
                </div>
              ) : (
                patients.map((p) => {
                  const diasFim = daysUntil(p.plano_fim)
                  const PayIcon = PAYMENT_ICONS[p.status_pagamento]
                  return (
                    <Link
                      key={p.id}
                      href={`/pacientes/${p.id}`}
                      onClick={onClose}
                      className="block p-4 rounded-xl border border-gray-200 hover:border-red-200
                                 hover:bg-red-50/30 transition-all duration-150 group"
                    >
                      <div className="flex items-start gap-3">
                        <PatientAvatar nome={p.nome} nivel={p.nivel} size="md" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-gray-900 group-hover:text-red-700 transition-colors">
                              {p.nome}
                            </span>
                            <Badge variant={scoreToBadge(p.score)} size="sm">
                              score {p.score}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5 truncate">
                            {p.especialidade} · plano até {formatDate(p.plano_fim, 'dd MMM yy')}
                          </p>

                          {/* Pagamento */}
                          <div className="flex items-center gap-1.5 mt-2">
                            <PayIcon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            <Badge variant={paymentToBadge(p.status_pagamento)} size="sm" dot>
                              {PAYMENT_LABELS[p.status_pagamento]}
                            </Badge>
                          </div>

                          {/* Aviso plano vencendo */}
                          {diasFim <= 30 && diasFim >= 0 && (
                            <p className="text-[11px] text-amber-600 font-medium mt-1.5 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Plano vence em {diasFim} dias
                            </p>
                          )}
                          {diasFim < 0 && (
                            <p className="text-[11px] text-red-600 font-medium mt-1.5 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              Plano vencido há {Math.abs(diasFim)} dias
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  )
                })
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
