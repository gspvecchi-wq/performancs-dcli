import { format, formatDistanceToNow, parseISO, differenceInDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function formatDate(date: string | Date, pattern = 'dd MMM yyyy') {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, pattern, { locale: ptBR })
}

export function formatDateShort(date: string | Date) {
  return formatDate(date, 'dd MMM')
}

export function formatDateTime(date: string | Date) {
  return formatDate(date, "dd MMM 'às' HH:mm")
}

export function formatRelative(date: string | Date) {
  const d = typeof date === 'string' ? parseISO(date) : date
  return formatDistanceToNow(d, { addSuffix: true, locale: ptBR })
}

export function daysUntil(date: string | Date) {
  const d = typeof date === 'string' ? parseISO(date) : date
  return differenceInDays(d, new Date())
}

export function daysSince(date: string | Date) {
  const d = typeof date === 'string' ? parseISO(date) : date
  return differenceInDays(new Date(), d)
}

export function formatPhone(phone: string) {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 13) {
    // +55 11 99999-9999
    return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`
  }
  return phone
}

export function formatWeight(kg: number) {
  return `${kg.toFixed(1)} kg`
}

export function formatWeightDiff(diff: number) {
  const sign = diff > 0 ? '+' : ''
  return `${sign}${diff.toFixed(1)} kg`
}

export function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('')
}

export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('55') && digits.length >= 12) return `+${digits}`
  if (digits.length === 11) return `+55${digits}`
  if (digits.length === 10) return `+55${digits}`
  return `+${digits}`
}
