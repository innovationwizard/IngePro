// src/app/signup/page.tsx
// Update the form action to use the working signup-test endpoint

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { HardHat } from 'lucide-react';

export default function SignupPage() {
  const [formData, setFormData] = useState({
    companyName: '',
    companySlug: '',
    adminName: '',
    adminEmail: '',
    adminPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Use the working signup-test endpoint temporarily
      const response = await fetch('/api/signup-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        // Redirect to login after success
        setTimeout(() => {
          window.location.href = '/auth/login';
        }, 2000);
      } else {
        setError(data.error || 'Error al crear cuenta');
      }
    } catch (error) {
      setError('Error de conexión. Por favor, intente nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Auto-generate slug from company name
    if (name === 'companyName') {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      setFormData(prev => ({ ...prev, companySlug: slug }));
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="flex justify-center mb-4">
            <HardHat className="h-16 w-16 text-green-500" />
          </div>
          <h1 className="font-display text-3xl font-medium tracking-tight text-slate-900 mb-4">
            ¡Cuenta Creada!
          </h1>
          <p className="text-slate-600 mb-4">
            Su cuenta ha sido creada exitosamente. Será redirigido al login en breve.
          </p>
          <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-6">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        {/* Header */}
        <div className="flex justify-center mb-4">
          <HardHat className="h-24 w-24 sm:h-40 sm:w-40 text-yellow-500" />
        </div>
        
        <h1 className="font-display text-5xl font-medium tracking-tight text-slate-900 sm:text-7xl text-center mb-2">
          IngePro
        </h1>
        
        <p className="text-md font-light text-slate-600 text-center mb-8">
          Crear Cuenta
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre de la Empresa
            </label>
            <input
              type="text"
              name="companyName"
              value={formData.companyName}
              onChange={handleInputChange}
              className="w-full px-3 sm:px-4 py-2 min-w-0 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Identificador de Empresa
            </label>
            <input
              type="text"
              name="companySlug"
              value={formData.companySlug}
              onChange={handleInputChange}
              className="w-full px-3 sm:px-4 py-2 min-w-0 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Se genera automáticamente del nombre</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre del Administrador
            </label>
            <input
              type="text"
              name="adminName"
              value={formData.adminName}
              onChange={handleInputChange}
              className="w-full px-3 sm:px-4 py-2 min-w-0 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email del Administrador
            </label>
            <input
              type="email"
              name="adminEmail"
              value={formData.adminEmail}
              onChange={handleInputChange}
              className="w-full px-3 sm:px-4 py-2 min-w-0 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña
            </label>
            <input
              type="password"
              name="adminPassword"
              value={formData.adminPassword}
              onChange={handleInputChange}
              className="w-full px-3 sm:px-4 py-2 min-w-0 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Creando cuenta...
              </>
            ) : (
              'Crear Cuenta'
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          ¿Ya tienes cuenta?{' '}
          <Link href="/auth/login" className="text-blue-600 hover:text-blue-500">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}