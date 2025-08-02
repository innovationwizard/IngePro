'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Building, 
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'

export default function RevenueAnalyticsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [timeRange, setTimeRange] = useState('30d')

  // Check if user is superuser
  if (session?.user?.role !== 'SUPERUSER') {
    router.push('/dashboard')
    return null
  }

  // Mock revenue data
  const revenueMetrics = {
    mrr: 45600,
    mrrGrowth: 12.5,
    arr: 547200,
    arrGrowth: 15.2,
    totalRevenue: 234500,
    revenueGrowth: 8.7,
    churnRate: 2.3,
    churnChange: -0.5,
    customerCount: 1247,
    customerGrowth: 5.2,
    avgRevenuePerUser: 36.5,
    arpuGrowth: 3.1
  }

  const subscriptionBreakdown = [
    { plan: 'Premium', count: 45, revenue: 22500, percentage: 49.3 },
    { plan: 'Basic', count: 78, revenue: 15600, percentage: 34.2 },
    { plan: 'Trial', count: 12, revenue: 0, percentage: 2.6 },
    { plan: 'Enterprise', count: 8, revenue: 7500, percentage: 16.4 }
  ]

  const monthlyRevenue = [
    { month: 'Jan', revenue: 42000, growth: 5.2 },
    { month: 'Feb', revenue: 43500, growth: 3.6 },
    { month: 'Mar', revenue: 45600, growth: 4.8 },
    { month: 'Apr', revenue: 44200, growth: -3.1 },
    { month: 'May', revenue: 46800, growth: 5.9 },
    { month: 'Jun', revenue: 45600, growth: -2.6 }
  ]

  const topCustomers = [
    { name: 'Constructora del Norte', revenue: 8500, users: 45, status: 'premium' },
    { name: 'Empresa de Construcción Demo', revenue: 3200, users: 23, status: 'basic' },
    { name: 'Ingeniería Avanzada', revenue: 2800, users: 18, status: 'premium' },
    { name: 'Construcciones Modernas', revenue: 2100, users: 15, status: 'basic' },
    { name: 'Proyectos Integrales', revenue: 1800, users: 12, status: 'basic' }
  ]

  const churnData = [
    { month: 'Jan', churn: 2.8, newCustomers: 45 },
    { month: 'Feb', churn: 2.5, newCustomers: 52 },
    { month: 'Mar', churn: 2.3, newCustomers: 48 },
    { month: 'Apr', churn: 2.7, newCustomers: 38 },
    { month: 'May', churn: 2.1, newCustomers: 55 },
    { month: 'Jun', churn: 2.3, newCustomers: 42 }
  ]

  const getGrowthColor = (value: number) => {
    return value >= 0 ? 'text-green-600' : 'text-red-600'
  }

  const getGrowthIcon = (value: number) => {
    return value >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Revenue Analytics</h1>
        <p className="text-gray-600">MRR, churn, growth metrics across all tenants</p>
      </div>

      {/* Time Range Selector */}
      <div className="flex items-center space-x-4">
        <label className="text-sm font-medium text-gray-700">Time Range:</label>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-3 py-1 border border-gray-300 rounded-md text-sm"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="1y">Last year</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Monthly Recurring Revenue</p>
              <p className="text-2xl font-bold text-gray-900">${revenueMetrics.mrr.toLocaleString()}</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
          <div className="flex items-center mt-2">
            {getGrowthIcon(revenueMetrics.mrrGrowth)}
            <span className={`text-sm font-medium ml-1 ${getGrowthColor(revenueMetrics.mrrGrowth)}`}>
              {revenueMetrics.mrrGrowth}%
            </span>
            <span className="text-sm text-gray-500 ml-1">vs last month</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Annual Recurring Revenue</p>
              <p className="text-2xl font-bold text-gray-900">${revenueMetrics.arr.toLocaleString()}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-600" />
          </div>
          <div className="flex items-center mt-2">
            {getGrowthIcon(revenueMetrics.arrGrowth)}
            <span className={`text-sm font-medium ml-1 ${getGrowthColor(revenueMetrics.arrGrowth)}`}>
              {revenueMetrics.arrGrowth}%
            </span>
            <span className="text-sm text-gray-500 ml-1">vs last year</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Churn Rate</p>
              <p className="text-2xl font-bold text-gray-900">{revenueMetrics.churnRate}%</p>
            </div>
            <TrendingDown className="h-8 w-8 text-red-600" />
          </div>
          <div className="flex items-center mt-2">
            {getGrowthIcon(revenueMetrics.churnChange)}
            <span className={`text-sm font-medium ml-1 ${getGrowthColor(revenueMetrics.churnChange)}`}>
              {revenueMetrics.churnChange}%
            </span>
            <span className="text-sm text-gray-500 ml-1">vs last month</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Revenue Per User</p>
              <p className="text-2xl font-bold text-gray-900">${revenueMetrics.avgRevenuePerUser}</p>
            </div>
            <Users className="h-8 w-8 text-purple-600" />
          </div>
          <div className="flex items-center mt-2">
            {getGrowthIcon(revenueMetrics.arpuGrowth)}
            <span className={`text-sm font-medium ml-1 ${getGrowthColor(revenueMetrics.arpuGrowth)}`}>
              {revenueMetrics.arpuGrowth}%
            </span>
            <span className="text-sm text-gray-500 ml-1">vs last month</span>
          </div>
        </div>
      </div>

      {/* Revenue Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Trend */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Revenue Trend</h3>
          <div className="space-y-3">
            {monthlyRevenue.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">{item.month}</span>
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-gray-900">
                    ${item.revenue.toLocaleString()}
                  </span>
                  <div className="flex items-center">
                    {getGrowthIcon(item.growth)}
                    <span className={`text-xs font-medium ml-1 ${getGrowthColor(item.growth)}`}>
                      {item.growth}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Subscription Breakdown */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Subscription Breakdown</h3>
          <div className="space-y-3">
            {subscriptionBreakdown.map((plan, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    plan.plan === 'Premium' ? 'bg-purple-500' :
                    plan.plan === 'Basic' ? 'bg-blue-500' :
                    plan.plan === 'Trial' ? 'bg-yellow-500' : 'bg-green-500'
                  }`}></div>
                  <span className="text-sm font-medium text-gray-900">{plan.plan}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-900">{plan.count} customers</span>
                  <span className="text-sm font-medium text-gray-900">
                    ${plan.revenue.toLocaleString()}
                  </span>
                  <span className="text-sm text-gray-500">{plan.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Customers */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Customers by Revenue</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Users
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monthly Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {topCustomers.map((customer, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      customer.status === 'premium' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {customer.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {customer.users}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ${customer.revenue.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Churn Analysis */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Churn Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Monthly Churn Rate</h4>
            <div className="space-y-2">
              {churnData.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-900">{item.month}</span>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm font-medium text-gray-900">{item.churn}%</span>
                    <span className="text-sm text-gray-500">+{item.newCustomers} new</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Churn Insights</h4>
            <div className="space-y-3">
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="flex items-center">
                  <TrendingDown className="h-4 w-4 text-green-600 mr-2" />
                  <span className="text-sm font-medium text-green-800">Churn rate decreasing</span>
                </div>
                <p className="text-xs text-green-600 mt-1">Down 0.5% from last month</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center">
                  <Users className="h-4 w-4 text-blue-600 mr-2" />
                  <span className="text-sm font-medium text-blue-800">Strong customer acquisition</span>
                </div>
                <p className="text-xs text-blue-600 mt-1">Average 47 new customers/month</p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center">
                  <Activity className="h-4 w-4 text-yellow-600 mr-2" />
                  <span className="text-sm font-medium text-yellow-800">Monitor trial conversions</span>
                </div>
                <p className="text-xs text-yellow-600 mt-1">12 customers in trial period</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center justify-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium">Export Revenue Report</span>
          </button>
          <button className="flex items-center justify-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
            <PieChart className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium">Analyze Churn Patterns</span>
          </button>
          <button className="flex items-center justify-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            <span className="text-sm font-medium">Growth Forecasting</span>
          </button>
        </div>
      </div>
    </div>
  )
} 