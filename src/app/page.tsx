import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="pt-20 pb-16 text-center lg:pt-32">
          <h1 className="mx-auto max-w-4xl font-display text-5xl font-medium tracking-tight text-slate-900 sm:text-7xl">
            <span className="text-blue-600">IngePro</span>
            <br />
            <span className="text-black-400 text-xl">Gestión de Productividad en Construcción</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg tracking-tight text-slate-700">
            Controla la productividad de tus trabajadores, gestiona materiales y 
            automatiza reportes para cobrar más rápido.
          </p>
          <div className="mt-10 flex justify-center gap-x-6">
            <Link
              href="/signup"
              className="group inline-flex items-center justify-center rounded-full py-2 px-4 text-sm font-semibold bg-blue-600 text-white hover:bg-blue-500"
            >
              Crear Empresa Gratis
            </Link>
            <Link
              href="/auth/login"
              className="group inline-flex items-center justify-center rounded-full py-2 px-4 text-sm font-semibold bg-white text-blue-600 border border-blue-600 hover:bg-blue-50"
            >
              Iniciar Sesión
            </Link>
            <Link
              href="/aplicaciones-especiales/dashboard"
              className="group inline-flex ring-1 items-center justify-center rounded-full py-2 px-4 text-sm ring-slate-200 text-slate-700 hover:text-slate-900"
            >
              Ver Demo
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}