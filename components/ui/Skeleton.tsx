import { cn } from '@/lib/utils/cn'

/** Bloco base de skeleton com shimmer (classe .skeleton em globals.css) */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} />
}

/** Cabeçalho padrão de tela: eyebrow + título + subtítulo */
export function SkeletonHeader() {
  return (
    <div className="mb-6">
      <Skeleton className="h-3 w-32 mb-3 rounded" />
      <Skeleton className="h-7 w-64 mb-2 rounded-lg" />
      <Skeleton className="h-4 w-80 rounded" />
    </div>
  )
}

/** Lista de linhas (tabelas / listas verticais) */
export function SkeletonRows({ count = 8 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-16 rounded-xl" />
      ))}
    </div>
  )
}

/** Casca de página com o cabeçalho já montado */
export function SkeletonPage({ children }: { children: React.ReactNode }) {
  return (
    <div className="animate-fade-up">
      <SkeletonHeader />
      {children}
    </div>
  )
}
