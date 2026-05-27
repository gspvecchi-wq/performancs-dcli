'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Activity, Eye, EyeOff, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      toast.error('Credenciais inválidas. Verifique seu e-mail e senha.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0D1F1A] px-4">
      {/* Background pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }}
      />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500 mb-4">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <h1 className="font-display text-3xl text-white mb-1">
            Performan<span className="text-emerald-400">CS</span>
          </h1>
          <p className="text-sm text-white/40">Plano de Acompanhamento</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Entrar na plataforma</h2>
          <p className="text-sm text-gray-500 mb-6">Acesse com suas credenciais</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-lg
                           focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent
                           transition-all duration-150 placeholder:text-gray-400"
                placeholder="seu@email.com"
              />
            </div>

            {/* Senha */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Senha
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full px-3.5 py-2.5 pr-10 text-sm border border-gray-300 rounded-lg
                             focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent
                             transition-all duration-150 placeholder:text-gray-400"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Botão */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 bg-emerald-600 text-white text-sm font-semibold rounded-lg
                         hover:bg-emerald-700 active:scale-[0.99] transition-all duration-150
                         disabled:opacity-60 disabled:cursor-not-allowed
                         flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Entrando...</>
              ) : (
                'Entrar'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-white/20 mt-6">
          PerformanCS © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
