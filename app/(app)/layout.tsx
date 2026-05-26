import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Busca dados do usuário e badges
  const [{ data: usuario }, { data: filaHoje }, { data: alertasAbertos }] = await Promise.all([
    supabase
      .from('usuarios')
      .select('nome, papel')
      .eq('id', user.id)
      .single(),

    supabase
      .from('fila_do_dia')
      .select('id', { count: 'exact', head: true })
      .eq('data_fila', new Date().toISOString().split('T')[0])
      .eq('status', 'pendente'),

    supabase
      .from('alertas')
      .select('id', { count: 'exact', head: true })
      .eq('resolvido', false),
  ])

  return (
    <div className="flex min-h-screen">
      <Sidebar
        usuario={usuario}
        badges={{
          fila: filaHoje?.length ?? 0,
          alertas: alertasAbertos?.length ?? 0,
        }}
      />
      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="max-w-[1440px] mx-auto px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
