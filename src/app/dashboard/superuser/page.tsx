'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { 
  Activity, 
  Users, 
  Building, 
  Database, 
  BarChart3, 
  Shield, 
  Bug, 
  Settings,
  TrendingUp,
  AlertTriangle,
  Eye,
  Zap,
  Globe,
  FileText,
  Lock,
  Monitor
} from 'lucide-react'

export default function SuperUserPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('system')

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

  const systemManagementFeatures = [
    {
      title: 'System Health Monitor',
      description: 'Real-time system performance, uptime, and infrastructure metrics',
      icon: Activity,
      href: '/dashboard/superuser/system-health',
      color: 'bg-green-500',
    },
    {
      title: 'Multi-tenant Oversight',
      description: 'View all companies, users, and projects across all tenants',
      icon: Building,
      href: '/dashboard/superuser/tenants',
      color: 'bg-blue-500',
    },
    {
      title: 'Database Operations',
      description: 'Direct data fixes, migrations, and performance tuning',
      icon: Database,
      href: '/dashboard/superuser/database',
      color: 'bg-purple-500',
    },
    {
      title: 'Application Monitoring',
      description: 'Error logs, performance metrics, and usage analytics',
      icon: Monitor,
      href: '/dashboard/superuser/monitoring',
      color: 'bg-orange-500',
    },
    {
      title: 'Feature Flags',
      description: 'Enable/disable features per tenant for testing',
      icon: Zap,
      href: '/dashboard/superuser/feature-flags',
      color: 'bg-yellow-500',
    },
  ]

  const businessIntelligenceFeatures = [
    {
      title: 'Revenue Analytics',
      description: 'MRR, churn, growth metrics across all tenants',
      icon: TrendingUp,
      href: '/dashboard/superuser/revenue',
      color: 'bg-green-600',
    },
    {
      title: 'Usage Patterns',
      description: 'Feature adoption, user engagement, performance bottlenecks',
      icon: BarChart3,
      href: '/dashboard/superuser/usage',
      color: 'bg-blue-600',
    },
    {
      title: 'Support Queue',
      description: 'All tenant support requests in unified dashboard',
      icon: Users,
      href: '/dashboard/superuser/support',
      color: 'bg-red-500',
    },
    {
      title: 'Onboarding Pipeline',
      description: 'Track signups, conversion rates, drop-off points',
      icon: FileText,
      href: '/dashboard/superuser/onboarding',
      color: 'bg-indigo-500',
    },
  ]

  const developmentToolsFeatures = [
    {
      title: 'Live Debugging',
      description: 'Access production logs, user sessions for support',
      icon: Bug,
      href: '/dashboard/superuser/debug',
      color: 'bg-red-600',
    },
    {
      title: 'A/B Testing',
      description: 'Deploy features to subset of tenants',
      icon: Eye,
      href: '/dashboard/superuser/ab-testing',
      color: 'bg-purple-600',
    },
    {
      title: 'Data Export',
      description: 'Extract anonymized data for analysis/ML training',
      icon: FileText,
      href: '/dashboard/superuser/data-export',
      color: 'bg-gray-600',
    },
    {
      title: 'System Health',
      description: 'AWS costs, database performance, infrastructure alerts',
      icon: Activity,
      href: '/dashboard/superuser/infrastructure',
      color: 'bg-green-600',
    },
  ]

  const securityFeatures = [
    {
      title: 'Audit Trails',
      description: 'All administrative actions logged',
      icon: Shield,
      href: '/dashboard/superuser/audit',
      color: 'bg-blue-600',
    },
    {
      title: 'User Impersonation',
      description: 'Debug issues as specific users (with logging)',
      icon: Users,
      href: '/dashboard/superuser/impersonation',
      color: 'bg-orange-600',
    },
    {
      title: 'Data Privacy',
      description: 'GDPR compliance tools, data deletion requests',
      icon: Lock,
      href: '/dashboard/superuser/privacy',
      color: 'bg-red-600',
    },
    {
      title: 'Security Monitoring',
      description: 'Failed login attempts, suspicious activity',
      icon: AlertTriangle,
      href: '/dashboard/superuser/security',
      color: 'bg-red-500',
    },
  ]

  const tabs = [
    { id: 'system', name: 'System Management', icon: Settings },
    { id: 'business', name: 'Business Intelligence', icon: TrendingUp },
    { id: 'development', name: 'Development Tools', icon: Bug },
    { id: 'security', name: 'Security & Compliance', icon: Shield },
  ]

  const getFeaturesByTab = (tabId: string) => {
    switch (tabId) {
      case 'system':
        return systemManagementFeatures
      case 'business':
        return businessIntelligenceFeatures
      case 'development':
        return developmentToolsFeatures
      case 'security':
        return securityFeatures
      default:
        return systemManagementFeatures
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">SuperUser Dashboard</h1>
        <p className="text-gray-600">System-wide administration and development tools</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center">
            <Building className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Active Tenants</p>
              <p className="text-2xl font-bold text-gray-900">24</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">1,247</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center">
            <Activity className="h-8 w-8 text-orange-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">System Uptime</p>
              <p className="text-2xl font-bold text-gray-900">99.9%</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-red-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Active Alerts</p>
              <p className="text-2xl font-bold text-gray-900">3</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="mr-2 h-4 w-4" />
                {tab.name}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {getFeaturesByTab(activeTab).map((feature) => {
          const IconComponent = feature.icon
          return (
            <div
              key={feature.title}
              className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push(feature.href)}
            >
              <div className="flex items-center space-x-3">
                <div className={`p-3 rounded-lg ${feature.color}`}>
                  <IconComponent className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{feature.title}</h3>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Priority Alerts */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
          <h3 className="text-sm font-medium text-yellow-800">Priority Items</h3>
        </div>
        <div className="mt-2 text-sm text-yellow-700">
          <ul className="list-disc list-inside space-y-1">
            <li>Error monitoring - 3 critical errors in production</li>
            <li>Revenue dashboard - Monthly metrics need review</li>
            <li>Support tools - 5 pending customer requests</li>
            <li>Development tools - New feature deployment pending</li>
          </ul>
        </div>
      </div>
    </div>
  )
} 