'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function TenantSignup() {
  const [formData, setFormData] = useState({
    companyName: '',
    companySlug: '',
    adminEmail: '',
    adminName: ''
  })
  const router = useRouter()
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // For now, just redirect to the tenant URL
    router.push(`/${formData.companySlug}/dashboard`)
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="text-blue-600">
            IngePro
          </h1>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Registrar tu Empresa 
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Nombre de la Empresa
            </label>
            <input
              type="text"
              required
              value={formData.companyName}
              onChange={(e) => setFormData({...formData, companyName: e.target.value})}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="Nombre de la empresa"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">
              URL de la Empresa
            </label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                ingepro.app/
              </span>
              <input
                type="text"
                required
                value={formData.companySlug}
                onChange={(e) => setFormData({...formData, companySlug: e.target.value})}
                className="flex-1 block w-full border border-gray-300 rounded-none rounded-r-md px-3 py-2"
                placeholder="nombre-empresa"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email del Administrador
            </label>
            <input
              type="email"
              required
              value={formData.adminEmail}
              onChange={(e) => setFormData({...formData, adminEmail: e.target.value})}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="nombre@empresa.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Nombre del Administrador
            </label>
            <input
              type="text"
              required
              value={formData.adminName}
              onChange={(e) => setFormData({...formData, adminName: e.target.value})}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="Nombre Apellido"
            />
          </div>
          
          <button
            type="submit"
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Crear Empresa
          </button>
        </form>
      </div>
    </div>
  )
}