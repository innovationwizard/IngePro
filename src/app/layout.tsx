import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const tenantSlug = await getTenantSlug()
  
  return (
    <html lang="es">
      <body>
        <TenantProvider initialTenant={tenantSlug}>
          {children}
        </TenantProvider>
      </body>
    </html>
  )
}
