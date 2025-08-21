'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'

export default function DebugPage() {
  const { data: session, status } = useSession()
  const [userData, setUserData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const fetchUserData = async () => {
    if (!session?.user?.email) return
    
    setLoading(true)
    try {
      const response = await fetch('/api/debug/user')
      if (response.ok) {
        const data = await response.json()
        setUserData(data.user)
      } else {
        setMessage('Failed to fetch user data')
      }
    } catch (error) {
      setMessage('Error fetching user data')
    } finally {
      setLoading(false)
    }
  }

  const fixRole = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/debug/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'fix-role', role: 'ADMIN' })
      })
      
      if (response.ok) {
        const data = await response.json()
        setMessage(data.message)
        fetchUserData() // Refresh data
        // Force session refresh
        window.location.reload()
      } else {
        setMessage('Failed to fix role')
      }
    } catch (error) {
      setMessage('Error fixing role')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session?.user?.email) {
      fetchUserData()
    }
  }, [session])

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Debug Session</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Session Status</h2>
          <p className="text-gray-600">Status: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{status}</span></p>
        </div>

        {session && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Session Data</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
              {JSON.stringify(session, null, 2)}
            </pre>
          </div>
        )}

        {session?.user && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">User Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">ID</label>
                <p className="font-mono bg-gray-100 px-2 py-1 rounded">{session.user.id}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <p className="font-mono bg-gray-100 px-2 py-1 rounded">{session.user.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="font-mono bg-gray-100 px-2 py-1 rounded">{session.user.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <p className="font-mono bg-gray-100 px-2 py-1 rounded">{session.user.role}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Company ID</label>
                <p className="font-mono bg-gray-100 px-2 py-1 rounded">{session.user.companyId}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Company Slug</label>
                <p className="font-mono bg-gray-100 px-2 py-1 rounded">{session.user.companySlug}</p>
              </div>
            </div>
          </div>
        )}

        {session?.user?.email && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Database User Data</h2>
              <button
                onClick={fetchUserData}
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Refresh'}
              </button>
            </div>
            
            {userData && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Database Role</label>
                    <p className="font-mono bg-gray-100 px-2 py-1 rounded">{userData.role}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <p className="font-mono bg-gray-100 px-2 py-1 rounded">{userData.status}</p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">User Tenants</label>
                  <div className="bg-gray-100 p-4 rounded">
                    {userData.userTenants.length > 0 ? (
                      userData.userTenants.map((tenant: any, index: number) => (
                        <div key={index} className="mb-2 p-2 bg-white rounded border">
                          <p><strong>Company:</strong> {tenant.companyName}</p>
                          <p><strong>Tenant Role:</strong> {tenant.role}</p>
                          <p><strong>Status:</strong> {tenant.status}</p>
                          <p><strong>Start Date:</strong> {new Date(tenant.startDate).toLocaleDateString()}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500">No tenant relationships found</p>
                    )}
                  </div>
                </div>

                {(userData.role !== 'ADMIN') && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h3 className="font-medium text-yellow-800 mb-2">Role Issue Detected</h3>
                    <p className="text-yellow-700 mb-4">
                      {userData.role !== 'ADMIN' 
                        ? `Your database role is "${userData.role}" but you should be an ADMIN.`
                        : `Your database role is ADMIN but there might be a session caching issue.`
                      }
                      Click the button below to fix this.
                    </p>
                    <button
                      onClick={fixRole}
                      disabled={loading}
                      className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 disabled:opacity-50"
                    >
                      {loading ? 'Fixing...' : 'Fix Role to ADMIN'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {message && (
          <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg">
            {message}
          </div>
        )}
      </div>
    </div>
  )
}
