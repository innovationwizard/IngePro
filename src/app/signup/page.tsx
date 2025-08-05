// src/app/signup/page.tsx
// Restore EXACT original design from your documentation

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { HardHat } from 'lucide-react';

export default function SignupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const data = {
      companyName: formData.get('companyName') as string,
      companySlug: formData.get('companySlug') as string,
      adminName: formData.get('adminName') as string,
      adminEmail: formData.get('adminEmail') as string,
      adminPassword: formData.get('adminPassword') as string,
    };

    try {
      const response = await fetch('/api/signup-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        window.location.href = `/auth/login`;
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Error al crear cuenta');
      }
    } catch (error) {
      setError('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <nav className="p-6">
        <div className="flex justify-between items-center">
          <Link href="/" className="text-xl font-bold text-blue-600">
            IngePro
          </Link>
          <Link 
            href="/auth/login" 
            className="text-md font-light text-slate-600 hover:text-slate-800"
          >
            Iniciar Sesión
          </Link>
        </div>
      </nav>

      <div className="pt-8 pb-8 text-center lg:pt-12">
        <div className="flex justify-center mb-4">
          <HardHat className="h-24 w-24 sm:h-40 sm:w-40 text-yellow-500" />
        </div>
        
        <h1 className="font-display text-5xl font-medium tracking-tight text-slate-900 sm:text-7xl">
          IngePro

        
        <p className="text-md font-light text-slate-600 mt-6 mb-12">
          Crear Cuenta
        </p>
        </h1>
        <div className="max-w-md mx-auto px-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-xl font-medium text-gray-900 mb-6">Información de la Empresa</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de la Empresa
                </label>
                <input
                  type="text"
                  id="companyName"
                  name="companyName"
                  className="w-full px-3 sm:px-4 py-2 min-w-0 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Empresa de Prueba Uno"
                  required
                />
              </div>

              <div>
                <label htmlFor="companySlug" className="block text-sm font-medium text-gray-700 mb-2">
                  Identificador de la Empresa
                </label>
                <input
                  type="text"
                  id="companySlug"
                  name="companySlug"
                  className="w-full px-3 sm:px-4 py-2 min-w-0 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="empresa-prueba-uno"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Este será parte de la URL de su empresa
                </p>
              </div>

              <div>
                <label htmlFor="adminName" className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Administrador
                </label>
                <input
                  type="text"
                  id="adminName"
                  name="adminName"
                  className="w-full px-3 sm:px-4 py-2 min-w-0 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Juan Pérez"
                  required
                />
              </div>

              <div>
                <label htmlFor="adminEmail" className="block text-sm font-medium text-gray-700 mb-2">
                  Email del Administrador
                </label>
                <input
                  type="email"
                  id="adminEmail"
                  name="adminEmail"
                  className="w-full px-3 sm:px-4 py-2 min-w-0 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="admin@empresa.com"
                  required
                />
              </div>

              <div>
                <label htmlFor="adminPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña
                </label>
                <input
                  type="password"
                  id="adminPassword"
                  name="adminPassword"
                  className="w-full px-3 sm:px-4 py-2 min-w-0 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="••••••••"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creando cuenta...' : 'Crear Cuenta'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                ¿Ya tienes una cuenta?{' '}
                <Link href="/auth/login" className="font-medium text-blue-600 hover:text-blue-500">
                  Iniciar sesión
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}