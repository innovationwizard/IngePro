'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function SuperUserPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  // Add debugging
  useEffect(() => {
    console.log('SuperUser Dashboard - Session:', session)
    console.log('SuperUser Dashboard - Status:', status)
    console.log('SuperUser Dashboard - User Role:', session?.user?.role)
  }, [session, status])

  // Check if user is superuser
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (session?.user?.role !== 'SUPERUSER') {
    console.log('Access denied - User role:', session?.user?.role)
    router.push('/dashboard')
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Acceso Denegado
          </h2>
          <p className="text-gray-600">
            Redirigiendo...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">SuperUser Dashboard</h1>
        <p className="text-gray-600">System-wide administration and development tools</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Welcome, {session.user.name}!</h2>
        <p className="text-gray-600">Role: {session.user.role}</p>
        <p className="text-gray-600">Email: {session.user.email}</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Stats</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900">Active Tenants</h3>
            <p className="text-2xl font-bold text-blue-600">24</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-900">Total Users</h3>
            <p className="text-2xl font-bold text-green-600">1,247</p>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <h3 className="font-semibold text-orange-900">System Uptime</h3>
            <p className="text-2xl font-bold text-orange-600">99.9%</p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <h3 className="font-semibold text-red-900">Active Alerts</h3>
            <p className="text-2xl font-bold text-red-600">3</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">System Management</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
            <h3 className="font-semibold text-gray-900">System Health Monitor</h3>
            <p className="text-sm text-gray-600">Real-time system performance</p>
          </div>
          <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
            <h3 className="font-semibold text-gray-900">Multi-tenant Oversight</h3>
            <p className="text-sm text-gray-600">View all companies and users</p>
          </div>
          <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
            <h3 className="font-semibold text-gray-900">Revenue Analytics</h3>
            <p className="text-sm text-gray-600">MRR, churn, growth metrics</p>
          </div>
        </div>
      </div>
    </div>
  )
} 