import type { Metadata } from 'next'
import { Outfit, Bebas_Neue, Syne } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { Toaster } from 'sonner'

// Corpo de texto — limpa e leve
const outfit = Outfit({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-outfit',
  display: 'swap',
})

// Números grandes e títulos — condensada, premium
const bebas = Bebas_Neue({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-bebas',
  display: 'swap',
})

// Micro-labels / eyebrows
const syne = Syne({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-syne',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'PerformanCS — Plano de Acompanhamento',
  description: 'Plataforma de Customer Success para clínicas médicas',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${outfit.variable} ${bebas.variable} ${syne.variable}`}>
      <body className="font-sans bg-surface text-text-1 antialiased">
        <Providers>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{ classNames: { toast: 'font-sans text-sm' } }}
          />
        </Providers>
      </body>
    </html>
  )
}
