// src/app/signup/page.tsx
// Restore EXACT original design from your documentation

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { HardHat } from 'lucide-react';

interface FormData {
  companyName: string;
  companySlug: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
  confirmPassword: string;
}

export default function SignupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    companyName: '',
    companySlug: '',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    confirmPassword: ''
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');
    setIsSuccess(false);

    // Validate password confirmation
    if (formData.adminPassword !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      setIsLoading(false);
      return;
    }

    // Validate password length
    if (formData.adminPassword.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      setIsLoading(false);
      return;
    }

    const data = {
      companyName: formData.companyName,
      companySlug: formData.companySlug,
      adminName: formData.adminName,
      adminEmail: formData.adminEmail,
      adminPassword: formData.adminPassword,
    };

    try {
      console.log('🚀 Attempting to create account:', data.adminEmail);
      
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();
      console.log('📡 Signup response:', response.status, responseData);

      if (response.ok) {
        setSuccess(`¡Cuenta creada exitosamente! Empresa: ${data.companyName}`);
        setIsSuccess(true);
        
        // Wait 2 seconds to show success message, then redirect
        setTimeout(() => {
          window.location.href = `/auth/login`;
        }, 2000);
      } else {
        // Handle different error types
        let errorMessage = 'Error al crear cuenta';
        
        if (response.status === 409) {
          errorMessage = 'La empresa o email ya existe. Por favor, use un identificador o email diferente.';
        } else if (response.status === 503) {
          errorMessage = 'Servicio temporalmente no disponible. Por favor, intente nuevamente en unos momentos.';
        } else if (responseData.error) {
          errorMessage = responseData.error;
        } else if (responseData.details) {
          errorMessage = `${errorMessage}: ${responseData.details}`;
        }
        
        setError(errorMessage);
        console.error('❌ Signup failed:', response.status, responseData);
      }
    } catch (error) {
      console.error('💥 Network error during signup:', error);
      setError('Error de conexión. Por favor, verifique su conexión a internet e intente nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="pt-8 pb-4">
          <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-700">
            <span className="text-md font-light">← Volver al Inicio</span>
          </Link>
        </div>

        <div className="pt-8 pb-8 text-center lg:pt-12">
          <div className="flex justify-center mb-4">
            <HardHat className="h-24 w-24 text-yellow-500 sm:h-40 sm:w-40" />
          </div>
          <h1 className="mx-auto max-w-4xl font-display text-5xl font-medium tracking-tight text-slate-900 sm:text-7xl">
            <span className="text-blue-600">IngePro</span>
            <br />
            <span className="text-black-400 text-4xl">Crear Cuenta</span>
          </h1>

          <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
            <div className="bg-white/80 backdrop-blur-sm text-left py-8 px-6 shadow-xl rounded-2xl border border-white/20">
              <form className="space-y-6" onSubmit={handleSubmit}>
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg">
                    <p className="font-medium">¡Éxito!</p>
                    <p className="text-sm mt-1">{success}</p>
                    <p className="text-xs mt-2">Redirigiendo al login...</p>
                  </div>
                )}

                {/* Company Information */}
                <div>
                  <h3 className="text-lg text-center font-semibold text-slate-900 mb-4">
                    Información de la Empresa
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Nombre de la Empresa
                      </label>
                      <input
                        type="text"
                        required
                        disabled={isLoading || isSuccess}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:opacity-50"
                        value={formData.companyName}
                        onChange={(e) => {
                          const name = e.target.value
                          const slug = name.toLowerCase()
                            .replace(/[^a-z0-9\s]/g, '')
                            .replace(/\s+/g, '-')
                          
                          setFormData({
                            ...formData,
                            companyName: name,
                            companySlug: slug
                          })
                        }}
                        placeholder="Nombre de la empresa"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        URL de la Empresa
                      </label>
                      <div className="flex rounded-lg shadow-sm">
                        <span className="inline-flex items-center px-4 rounded-l-lg border border-r-0 border-slate-300 bg-slate-50 text-slate-500 text-sm">
                          ingepro.app/
                        </span>
                        <input
                          type="text"
                          required
                          disabled={isLoading || isSuccess}
                          className="flex-1 block w-full px-4 py-3 border border-slate-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:opacity-50"
                          value={formData.companySlug}
                          onChange={(e) => setFormData({
                            ...formData,
                            companySlug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
                          })}
                          placeholder="nombre-empresa"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Admin User Information */}
                <div>
                  <h3 className="text-lg text-center font-semibold text-slate-900 mb-4">
                    Administrador Principal
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Nombre Completo
                      </label>
                      <input
                        type="text"
                        required
                        disabled={isLoading || isSuccess}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:opacity-50"
                        value={formData.adminName}
                        onChange={(e) => setFormData({...formData, adminName: e.target.value})}
                        placeholder="Nombre completo"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        required
                        disabled={isLoading || isSuccess}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:opacity-50"
                        value={formData.adminEmail}
                        onChange={(e) => setFormData({...formData, adminEmail: e.target.value})}
                        placeholder="email@empresa.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Contraseña
                      </label>
                      <p className="text-xs text-slate-500 mb-2">Al menos 8 caracteres</p>
                      <input
                        type="password"
                        required
                        minLength={8}
                        disabled={isLoading || isSuccess}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:opacity-50"
                        value={formData.adminPassword}
                        onChange={(e) => setFormData({...formData, adminPassword: e.target.value})}
                        placeholder="Contraseña"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Confirmar Contraseña
                      </label>
                      <input
                        type="password"
                        required
                        disabled={isLoading || isSuccess}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:opacity-50"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                        placeholder="Confirmar contraseña"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={isLoading || isSuccess}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
                  >
                    {isLoading ? 'Creando cuenta...' : isSuccess ? '¡Cuenta Creada!' : 'Crear Cuenta'}
                  </button>
                </div>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-slate-600">
                  ¿Ya tienes una cuenta?{' '}
                  <br />
                  <Link href="/auth/login" className="font-medium text-blue-600 hover:text-blue-700">
                    Iniciar sesión
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}