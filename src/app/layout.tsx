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
  description: 'Plataforma integral de gestión de productividad para el sector de la construcción, con seguimiento de tiempo, gestión de usuarios y colaboración en tiempo real.',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon.png',
    apple: '/apple-icon.png',
  },
  keywords: ['construcción', 'productividad', 'gestión', 'proyectos', 'seguimiento de tiempo', 'IngePro'],
  authors: [{ name: 'IngePro' }],
  openGraph: {
    title: 'IngePro - Gestión de Productividad en Construcción',
    description: 'Plataforma integral de gestión de productividad para el sector de la construcción, con seguimiento de tiempo, gestión de usuarios y colaboración en tiempo real.',
    url: 'https://ingepro.com',
    siteName: 'IngePro',
    images: [
      {
        url: '/ingepro_logo_small.png',
        width: 120,
        height: 120,
        alt: 'IngePro Logo',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'IngePro - Gestión de Productividad en Construcción',
    description: 'Plataforma integral de gestión de productividad para el sector de la construcción, con seguimiento de tiempo, gestión de usuarios y colaboración en tiempo real.',
    images: ['/ingepro_logo_small.png'],
  },
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
