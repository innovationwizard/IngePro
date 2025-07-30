'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { es } from '@/lib/translations/es'
import { 
  Clock, 
  Calendar, 
  FileText, 
  Settings, 
  Users,
  BarChart3,
  Shield,
  Building
} from 'lucide-react'

const navigation = [
  { name: es.navigation.dashboard, href: '/dashboard', icon: Clock },
  { name: es.navigation.workLogs, href: '/dashboard/worklogs', icon: FileText },
  { name: es.navigation.projects, href: '/dashboard/projects', icon: Calendar },
  { name: es.navigation.team, href: '/dashboard/team', icon: Users },
  { name: es.navigation.reports, href: '/dashboard/reports', icon: BarChart3 },
  { name: es.navigation.settings, href: '/dashboard/settings', icon: Settings },
]

const adminNavigation = [
  { name: 'Gestión de Usuarios', href: '/dashboard/admin/users', icon: Users },
  { name: 'Gestión de Empresas', href: '/dashboard/admin/tenants', icon: Building },
  { name: 'Configuración del Sistema', href: '/dashboard/admin/settings', icon: Settings },
]

export default function Sidebar() {
  const { data: session, status } = useSession()
  
  // Add loading state
  if (status === 'loading') {
    return <div>Cargando...</div>
  }
  
  // Add unauthenticated state
  if (status === 'unauthenticated') {
    return null
  }
  
  // Safe to use session.user now
  const userRole = session?.user?.role || 'WORKER'
  
  return (
    <div className="w-64 bg-white shadow-sm border-r">
      <nav className="mt-5 px-2">
        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors',
                  isActive
                    ? 'bg-blue-100 text-blue-900'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                )}
              >
                <item.icon
                  className={cn(
                    'mr-3 h-5 w-5',
                    isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                  )}
                />
                {item.name}
              </Link>
            )
          })}
        </div>

        {isAdmin && (
          <>
            <div className="mt-8 pt-4 border-t border-gray-200">
              <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Administración
              </div>
            </div>
            <div className="mt-1 space-y-1">
              {adminNavigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors',
                      isActive
                        ? 'bg-red-100 text-red-900'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    )}
                  >
                    <item.icon
                      className={cn(
                        'mr-3 h-5 w-5',
                        isActive ? 'text-red-500' : 'text-gray-400 group-hover:text-gray-500'
                      )}
                    />
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </>
        )}
      </nav>
    </div>
  )
}
