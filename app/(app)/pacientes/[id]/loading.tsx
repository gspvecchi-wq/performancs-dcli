import { Skeleton, SkeletonRows } from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <div className="animate-fade-up">
      <Skeleton className="h-4 w-20 mb-5 rounded" />
      {/* Cabeçalho do paciente */}
      <Skeleton className="h-40 w-full mb-5 rounded-2xl" />
      {/* Abas */}
      <Skeleton className="h-10 w-96 mb-5 rounded-xl" />
      {/* Conteúdo da aba */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      <SkeletonRows count={5} />
    </div>
  )
}
