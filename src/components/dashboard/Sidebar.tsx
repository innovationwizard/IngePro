'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  Clock,
  Users,
  FolderOpen,
  Building,
  Settings,
  LogOut
} from 'lucide-react'

export default function Sidebar() {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  
  if (status === 'loading') {
    return <div className="w-64 bg-gray-800 text-white p-4">Cargando...</div>
  }
  
  if (status === 'unauthenticated') {
    return null
  }

  const userRole = session?.user?.role || 'WORKER'

  const menuItems = [
    {
      name: 'Panel Principal',
      href: '/dashboard',
      icon: Home,
      roles: ['WORKER', 'SUPERVISOR', 'ADMIN']
    },
    {
      name: 'Registros de Trabajo',
      href: '/dashboard/work-logs',
      icon: Clock,
      roles: ['WORKER', 'SUPERVISOR', 'ADMIN']
    },
    {
      name: 'Proyectos',
      href: '/dashboard/projects',
      icon: FolderOpen,
      roles: ['SUPERVISOR', 'ADMIN']
    },
    {
      name: 'Gestión de Usuarios',
      href: '/dashboard/admin/users',
      icon: Users,
      roles: ['ADMIN']
    },
    {
      name: 'Gestión de Empresas',
      href: '/dashboard/admin/tenants',
      icon: Building,
      roles: ['ADMIN']
    }
  ]

  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(userRole)
  )

  return (
    <div className="w-64 bg-gray-800 text-white h-full flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-xl font-bold">IngePro</h1>
        <p className="text-sm text-gray-300">{session?.user?.name}</p>
        <p className="text-xs text-gray-400">{userRole}</p>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-gray-700 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-700">
        <button
          onClick={() => {/* Add signOut logic */}}
          className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-300 rounded-md hover:bg-gray-700 hover:text-white"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Cerrar Sesión
        </button>
      </div>
    </div>
  )
}