'use client'

import { AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface ManipulatedDateAlertProps {
  dataPesagem?: string
  className?: string
}

export function ManipulatedDateAlert({ dataPesagem, className }: ManipulatedDateAlertProps) {
  return (
    <div
      className={cn(
        'flex items-start gap-2.5 p-3 rounded-lg',
        'bg-red-50 border border-red-200 text-red-800',
        className
      )}
      role="alert"
    >
      <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
      <div className="min-w-0">
        <p className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-0.5">
          ⚠ Data manipulada — revisão necessária
        </p>
        <p className="text-xs text-red-600 leading-relaxed">
          A data deste registro de peso{dataPesagem ? ` (${dataPesagem})` : ''} foi marcada como{' '}
          <strong>incerta</strong>. Confirme a data real com o paciente antes de usar esse dado
          para análise ou geração de alertas.
        </p>
      </div>
    </div>
  )
}
