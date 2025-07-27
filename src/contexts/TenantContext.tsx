'use client'
import { createContext, useContext, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

interface TenantContextType {
  tenantSlug: string | null
  switchTenant: (slug: string) => void
}

const TenantContext = createContext<TenantContextType | null>(null)

export function TenantProvider({ 
  children, 
  initialTenant 
}: { 
  children: ReactNode
  initialTenant: string | null 
}) {
  const router = useRouter()
  
  const switchTenant = (slug: string) => {
    router.push(`/${slug}/dashboard`)
  }
  
  return (
    <TenantContext.Provider value={{
      tenantSlug: initialTenant,
      switchTenant
    }}>
      {children}
    </TenantContext.Provider>
  )
}

export const useTenant = () => {
  const context = useContext(TenantContext)
  if (!context) {
    throw new Error('useTenant must be used within TenantProvider')
  }
  return context
}