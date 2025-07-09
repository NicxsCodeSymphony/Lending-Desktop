import axios from 'axios'
import { getLoans } from './LoanServer'
import { getCustomers } from './CustomerServer'
import { fetchReceipt } from './ReceiptServer'
import type { Loan } from './Loans'
import type { Receipts } from './Receipt'

const url = "http://localhost:45632"

export interface DashboardStats {
  // Financial Stats
  total_loans_amount: number
  total_interest_earned: number
  total_collected: number
  total_outstanding: number
  total_penalties: number
  collection_rate: number
  
  // Loan Stats
  total_loans: number
  active_loans: number
  completed_loans: number
  overdue_loans: number
  pending_loans: number
  
  // Customer Stats
  total_customers: number
  active_customers: number
  
  // Recent Activity
  recent_loans: Loan[]
  recent_payments: Receipts[]
  
  // Monthly trends for chart
  monthly_trends: MonthlyTrend[]
}

export interface MonthlyTrend {
  period: string // Can be month, week, or day
  year: number
  loans_disbursed: number
  amount_disbursed: number
  collections: number
  outstanding: number
}

export interface SystemStatus {
  database_connected: boolean
  api_status: 'online' | 'offline' | 'error'
  last_sync: string
}

export const getDashboardData = async (timeFilter: 'month' | 'week' | 'day' = 'month'): Promise<DashboardStats> => {
  try {
    // Fetch all required data in parallel
    const [loans, customers, receipts] = await Promise.all([
      getLoans(),
      getCustomers(),
      fetchReceipt()
    ])

    // Calculate financial statistics
    const totalLoansAmount = loans.reduce((sum, loan) => sum + loan.loan_amount, 0)
    const totalInterestEarned = loans.reduce((sum, loan) => sum + loan.interest_amount, 0)
    const totalOutstanding = loans.reduce((sum, loan) => sum + (loan.balance || 0), 0)
    const totalPenalties = loans.reduce((sum, loan) => sum + loan.penalty, 0)
    
    // Calculate total collected directly from actual payments (receipts)
    const totalCollected = receipts.reduce((sum, receipt) => {
      return sum + (receipt.amount || 0)
    }, 0)
    
    const totalExpected = totalLoansAmount + totalInterestEarned
    const collectionRate = totalExpected > 0 ? (totalCollected / totalExpected) * 100 : 0

    // Calculate loan statistics
    const totalLoans = loans.length
    const activeLoans = loans.filter(l => ['active', 'partial'].includes(l.status.toLowerCase())).length
    const completedLoans = loans.filter(l => l.status.toLowerCase() === 'completed').length
    const overdueLoans = loans.filter(l => l.status.toLowerCase() === 'overdue').length
    const pendingLoans = loans.filter(l => l.status.toLowerCase() === 'pending').length

    // Calculate customer statistics
    const activeCustomers = customers.filter(c => c.status.toLowerCase() !== 'deleted')
    const totalCustomers = activeCustomers.length
    const activeCustomersCount = activeCustomers.filter(c => c.status.toLowerCase() === 'active').length

    // Get recent activity (last 5 loans and payments)
    const recentLoans = loans
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)

    const recentPayments = receipts
      .filter(r => r.amount > 0)
      .sort((a, b) => new Date(b.transaction_time).getTime() - new Date(a.transaction_time).getTime())
      .slice(0, 5)

    // Generate trends based on the selected time filter
    const monthlyTrends = generateTrends(loans, receipts, timeFilter)

    return {
      total_loans_amount: totalLoansAmount,
      total_interest_earned: totalInterestEarned,
      total_collected: totalCollected,
      total_outstanding: totalOutstanding,
      total_penalties: totalPenalties,
      collection_rate: collectionRate,
      total_loans: totalLoans,
      active_loans: activeLoans,
      completed_loans: completedLoans,
      overdue_loans: overdueLoans,
      pending_loans: pendingLoans,
      total_customers: totalCustomers,
      active_customers: activeCustomersCount,
      recent_loans: recentLoans,
      recent_payments: recentPayments,
      monthly_trends: monthlyTrends
    }
  } catch (err) {
    console.error("Failed to fetch dashboard data: ", err)
    throw err
  }
}

const generateTrends = (loans: Loan[], receipts: Receipts[], timeFilter: 'month' | 'week' | 'day'): MonthlyTrend[] => {
  switch (timeFilter) {
    case 'day':
      return generateDailyTrends(loans, receipts)
    case 'week':
      return generateWeeklyTrends(loans, receipts)
    case 'month':
    default:
      return generateMonthlyTrends(loans, receipts)
  }
}

