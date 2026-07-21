import { SkeletonPage, Skeleton, SkeletonRows } from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <SkeletonPage>
      {/* Abas + busca */}
      <Skeleton className="h-10 w-72 mb-5 rounded-xl" />
      <Skeleton className="h-11 w-full mb-5 rounded-xl" />
      {/* Tabela */}
      <SkeletonRows count={8} />
    </SkeletonPage>
  )
}
