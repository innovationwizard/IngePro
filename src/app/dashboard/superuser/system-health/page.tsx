'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { 
  Activity, 
  Server, 
  Database, 
  Globe, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Zap
} from 'lucide-react'

export default function SystemHealthPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [systemMetrics, setSystemMetrics] = useState({
    uptime: 99.9,
    responseTime: 245,
    cpuUsage: 67,
    memoryUsage: 78,
    diskUsage: 45,
    activeConnections: 1247,
    databaseHealth: 'healthy' as 'healthy' | 'warning' | 'critical',
    lastUpdated: new Date()
  })

  const [alerts, setAlerts] = useState([
    {
      id: 1,
      level: 'critical',
      message: 'Database connection pool at 95% capacity',
      timestamp: new Date(Date.now() - 300000),
      resolved: false
    },
    {
      id: 2,
      level: 'warning',
      message: 'High CPU usage on web-server-01',
      timestamp: new Date(Date.now() - 600000),
      resolved: false
    },
    {
      id: 3,
      level: 'info',
      message: 'Scheduled maintenance completed successfully',
      timestamp: new Date(Date.now() - 3600000),
      resolved: true
    }
  ])

  // Check if user is superuser
  if (session?.user?.role !== 'SUPERUSER') {
    router.push('/dashboard')
    return null
  }

  // ETag-based polling with jitter
  useEffect(() => {
    let etag: string | null = null
    let lastPollTime = 0
    
    const pollSystemHealth = async () => {
      try {
        const now = Date.now()
        const timeSinceLastPoll = now - lastPollTime
        
        // Add ±10% jitter to 300s base interval
        const baseInterval = 300000 // 300 seconds
        const jitter = baseInterval * (0.9 + Math.random() * 0.2) // ±10% jitter
        const minInterval = 270000 // 270 seconds (90% of 300s)
        
        if (timeSinceLastPoll < minInterval) {
          return // Too early to poll
        }
        
        const headers: Record<string, string> = {}
        if (etag) {
          headers['If-None-Match'] = etag
        }
        
        const response = await fetch('/api/system-health', { headers })
        
        if (response.status === 304) {
          // No changes, metrics are still fresh
          console.log('System health: No changes (304)')
          return
        }
        
        if (response.ok) {
          const newEtag = response.headers.get('etag')
          if (newEtag) {
            etag = newEtag
          }
          
          const data = await response.json()
          setSystemMetrics({
            uptime: data.uptime,
            responseTime: data.responseTime,
            cpuUsage: data.cpuUsage,
            memoryUsage: data.memoryUsage,
            diskUsage: data.diskUsage,
            activeConnections: data.activeConnections,
            databaseHealth: data.databaseHealth,
            lastUpdated: new Date(data.lastComputed)
          })
          
          lastPollTime = now
          console.log('System health: Updated from server')
        }
      } catch (error) {
        console.error('Failed to fetch system health:', error)
      }
    }
    
    // Initial poll
    pollSystemHealth()
    
    // Poll every 300 seconds with jitter
    const interval = setInterval(pollSystemHealth, 300000)
    
    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value >= thresholds.critical) return 'text-red-600'
    if (value >= thresholds.warning) return 'text-yellow-600'
    return 'text-green-600'
  }

  const getStatusIcon = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value >= thresholds.critical) return <AlertTriangle className="h-5 w-5 text-red-600" />
    if (value >= thresholds.warning) return <AlertTriangle className="h-5 w-5 text-yellow-600" />
    return <CheckCircle className="h-5 w-5 text-green-600" />
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">System Health Monitor</h1>
        <p className="text-gray-600">Real-time system performance and infrastructure metrics</p>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">System Uptime</p>
              <p className="text-2xl font-bold text-green-600">{systemMetrics.uptime}%</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Response Time</p>
              <p className={`text-2xl font-bold ${getStatusColor(systemMetrics.responseTime, { warning: 300, critical: 500 })}`}>
                {systemMetrics.responseTime}ms
              </p>
            </div>
            <Clock className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">CPU Usage</p>
              <p className={`text-2xl font-bold ${getStatusColor(systemMetrics.cpuUsage, { warning: 80, critical: 90 })}`}>
                {systemMetrics.cpuUsage}%
              </p>
            </div>
            <Server className="h-8 w-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Memory Usage</p>
              <p className={`text-2xl font-bold ${getStatusColor(systemMetrics.memoryUsage, { warning: 85, critical: 95 })}`}>
                {systemMetrics.memoryUsage}%
              </p>
            </div>
            <Database className="h-8 w-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Database Health</p>
              <p className={`text-2xl font-bold ${
                systemMetrics.databaseHealth === 'critical' ? 'text-red-600' :
                systemMetrics.databaseHealth === 'warning' ? 'text-yellow-600' :
                'text-green-600'
              }`}>
                {systemMetrics.databaseHealth === 'critical' ? 'Critical' :
                 systemMetrics.databaseHealth === 'warning' ? 'Warning' :
                 'Healthy'}
              </p>
            </div>
            {systemMetrics.databaseHealth === 'critical' ? (
              <AlertTriangle className="h-8 w-8 text-red-600" />
            ) : systemMetrics.databaseHealth === 'warning' ? (
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            ) : (
              <CheckCircle className="h-8 w-8 text-green-600" />
            )}
          </div>
        </div>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Metrics */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Disk Usage</span>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${systemMetrics.diskUsage}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium">{systemMetrics.diskUsage}%</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Active Connections</span>
              <span className="text-sm font-medium">{systemMetrics.activeConnections}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Error Rate</span>
              <span className="text-sm font-medium text-red-600">{(systemMetrics.errorRate * 100).toFixed(2)}%</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Last Updated</span>
              <span className="text-sm font-medium">
                {systemMetrics.lastUpdated.toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>

        {/* Infrastructure Status */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Infrastructure Status</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Web Server Cluster</span>
              </div>
              <span className="text-sm text-green-600">Healthy</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Database Cluster</span>
              </div>
              <span className="text-sm text-green-600">Healthy</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium">Cache Layer</span>
              </div>
              <span className="text-sm text-yellow-600">Warning</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">CDN</span>
              </div>
              <span className="text-sm text-green-600">Healthy</span>
            </div>
          </div>
        </div>
      </div>

      {/* Active Alerts */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Alerts</h3>
        <div className="space-y-3">
          {(alerts || []).filter(alert => !alert.resolved).map((alert) => (
            <div 
              key={alert.id}
              className={`flex items-center justify-between p-3 rounded-lg ${
                alert.level === 'critical' ? 'bg-red-50' : 
                alert.level === 'warning' ? 'bg-yellow-50' : 'bg-blue-50'
              }`}
            >
              <div className="flex items-center space-x-2">
                <AlertTriangle className={`h-4 w-4 ${
                  alert.level === 'critical' ? 'text-red-600' : 
                  alert.level === 'warning' ? 'text-yellow-600' : 'text-blue-600'
                }`} />
                <span className="text-sm font-medium">{alert.message}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500">
                  {alert.timestamp.toLocaleTimeString()}
                </span>
                <button className="text-xs text-blue-600 hover:text-blue-800">
                  Resolve
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center justify-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
            <Zap className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium">Restart Services</span>
          </button>
          <button className="flex items-center justify-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
            <Database className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium">Backup Database</span>
          </button>
          <button className="flex items-center justify-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
            <Globe className="h-5 w-5 text-purple-600" />
            <span className="text-sm font-medium">Check CDN Status</span>
          </button>
        </div>
      </div>
    </div>
  )
} 