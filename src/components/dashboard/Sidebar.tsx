'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Home,
  Clock,
  Users,
  FolderOpen,
  Building,
  Settings,
  LogOut,
  CheckSquare,
  Package,
  BarChart3
} from 'lucide-react'

export default function Sidebar() {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  
  if (status === 'loading') {
    return <div className="w-64 bg-gray-800 text-white p-4">Cargando...</div>
  }
  
  if (status === 'unauthenticated') {
    return null
  }

  const userRole = session?.user?.role || 'WORKER'

  const handleLogout = async () => {
    await signOut({ redirect: false })
    router.push('/')
  }

  const menuItems = [
    {
      name: 'Panel Principal',
      href: '/dashboard',
      icon: Home,
      roles: ['WORKER', 'SUPERVISOR', 'ADMIN', 'SUPERUSER']
    },
    {
      name: 'Registros de Trabajo',
      href: '/dashboard/work-logs',
      icon: Clock,
      roles: ['WORKER', 'SUPERVISOR', 'ADMIN', 'SUPERUSER']
    },
    {
      name: 'Gestión de Tareas',
      href: '/dashboard/tasks',
      icon: CheckSquare,
      roles: ['WORKER', 'SUPERVISOR', 'ADMIN', 'SUPERUSER']
    },
    {
      name: 'Gestión de Materiales',
      href: '/dashboard/materials',
      icon: Package,
      roles: ['SUPERVISOR', 'ADMIN', 'SUPERUSER']
    },
    {
      name: 'Gestión de Usuarios',
      href: '/dashboard/admin/people',
      icon: Users,
      roles: ['ADMIN', 'SUPERUSER']
    },
    {
      name: 'Gestión de Proyectos',
      href: '/dashboard/projects',
      icon: FolderOpen,
      roles: ['SUPERVISOR', 'ADMIN', 'SUPERUSER']
    },
    {
      name: 'Gestión de Empresas',
      href: '/dashboard/admin/tenants',
      icon: Building,
      roles: ['ADMIN', 'SUPERUSER']
    },
    {
      name: 'Análisis',
      href: '/dashboard/analysis',
      icon: BarChart3,
      roles: ['SUPERVISOR', 'ADMIN', 'SUPERUSER']
    },
    {
      name: 'SuperUser Dashboard',
      href: '/dashboard/superuser',
      icon: Settings,
      roles: ['SUPERUSER']
    }
  ]

  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(userRole)
  )

  return (
    <div className="w-64 bg-white text-gray-900 h-full flex flex-col border-r border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">IngePro</h1>
        <p className="text-sm text-gray-600">{session?.user?.name}</p>
        <p className="text-xs text-gray-500">{userRole}</p>
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
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
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

      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 hover:text-gray-900"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Cerrar Sesión
        </button>
      </div>
    </div>
  )
}