'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function WorkLogsPage() {
  const { data: session } = useSession()
  const router = useRouter()

  // Check if user is authenticated
  if (!session) {
    router.push('/auth/login')
    return null
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Registros de Trabajo</h1>
        <p className="text-gray-600">Historial de registros de tiempo y actividad</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="text-center py-8">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Registros de Trabajo
          </h3>
          <p className="text-gray-600">
            Esta funcionalidad estará disponible próximamente.
          </p>
        </div>
      </div>
    </div>
  )
} 