'use client'

import { cn } from '@/lib/utils/cn'
import type { AlertSeverity, AlertType, PatientLevel, PaymentStatus } from '@/types/patient'

type BadgeVariant =
  | 'excelente'
  | 'bom'
  | 'risco'
  | 'critico'
  | 'atencao'
  | 'info'
  | 'neutro'
  | 'adimplente'
  | 'inadimplente'
  | 'em_atraso'
  | 'desconhecido'
  | 'urgente'
  | 'normal'

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  excelente:     'bg-emerald-50 text-emerald-700 ring-emerald-200',
  bom:           'bg-green-50 text-green-700 ring-green-200',
  risco:         'bg-red-50 text-red-700 ring-red-200',
  critico:       'bg-red-100 text-red-800 ring-red-300',
  atencao:       'bg-amber-50 text-amber-700 ring-amber-200',
  info:          'bg-blue-50 text-blue-700 ring-blue-200',
  neutro:        'bg-gray-100 text-gray-600 ring-gray-200',
  adimplente:    'bg-emerald-50 text-emerald-700 ring-emerald-200',
  inadimplente:  'bg-red-50 text-red-700 ring-red-200',
  em_atraso:     'bg-amber-50 text-amber-700 ring-amber-200',
  desconhecido:  'bg-gray-100 text-gray-500 ring-gray-200',
  urgente:       'bg-red-100 text-red-800 ring-red-300',
  normal:        'bg-emerald-50 text-emerald-700 ring-emerald-200',
}

interface BadgeProps {
  variant: BadgeVariant
  children: React.ReactNode
  size?: 'sm' | 'md'
  className?: string
  dot?: boolean
}

export function Badge({ variant, children, size = 'md', className, dot }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium ring-1 ring-inset rounded-full',
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs',
        VARIANT_CLASSES[variant],
        className
      )}
    >
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full flex-shrink-0',
            variant === 'excelente' || variant === 'adimplente' || variant === 'bom'
              ? 'bg-emerald-500'
              : variant === 'atencao' || variant === 'em_atraso'
              ? 'bg-amber-500'
              : variant === 'info'
              ? 'bg-blue-500'
              : 'bg-red-500'
          )}
        />
      )}
      {children}
    </span>
  )
}

// Helpers de conversão de tipos para variante
export function levelToBadge(nivel: PatientLevel): BadgeVariant {
  return nivel === 'alto' ? 'excelente' : nivel === 'medio' ? 'bom' : 'risco'
}

export function scoreToBadge(score: number): BadgeVariant {
  if (score >= 75) return 'excelente'
  if (score >= 50) return 'bom'
  return 'risco'
}

export function paymentToBadge(status: PaymentStatus): BadgeVariant {
  return status as BadgeVariant
}

export function severityToBadge(severidade: AlertSeverity): BadgeVariant {
  return severidade === 'critico' ? 'critico' : severidade === 'atencao' ? 'atencao' : 'info'
}

export const ALERT_LABELS: Record<AlertType, string> = {
  plano_vencendo:    'Renovação próxima',
  protocolo_atrasado:'Plano de acompanhamento pendente',
  peso_fora_meta:    'Peso fora da meta',
  data_manipulada:   'Data manipulada',
  sem_contato:       'Sem contato',
  risco_evasao:      'Risco de evasão',
  renovacao:         'Renovação próxima',
  upsell:            'Oportunidade de upsell',
}

export const ALERT_BADGE: Record<AlertType, BadgeVariant> = {
  plano_vencendo:    'atencao',
  protocolo_atrasado:'risco',
  peso_fora_meta:    'atencao',
  data_manipulada:   'critico',
  sem_contato:       'atencao',
  risco_evasao:      'critico',
  renovacao:         'atencao',
  upsell:            'bom',
}
