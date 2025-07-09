import React, { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, Users, DollarSign, AlertCircle, RefreshCw } from 'lucide-react'
import MonthlyTrendsChart from '../../components/charts/MonthlyTrendsChart'
import { getDashboardData, getSystemStatus } from '../../utils/DataType/DashboardServer'
import type { DashboardStats, SystemStatus } from '../../utils/DataType/DashboardServer'
import { useSettings } from '../../contexts/SettingsContext'

export default function Dashboard() {
  const { formatCurrency, formatDate } = useSettings()
  const [dashboardData, setDashboardData] = useState<DashboardStats | null>(null)
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeFilter, setTimeFilter] = useState<'month' | 'week' | 'day'>('month')

  const fetchDashboardData = async (filter: 'month' | 'week' | 'day' = timeFilter) => {
    try {
      setLoading(true)
      setError(null)
      
      const [data, status] = await Promise.all([
        getDashboardData(filter),
        getSystemStatus()
      ])

      console.log(data?.total_collected)
      
      setDashboardData(data)
      setSystemStatus(status)
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err)
      setError(err instanceof Error ? err.message : 'Failed to connect to server')
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (filter: 'month' | 'week' | 'day') => {
    setTimeFilter(filter)
    fetchDashboardData(filter)
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])



  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  return (
    <>
      {/* Connection Error Message */}
      {(error || (systemStatus && systemStatus.api_status === 'error')) && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-red-700 text-sm font-medium mb-2">
              Cannot connect to server
            </p>
            <p className="text-red-600 text-sm mb-3">
              {error || 'Please make sure the server is running on http://localhost:45632'}
            </p>
            <button 
              onClick={() => fetchDashboardData()}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Connecting...' : 'Try Again'}
            </button>
          </div>
        </div>
      )}

      {/* Dashboard Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Dashboard
        </h1>
        <p className="text-gray-600">
          Welcome back, LendingAdmin. Here's what's happening with your lending system today.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Loaned */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">
                {loading ? '...' : formatCurrency(dashboardData?.total_loans_amount || 0)}
              </p>
              <p className="text-gray-600 text-sm">Total Loaned</p>
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <TrendingUp className="w-4 h-4 text-blue-500 mr-1" />
            <span className="text-blue-600 text-sm font-medium">
              {dashboardData?.total_loans || 0} loans
            </span>
          </div>
        </div>

        {/* Total Customers */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">
                {loading ? '...' : dashboardData?.total_customers || 0}
              </p>
              <p className="text-gray-600 text-sm">Total Customers</p>
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600 text-sm font-medium">
              {dashboardData?.active_customers || 0} active
            </span>
          </div>
        </div>

        {/* Active Loans */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">
                {loading ? '...' : dashboardData?.active_loans || 0}
              </p>
              <p className="text-gray-600 text-sm">Active Loans</p>
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className="text-purple-600 text-sm font-medium">
              {formatCurrency(dashboardData?.total_outstanding || 0)} outstanding
            </span>
          </div>
        </div>

        {/* Total Earned */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">
                {loading ? '...' : formatCurrency(dashboardData?.total_collected || 0)}
              </p>
              <p className="text-gray-600 text-sm">Total Earned</p>
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className="text-orange-600 text-sm font-medium">
              {formatPercentage(dashboardData?.collection_rate || 0)} collection rate
            </span>
          </div>
        </div>
      </div>

      {/* Monthly Trends Chart */}
      <div className="mb-8">
        <MonthlyTrendsChart 
          data={dashboardData?.monthly_trends || []} 
          loading={loading}
          onFilterChange={handleFilterChange}
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Loans
          </h3>
          <div className="space-y-4">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                      <div className="h-6 bg-gray-200 rounded w-16"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : dashboardData?.recent_loans.length ? (
              dashboardData.recent_loans.slice(0, 5).map((loan) => (
                <div key={loan.loan_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">
                      Loan #{loan.loan_id}
                    </p>
                    <p className="text-sm text-gray-600">
                      {loan.customer_name} - {formatCurrency(loan.loan_amount)}
                    </p>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    loan.status.toLowerCase() === 'completed' 
                      ? 'bg-green-100 text-green-800'
                      : loan.status.toLowerCase() === 'active' || loan.status.toLowerCase() === 'partial'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {loan.status}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No recent loans</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            System Status
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Database Connection</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                systemStatus?.database_connected 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {systemStatus?.database_connected ? 'Connected' : 'Offline'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">API Status</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                systemStatus?.api_status === 'online' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {systemStatus?.api_status === 'online' ? 'Online' : 'Error'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Active Loans</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {dashboardData?.active_loans || 0} loans
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Last Update</span>
              <span className="text-gray-600 text-sm">
                {systemStatus?.last_sync 
                  ? formatDate(systemStatus.last_sync)
                  : 'Never'
                }
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
} 