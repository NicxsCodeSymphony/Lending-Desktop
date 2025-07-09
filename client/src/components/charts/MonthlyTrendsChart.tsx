import React, { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { MonthlyTrend } from '../../utils/DataType/DashboardServer'

interface MonthlyTrendsChartProps {
  data: MonthlyTrend[]
  loading?: boolean
  onFilterChange?: (filter: 'month' | 'week' | 'day') => void
}

export default function MonthlyTrendsChart({ data, loading, onFilterChange }: MonthlyTrendsChartProps) {
  const [selectedFilter, setSelectedFilter] = useState<'month' | 'week' | 'day'>('month')

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const formatTooltipValue = (value: number, name: string) => {
    switch (name) {
      case 'loans_disbursed':
        return [value, 'Loans Disbursed']
      case 'amount_disbursed':
        return [formatCurrency(value), 'Amount Disbursed']
      case 'collections':
        return [formatCurrency(value), 'Collections']
      default:
        return [formatCurrency(value), name]
    }
  }

  const handleFilterChange = (filter: 'month' | 'week' | 'day') => {
    setSelectedFilter(filter)
    onFilterChange?.(filter)
  }

  const getChartTitle = () => {
    switch (selectedFilter) {
      case 'day': return 'Daily Lending Trends'
      case 'week': return 'Weekly Lending Trends'
      case 'month': return 'Monthly Lending Trends'
      default: return 'Lending Trends'
    }
  }

  const getChartDescription = () => {
    switch (selectedFilter) {
      case 'day': return 'Track loan disbursements and collections over the past 30 days'
      case 'week': return 'Track loan disbursements and collections over the past 12 weeks'
      case 'month': return 'Track loan disbursements and collections from January to current month'
      default: return 'Track lending trends'
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-100 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {getChartTitle()}
            </h3>
            <p className="text-sm text-gray-600">
              {getChartDescription()}
            </p>
          </div>
          
          {/* Filter Buttons */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            {(['month', 'week', 'day'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => handleFilterChange(filter)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                  selectedFilter === filter
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="period" 
              tick={{ fontSize: 12 }}
              stroke="#6b7280"
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              stroke="#6b7280"
              tickFormatter={formatCurrency}
            />
            <Tooltip 
              formatter={formatTooltipValue}
              labelStyle={{ color: '#374151' }}
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Legend 
              wrapperStyle={{ fontSize: '14px' }}
            />
            <Line
              type="monotone"
              dataKey="amount_disbursed"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ r: 4, fill: '#3b82f6' }}
              name="Amount Disbursed"
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="collections"
              stroke="#10b981"
              strokeWidth={3}
              dot={{ r: 4, fill: '#10b981' }}
              name="Collections"
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
} 