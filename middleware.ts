import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl
  
  // Extract tenant from path (/aplicaciones-especiales/dashboard)
  const pathParts = pathname.split('/')
  let tenant = null
  
  if (pathParts[1] && pathParts[1] !== 'api' && pathParts[1] !== '_next' && pathParts[1] !== '_not-found') {
    tenant = pathParts[1]
  }
  
  // Fallback to query parameter (?tenant=aplicaciones-especiales)
  if (!tenant) {
    tenant = searchParams.get('tenant')
  }
  
  // Handle tenant routing for dashboard
  if (tenant && pathname.startsWith(`/${tenant}/dashboard`)) {
    const newPathname = pathname.replace(`/${tenant}/dashboard`, '/dashboard')
    const url = request.nextUrl.clone()
    url.pathname = newPathname
    return NextResponse.rewrite(url)
  }
  
  // Handle tenant routing for API routes
  if (tenant && pathname.startsWith(`/${tenant}/api`)) {
    const newPathname = pathname.replace(`/${tenant}/api`, '/api')
    const url = request.nextUrl.clone()
    url.pathname = newPathname
    return NextResponse.rewrite(url)
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