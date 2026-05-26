'use client'

import { cn } from '@/lib/utils/cn'
import { getInitials } from '@/lib/utils/format'
import type { PatientLevel } from '@/types/patient'
import Image from 'next/image'

interface PatientAvatarProps {
  nome: string
  nivel: PatientLevel
  foto_url?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const SIZE_CLASSES = {
  sm: 'w-8 h-8 text-[10px]',
  md: 'w-9 h-9 text-xs',
  lg: 'w-11 h-11 text-sm',
  xl: 'w-14 h-14 text-base',
}

const LEVEL_CLASSES = {
  alto:  'bg-emerald-100 text-emerald-700',
  medio: 'bg-amber-100 text-amber-700',
  baixo: 'bg-red-100 text-red-700',
}

export function PatientAvatar({ nome, nivel, foto_url, size = 'md', className }: PatientAvatarProps) {
  const sizeClass = SIZE_CLASSES[size]
  const levelClass = LEVEL_CLASSES[nivel]
  const initials = getInitials(nome)

  if (foto_url) {
    return (
      <div className={cn('rounded-full overflow-hidden flex-shrink-0', sizeClass, className)}>
        <Image
          src={foto_url}
          alt={nome}
          width={56}
          height={56}
          className="w-full h-full object-cover"
        />
      </div>
    )
  }

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-bold flex-shrink-0 select-none',
        sizeClass,
        levelClass,
        className
      )}
      title={nome}
    >
      {initials}
    </div>
  )
}
