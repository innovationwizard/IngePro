'use client'
import { User as UserType } from '@/types/admin'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Plus, Edit, Eye, User, Mail, Building, Calendar, Clock } from 'lucide-react'

// Mock users data with relationship history
const mockUsers = [
  {
    id: '1',
    name: 'Juan Pérez',
    email: 'worker@demo.com',
    status: 'ACTIVE',
    createdAt: '2024-01-15',
    currentCompany: 'Empresa de Construcción Demo',
    currentTeams: ['Equipo A', 'Equipo B'],
    currentProjects: ['Proyecto Centro', 'Proyecto Norte'],
    history: [
      { company: 'Empresa de Construcción Demo', startDate: '2024-01-15', endDate: null, role: 'WORKER' },
      { company: 'Constructora del Norte', startDate: '2023-06-01', endDate: '2023-12-31', role: 'WORKER' },
    ]
  },
  {
    id: '2',
    name: 'María González',
    email: 'supervisor@demo.com',
    status: 'ACTIVE',
    createdAt: '2024-01-10',
    currentCompany: 'Empresa de Construcción Demo',
    currentTeams: ['Equipo Supervisor'],
    currentProjects: ['Proyecto Centro'],
    history: [
      { company: 'Empresa de Construcción Demo', startDate: '2024-01-10', endDate: null, role: 'SUPERVISOR' },
    ]
  },
  {
    id: '3',
    name: 'Carlos Rodríguez',
    email: 'admin@demo.com',
    status: 'ACTIVE',
    createdAt: '2024-01-05',
    currentCompany: 'Empresa de Construcción Demo',
    currentTeams: ['Equipo Admin'],
    currentProjects: ['Todos los Proyectos'],
    history: [
      { company: 'Empresa de Construcción Demo', startDate: '2024-01-05', endDate: null, role: 'ADMIN' },
    ]
  },
]

export default function AdminUsersPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState(mockUsers)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)

  // Check if user is admin
  if (session?.user?.role !== 'ADMIN') {
    router.push('/dashboard')
    return null
  }

  const handleAddUser = () => {
    setIsAddModalOpen(true)
  }

  const handleEditUser = (user: UserType) => {
    setSelectedUser(user)
    setIsEditModalOpen(true)
  }

  const handleViewHistory = (user: UserType) => {
    setSelectedUser(user)
    setIsHistoryModalOpen(true)
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      ACTIVE: { bg: 'bg-green-100', text: 'text-green-800', label: 'Activo' },
      INACTIVE: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Inactivo' },
      SUSPENDED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Suspendido' },
    }
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.INACTIVE
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
          <p className="text-gray-600">Los usuarios son permanentes y no se pueden eliminar</p>
        </div>
        <button
          onClick={handleAddUser}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Agregar Usuario</span>
        </button>
      </div>

      <div className="bg-white shadow-sm border rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Lista de Usuarios</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Empresa Actual
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Equipos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Proyectos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <Mail className="h-3 w-3 mr-1" />
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(user.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <Building className="h-3 w-3 mr-1 text-gray-400" />
                      {user.currentCompany}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex flex-wrap gap-1">
                      {user.currentTeams.map((team: string, index: number) => (
                        <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                          {team}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex flex-wrap gap-1">
                      {user.currentProjects.map((project: string, index: number) => (
                        <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                          {project}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => router.push(`/dashboard/admin/users/${user.id}`)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Ver Detalles"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEditUser(user)}
                        className="text-green-600 hover:text-green-900"
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Agregar Usuario</h3>
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nombre</label>
                  <input
                    type="text"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-2 sm:px-3 py-2 min-w-0"
                    placeholder="Nombre completo"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-2 sm:px-3 py-2 min-w-0"
                    placeholder="email@ejemplo.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Estado</label>
                  <select className="mt-1 block w-full border border-gray-300 rounded-md px-2 sm:px-3 py-2 min-w-0">
                    <option value="ACTIVE">Activo</option>
                    <option value="INACTIVE">Inactivo</option>
                    <option value="SUSPENDED">Suspendido</option>
                  </select>
                </div>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                  >
                    Agregar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Editar Usuario</h3>
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nombre</label>
                  <input
                    type="text"
                    defaultValue={selectedUser.name}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-2 sm:px-3 py-2 min-w-0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    defaultValue={selectedUser.email}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-2 sm:px-3 py-2 min-w-0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Estado</label>
                  <select 
                    defaultValue={selectedUser.status}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-2 sm:px-3 py-2 min-w-0"
                  >
                    <option value="ACTIVE">Activo</option>
                    <option value="INACTIVE">Inactivo</option>
                    <option value="SUSPENDED">Suspendido</option>
                  </select>
                </div>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* User History Modal */}
      {isHistoryModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Historial de {selectedUser.name}</h3>
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Historial de Empresas</h4>
                  <div className="space-y-2">
                    {selectedUser.history.map((entry: { company: string; role: string; startDate: string; endDate: string | null }, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                        <div>
                          <div className="font-medium">{entry.company}</div>
                          <div className="text-sm text-gray-500">{entry.role}</div>
                        </div>
                        <div className="text-sm text-gray-500">
                          <div>{new Date(entry.startDate).toLocaleDateString('es-ES')}</div>
                          <div>{entry.endDate ? new Date(entry.endDate).toLocaleDateString('es-ES') : 'Actual'}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => setIsHistoryModalOpen(false)}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
