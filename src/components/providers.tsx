'use client'

import { SessionProvider } from 'next-auth/react'
import { TenantProvider } from '@/contexts/TenantContext'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <TenantProvider initialTenant={null}>
        {children}
      </TenantProvider>
    </SessionProvider>
  )
}