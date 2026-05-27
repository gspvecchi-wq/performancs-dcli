import type { Metadata } from 'next'
import { DM_Sans, DM_Serif_Display } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { Toaster } from 'sonner'

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

const dmSerif = DM_Serif_Display({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-dm-serif',
  display: 'swap',
})

export const metadata: Metadata = {
  title: "D'Clinique — Plano de Acompanhamento",
  description: 'Plataforma de Customer Success para clínicas médicas',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${dmSans.variable} ${dmSerif.variable}`}>
      <body className="font-sans bg-gray-50 text-gray-900 antialiased">
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