const generateMonthlyTrends = (loans: Loan[], receipts: Receipts[]): MonthlyTrend[] => {
  const trends: MonthlyTrend[] = []
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1 // 1-12
  
  // Generate data from January of this year to current month
  for (let monthNum = 1; monthNum <= currentMonth; monthNum++) {
    const targetDate = new Date(currentYear, monthNum - 1, 1)
    const month = targetDate.toLocaleDateString('en-US', { month: 'short' })

    // Calculate loans disbursed in this month
    const monthLoans = loans.filter(loan => {
      const loanDate = new Date(loan.start_date)
      return loanDate.getFullYear() === currentYear && 
             loanDate.getMonth() + 1 === monthNum
    })

    const loansDisbursed = monthLoans.length
    const amountDisbursed = monthLoans.reduce((sum, loan) => sum + loan.loan_amount, 0)

    // Calculate collections in this month
    const monthPayments = receipts.filter(receipt => {
      const paymentDate = new Date(receipt.transaction_time)
      return paymentDate.getFullYear() === currentYear && 
             paymentDate.getMonth() + 1 === monthNum &&
             receipt.amount > 0
    })

    const collections = monthPayments.reduce((sum, payment) => sum + payment.amount, 0)

    // Calculate outstanding at end of month (simplified - current outstanding for latest month)
    const outstanding = monthNum === currentMonth ? loans.reduce((sum, loan) => sum + (loan.balance || 0), 0) : 0

    trends.push({
      period: month,
      year: currentYear,
      loans_disbursed: loansDisbursed,
      amount_disbursed: amountDisbursed,
      collections,
      outstanding
    })
  }

  return trends
}

const generateWeeklyTrends = (loans: Loan[], receipts: Receipts[]): MonthlyTrend[] => {
  const trends: MonthlyTrend[] = []
  const now = new Date()
  const currentYear = now.getFullYear()
  
  // Generate data for the past 12 weeks
  for (let i = 11; i >= 0; i--) {
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - (i * 7) - weekStart.getDay()) // Start of week (Sunday)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6) // End of week (Saturday)
    
    const weekLabel = `Week ${Math.ceil((weekStart.getDate() + weekStart.getDay()) / 7)} ${weekStart.toLocaleDateString('en-US', { month: 'short' })}`

    // Calculate loans disbursed in this week
    const weekLoans = loans.filter(loan => {
      const loanDate = new Date(loan.start_date)
      return loanDate >= weekStart && loanDate <= weekEnd
    })

    const loansDisbursed = weekLoans.length
    const amountDisbursed = weekLoans.reduce((sum, loan) => sum + loan.loan_amount, 0)

    // Calculate collections in this week
    const weekPayments = receipts.filter(receipt => {
      const paymentDate = new Date(receipt.transaction_time)
      return paymentDate >= weekStart && paymentDate <= weekEnd && receipt.amount > 0
    })

    const collections = weekPayments.reduce((sum, payment) => sum + payment.amount, 0)

    // Calculate outstanding at end of week (simplified - current outstanding for latest week)
    const outstanding = i === 0 ? loans.reduce((sum, loan) => sum + (loan.balance || 0), 0) : 0

    trends.push({
      period: weekLabel,
      year: currentYear,
      loans_disbursed: loansDisbursed,
      amount_disbursed: amountDisbursed,
      collections,
      outstanding
    })
  }

  return trends
}

const generateDailyTrends = (loans: Loan[], receipts: Receipts[]): MonthlyTrend[] => {
  const trends: MonthlyTrend[] = []
  const now = new Date()
  const currentYear = now.getFullYear()
  
  // Generate data for the past 30 days
  for (let i = 29; i >= 0; i--) {
    const targetDate = new Date()
    targetDate.setDate(targetDate.getDate() - i)
    
    const dayLabel = targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

    // Calculate loans disbursed on this day
    const dayLoans = loans.filter(loan => {
      const loanDate = new Date(loan.start_date)
      return loanDate.toDateString() === targetDate.toDateString()
    })

    const loansDisbursed = dayLoans.length
    const amountDisbursed = dayLoans.reduce((sum, loan) => sum + loan.loan_amount, 0)

    // Calculate collections on this day
    const dayPayments = receipts.filter(receipt => {
      const paymentDate = new Date(receipt.transaction_time)
      return paymentDate.toDateString() === targetDate.toDateString() && receipt.amount > 0
    })

    const collections = dayPayments.reduce((sum, payment) => sum + payment.amount, 0)

    // Calculate outstanding at end of day (simplified - current outstanding for latest day)
    const outstanding = i === 0 ? loans.reduce((sum, loan) => sum + (loan.balance || 0), 0) : 0

    trends.push({
      period: dayLabel,
      year: currentYear,
      loans_disbursed: loansDisbursed,
      amount_disbursed: amountDisbursed,
      collections,
      outstanding
    })
  }

  return trends
}

export const getSystemStatus = async (): Promise<SystemStatus> => {
  try {
    // Test API connectivity
    await axios.get(`${url}/loan`, { timeout: 5000 })
    
    return {
      database_connected: true,
      api_status: 'online',
      last_sync: new Date().toISOString()
    }
  } catch (err) {
    return {
      database_connected: false,
      api_status: 'error',
      last_sync: new Date().toISOString()
    }
  }
} 