'use client'

import { cn } from '@/lib/utils/cn'
import {
  LayoutDashboard,
  ListChecks,
  Users,
  Bell,
  CalendarDays,
  LogOut,
  Activity,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getInitials } from '@/lib/utils/format'

interface NavItem {
  href: string
  icon: React.ElementType
  label: string
  badgeKey?: 'fila' | 'alertas'
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/fila',       icon: ListChecks,      label: 'Fila do dia',   badgeKey: 'fila' },
  { href: '/pacientes',  icon: Users,           label: 'Pacientes' },
  { href: '/alertas',    icon: Bell,            label: 'Alertas',       badgeKey: 'alertas' },
  { href: '/relatorios', icon: CalendarDays,    label: 'Relatórios' },
]

interface SidebarProps {
  badges?: { fila?: number; alertas?: number }
  usuario?: { nome: string; papel: string } | null
}

export function Sidebar({ badges, usuario }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-[260px] bg-[#0D1F1A] min-h-screen flex flex-col flex-shrink-0 sticky top-0 h-screen">
      {/* Logo */}
      <div className="px-6 py-7 border-b border-white/[0.07]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center">
            <Activity className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="font-serif text-white text-[19px] tracking-tight leading-none">
              D'<span className="text-emerald-400">Clinique</span>
            </div>
            <div className="text-[10px] text-white/25 tracking-widest uppercase mt-0.5">
              Protocolo de retenção
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-4 flex flex-col gap-0.5">
        <div className="text-[10px] text-white/20 tracking-widest uppercase px-2 pb-2 pt-1 font-medium">
          Visão
        </div>

        {NAV_ITEMS.slice(0, 1).map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} badge={badges?.[item.badgeKey!]} />
        ))}

        <div className="text-[10px] text-white/20 tracking-widest uppercase px-2 pb-2 pt-4 font-medium">
          Operação
        </div>

        {NAV_ITEMS.slice(1, 4).map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} badge={badges?.[item.badgeKey!]} />
        ))}

        <div className="text-[10px] text-white/20 tracking-widest uppercase px-2 pb-2 pt-4 font-medium">
          Relatórios
        </div>

        {NAV_ITEMS.slice(4).map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}
      </nav>

      {/* User */}
      <div className="px-4 pb-6 pt-4 border-t border-white/[0.07]">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
          <div className="w-8 h-8 rounded-full bg-emerald-800 flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0">
            {usuario ? getInitials(usuario.nome) : 'CS'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-white/70 font-medium truncate">
              {usuario?.nome ?? 'Carregando...'}
            </div>
            <div className="text-[10px] text-white/25 mt-0.5 capitalize">
              {usuario?.papel ?? 'cs'}
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="p-1.5 rounded-md text-white/30 hover:text-white/70 hover:bg-white/[0.06] transition-colors"
            title="Sair"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  )
}

function NavLink({
  item,
  pathname,
  badge,
}: {
  item: NavItem
  pathname: string
  badge?: number
}) {
  const active = pathname === item.href || pathname.startsWith(item.href + '/')
  const Icon = item.icon

  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] transition-all duration-150',
        'border-l-[3px] font-medium select-none',
        active
          ? 'bg-emerald-500/[0.14] text-emerald-300 border-l-emerald-500'
          : 'text-white/40 border-l-transparent hover:bg-white/[0.05] hover:text-white/70'
      )}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span className="flex-1">{item.label}</span>
      {!!badge && badge > 0 && (
        <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </Link>
  )
}
