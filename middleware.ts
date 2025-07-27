import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl
  
  // Extract tenant from path (/aplicaciones-especiales/dashboard)
  const pathParts = pathname.split('/')
  let tenant = null
  
  if (pathParts[1] && pathParts[1] !== 'api' && pathParts[1] !== '_next') {
    tenant = pathParts[1]
  }
  
  // Fallback to query parameter (?tenant=aplicaciones-especiales)
  if (!tenant) {
    tenant = searchParams.get('tenant')
  }
  
  const response = NextResponse.next()
  
  // Set tenant in headers for API routes
  if (tenant) {
    response.headers.set('x-tenant-id', tenant)
    response.cookies.set('tenant', tenant, { 
      httpOnly: true, 
      secure: true,
      sameSite: 'lax'
    })
  }
  
  return response
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}