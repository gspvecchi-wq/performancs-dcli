import { PesquisaClient } from './pesquisa-client'

export const metadata = {
  title: 'Sua opinião — D\'Clinique',
  robots: { index: false, follow: false },
}

export default async function PesquisaPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  return <PesquisaClient token={token} />
}
