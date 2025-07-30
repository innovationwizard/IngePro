import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { Toaster } from '@/components/ui/Toaster'
import { TenantProvider } from '@/contexts/TenantContext'
import { getTenantSlug } from '@/lib/db-tenant'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'IngePro - Gestión de Productividad en Construcción',
  description: 'Seguimiento en tiempo real de la productividad en construcción y gestión de proyectos',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
