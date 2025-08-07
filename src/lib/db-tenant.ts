import { headers, cookies } from 'next/headers'

export async function getTenantSlug(): Promise<string | null> {
  const headersList = headers()
  const cookieStore = cookies()
  
  // Try headers first (from middleware)
  let tenantSlug = headersList.get('x-tenant-id')
  
  // Fallback to cookies
  if (!tenantSlug) {
    tenantSlug = cookieStore.get('tenant')?.value || null
  }
  
  return tenantSlug
}

export async function getTenantId(): Promise<string | null> {
  const tenantSlug = await getTenantSlug()
  
  if (!tenantSlug) return null
  
  // For now, use demo data - later connect to real database
  const demoCompanies: Record<string, string> = {
    'aplicaciones-especiales': 'company-1',
    'constructora-maya': 'company-2',
    'grupo-inmobiliario': 'company-3'
  }
  
  return demoCompanies[tenantSlug] || null
}