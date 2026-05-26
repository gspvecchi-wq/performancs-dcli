'use client'

import { useState } from 'react'
import { AlertTriangle, CheckCircle, Info, Check } from 'lucide-react'
import { Badge, ALERT_LABELS, ALERT_BADGE, severityToBadge } from '@/components/ui/Badge'
import { PatientAvatar } from '@/components/pacientes/PatientAvatar'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { formatRelative } from '@/lib/utils/format'
import Link from 'next/link'
import type { Alert, Patient } from '@/types/patient'

type AlertWithPaciente = Alert & { paciente?: Patient | null }

const SEVERITY_ICON = {
  critico: AlertTriangle,
  atencao: Info,
  info:    CheckCircle,
}

const SEVERITY_BG = {
  critico: 'bg-red-50 border-red-200',
  atencao: 'bg-amber-50 border-amber-200',
  info:    'bg-blue-50 border-blue-200',
}

export function AlertasClient({ alertas: alertasInit }: { alertas: AlertWithPaciente[] }) {
  const [alertas, setAlertas] = useState(alertasInit)
  const supabase = createClient()
  const abertos  = alertas.filter((a) => !a.resolvido)
  const resolvidos = alertas.filter((a) => a.resolvido)

  async function handleResolver(id: string) {
    const { data: { user } } = await supabase.auth.getUser()
    await supabase
      .from('alertas')
      .update({ resolvido: true, resolvido_por: user?.id, resolvido_em: new Date().toISOString() })
      .eq('id', id)
    setAlertas((prev) =>
      prev.map((a) => a.id === id ? { ...a, resolvido: true } : a)
    )
    toast.success('Alerta resolvido')
  }

  return (
    <>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-display text-[28px] text-gray-900 leading-tight">Alertas</h1>
          <p className="text-sm text-gray-500 mt-1">
            {abertos.length} alerta{abertos.length !== 1 ? 's' : ''} pendente{abertos.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Abertos */}
      {abertos.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
          <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-3 opacity-50" />
          <p className="text-sm font-medium text-gray-500">Nenhum alerta pendente!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {abertos.map((a) => {
            const SevIcon = SEVERITY_ICON[a.severidade]
            const pac = a.paciente
            return (
              <div
                key={a.id}
                className={`flex items-center gap-4 px-5 py-4 rounded-xl border shadow-sm ${SEVERITY_BG[a.severidade]}`}
              >
                <SevIcon className={`w-5 h-5 flex-shrink-0 ${
                  a.severidade === 'critico' ? 'text-red-500' :
                  a.severidade === 'atencao' ? 'text-amber-500' : 'text-blue-500'
                }`} />

                {pac && (
                  <Link href={`/pacientes/${pac.id}`} className="flex-shrink-0">
                    <PatientAvatar nome={pac.nome} nivel={pac.nivel} size="sm" />
                  </Link>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    {pac && (
                      <Link
                        href={`/pacientes/${pac.id}`}
                        className="text-sm font-semibold text-gray-900 hover:underline"
                      >
                        {pac.nome}
                      </Link>
                    )}
                    <Badge variant={ALERT_BADGE[a.tipo]} size="sm">
                      {ALERT_LABELS[a.tipo]}
                    </Badge>
                    <Badge variant={severityToBadge(a.severidade)} size="sm">
                      {a.severidade}
                    </Badge>
                  </div>
                  {a.descricao && (
                    <p className="text-xs text-gray-600 leading-relaxed">{a.descricao}</p>
                  )}
                  <p className="text-[11px] text-gray-400 mt-1">{formatRelative(a.criado_em)}</p>
                </div>

                <button
                  onClick={() => handleResolver(a.id)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-300
                             bg-white text-gray-500 hover:bg-emerald-50 hover:border-emerald-300
                             hover:text-emerald-700 transition-colors flex-shrink-0"
                  title="Marcar como resolvido"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Resolvidos */}
      {resolvidos.length > 0 && (
        <div className="mt-8">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Resolvidos ({resolvidos.length})
          </p>
          <div className="space-y-2">
            {resolvidos.slice(0, 10).map((a) => (
              <div key={a.id} className="flex items-center gap-3 px-4 py-2.5 bg-white rounded-lg border border-gray-100 opacity-60">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                <span className="text-sm text-gray-600 flex-1 truncate">{a.titulo}</span>
                <span className="text-[11px] text-gray-400">{formatRelative(a.criado_em)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
