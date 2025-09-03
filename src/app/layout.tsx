import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { Toaster } from '@/components/ui/Toaster'
import { TenantProvider } from '@/contexts/TenantContext'
import { getTenantSlug } from '@/lib/db-tenant'
import PWAServiceWorker from '@/components/PWAServiceWorker'
import PWAInstallPrompt from '@/components/PWAInstallPrompt'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://ingepro.app'),
  title: 'IngePro - Gestión de Productividad en Construcción',
  description: 'Plataforma integral de gestión de productividad para el sector de la construcción, con seguimiento de tiempo, gestión de usuarios y colaboración en tiempo real.',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-48x48.png', sizes: '48x48', type: 'image/png' },
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  keywords: ['construcción', 'productividad', 'gestión', 'proyectos', 'seguimiento de tiempo', 'IngePro', 'PWA', 'app'],
  authors: [{ name: 'IngePro' }],
  applicationName: 'IngePro',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'IngePro',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: 'IngePro - Gestión de Productividad en Construcción',
    description: 'Plataforma integral de gestión de productividad para el sector de la construcción, con seguimiento de tiempo, gestión de usuarios y colaboración en tiempo real.',
    url: 'https://ingepro.app',
    siteName: 'IngePro',
    images: [
      {
        url: '/ingepro_logo_small.png',
        width: 120,
        height: 120,
        alt: 'IngePro',
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
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  userScalable: true,
  minimumScale: 1,
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
        <PWAServiceWorker />
        <PWAInstallPrompt />
      </body>
    </html>
  )
}
