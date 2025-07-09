import axios from 'axios'
import type { Loan, AddLoan, EditLoan, LoanStats, LoanPayment } from './Loans'

const url = "http://localhost:45632"

export const getLoans = async (): Promise<Loan[]> => {
  try {
    const res = await axios.get(`${url}/loan`)
    console.log('🔍 Raw loans data from API:', res.data)
    
    // Transform API response to match our Loan interface
    const transformedLoans: Loan[] = res.data.map((apiLoan: Record<string, unknown>) => ({
      loan_id: apiLoan.loan_id as number,
      customer_id: apiLoan.customer_id as number,
      customer_name: `${apiLoan.first_name as string} ${apiLoan.middle_name ? (apiLoan.middle_name as string) + ' ' : ''}${apiLoan.last_name as string}`.trim(),
      loan_amount: apiLoan.loan_amount as number,
      interest_rate: apiLoan.interest as number,
      interest_amount: (apiLoan.gross_receivable as number) - (apiLoan.loan_amount as number), // Calculate interest amount
      notes_receivable: apiLoan.gross_receivable as number,
      balance: (apiLoan.overall_balance as number) || (apiLoan.balance as number), // Use overall_balance (calculated from receipts) or fallback to balance
      penalty: apiLoan.penalty as number,
      status: apiLoan.status as 'Active' | 'Completed' | 'Overdue' | 'Pending' | 'Cancelled',
      start_date: apiLoan.loan_start as string,
      due_date: apiLoan.loan_end as string,
      created_at: apiLoan.created_at as string,
      updated_at: apiLoan.updated_at as string,
      payment_schedule: 'Monthly',
      terms_months: apiLoan.months as number
    }))
    
    return transformedLoans
  } catch (err) {
    console.error("Failed to fetch loans: ", err)
    throw err
  }
}

export const getLoanById = async (loanId: number): Promise<Loan | null> => {
  try {
    const res = await axios.get(`${url}/loan/${loanId}`)
    
    if (!res.data) return null
    
    // Transform API response to match our Loan interface
    const apiLoan = res.data as Record<string, unknown>
    const transformedLoan: Loan = {
      loan_id: apiLoan.loan_id as number,
      customer_id: apiLoan.customer_id as number,
      customer_name: `${apiLoan.first_name as string} ${apiLoan.middle_name ? (apiLoan.middle_name as string) + ' ' : ''}${apiLoan.last_name as string}`.trim(),
      loan_amount: apiLoan.loan_amount as number,
      interest_rate: apiLoan.interest as number,
      interest_amount: (apiLoan.gross_receivable as number) - (apiLoan.loan_amount as number),
      notes_receivable: apiLoan.gross_receivable as number,
      balance: (apiLoan.overall_balance as number) || (apiLoan.balance as number),
      penalty: apiLoan.penalty as number,
      status: apiLoan.status as 'Active' | 'Completed' | 'Overdue' | 'Pending' | 'Cancelled',
      start_date: apiLoan.loan_start as string,
      due_date: apiLoan.loan_end as string,
      created_at: apiLoan.created_at as string,
      updated_at: apiLoan.updated_at as string,
      payment_schedule: 'Monthly',
      terms_months: apiLoan.months as number
    }
    
    return transformedLoan
  } catch (err) {
    console.error("Failed to fetch loan: ", err)
    return null
  }
}

export const addLoan = async (loanData: AddLoan): Promise<void> => {
  try {
    // Calculate required values for the backend
    const interestAmount = (loanData.loan_amount * loanData.interest_rate) / 100
    const grossReceivable = loanData.loan_amount + interestAmount
    const paydayPayment = loanData.terms_months > 0 ? grossReceivable / loanData.terms_months : 0
    const currentDate = new Date().toISOString().split('T')[0]
    
    // Transform our interface to match API expectations
    const apiData = {
      customer_id: loanData.customer_id,
      loan_start: loanData.start_date,
      months: loanData.terms_months,
      loan_end: loanData.due_date,
      transaction_date: currentDate,
      loan_amount: loanData.loan_amount,
      interest: loanData.interest_rate,
      gross_receivable: grossReceivable,
      payday_payment: paydayPayment,
      service: 0, // Default service fee
      balance: grossReceivable, // Initial balance is the full amount
      adjustment: 0, // No initial adjustments
      overall_balance: grossReceivable, // Initial overall balance
      penalty: 0 // No initial penalty
    }
    
    await axios.post(`${url}/loan`, apiData)
  } catch (err) {
    console.error("Failed to add loan: ", err)
    throw err
  }
}

export const editLoan = async (loanData: EditLoan): Promise<Loan> => {
  try {
    // Transform our interface to match API expectations
    const apiData = {
      customer_id: loanData.customer_id,
      loan_amount: loanData.loan_amount,
      interest: loanData.interest_rate,
      months: loanData.terms_months,
      loan_start: loanData.start_date,
      loan_end: loanData.due_date,
      status: loanData.status,
      payment_schedule: loanData.payment_schedule
    }
    
    const res = await axios.put(`${url}/loan/${loanData.loan_id}`, apiData)
    
    const apiLoan = res.data as Record<string, unknown>
    const transformedLoan: Loan = {
      loan_id: apiLoan.loan_id as number,
      customer_id: apiLoan.customer_id as number,
      customer_name: `${apiLoan.first_name as string} ${apiLoan.middle_name ? (apiLoan.middle_name as string) + ' ' : ''}${apiLoan.last_name as string}`.trim(),
      loan_amount: apiLoan.loan_amount as number,
      interest_rate: apiLoan.interest as number,
      interest_amount: (apiLoan.gross_receivable as number) - (apiLoan.loan_amount as number),
      notes_receivable: apiLoan.gross_receivable as number,
      balance: apiLoan.balance as number,
      penalty: apiLoan.penalty as number,
      status: apiLoan.status as 'Active' | 'Completed' | 'Overdue' | 'Pending' | 'Cancelled',
      start_date: apiLoan.loan_start as string,
      due_date: apiLoan.loan_end as string,
      created_at: apiLoan.created_at as string,
      updated_at: apiLoan.updated_at as string,
      payment_schedule: loanData.payment_schedule,
      terms_months: apiLoan.months as number
    }
    
    return transformedLoan
  } catch (err) {
    console.error("Failed to edit loan: ", err)
    throw err
  }
}

export const deleteLoan = async (loanId: number): Promise<void> => {
  try {
    await axios.delete(`${url}/loan/${loanId}`)
  } catch (err) {
    console.error("Failed to delete loan: ", err)
    throw err
  }
}

export const getLoanStats = async (): Promise<LoanStats> => {
  try {
    // Calculate stats directly from loan data since no /loan/stats endpoint exists
    const loans = await getLoans()
    const calculatedStats = calculateStatsFromLoans(loans)
    return calculatedStats
  } catch (err) {
    console.error("Failed to calculate loan stats: ", err)
    throw err
  }
}

// Helper function to calculate stats from loans data
const calculateStatsFromLoans = (loans: Loan[]): LoanStats => {
  const stats: LoanStats = {
    total_loans: loans.length,
    active_loans: loans.filter(l => ['active', 'partial'].includes(l.status.toLowerCase())).length, // Include partial loans as active
    completed_loans: loans.filter(l => l.status.toLowerCase() === 'completed').length,
    overdue_loans: loans.filter(l => l.status.toLowerCase() === 'overdue').length,
    pending_loans: loans.filter(l => l.status.toLowerCase() === 'pending').length,
    cancelled_loans: loans.filter(l => l.status.toLowerCase() === 'cancelled').length,
    total_amount_disbursed: loans.reduce((sum, loan) => sum + loan.loan_amount, 0),
    total_outstanding_balance: loans.reduce((sum, loan) => {
      // Completed loans should have 0 balance regardless of what's in the database
      const effectiveBalance = loan.status.toLowerCase() === 'completed' ? 0 : loan.balance
      return sum + effectiveBalance
    }, 0),
    total_interest_earned: loans.reduce((sum, loan) => sum + loan.interest_amount, 0),
    total_penalties: loans.reduce((sum, loan) => sum + loan.penalty, 0),
    collection_rate: 0 
  }
  
  // Calculate collection rate
  const totalExpected = stats.total_amount_disbursed + stats.total_interest_earned
  const totalCollected = totalExpected - stats.total_outstanding_balance
  stats.collection_rate = totalExpected > 0 ? (totalCollected / totalExpected) * 100 : 0
  
  return stats
}

export const recordLoanPayment = async (payment: Omit<LoanPayment, 'payment_id' | 'created_at'>): Promise<LoanPayment> => {
  try {
    const res = await axios.post<LoanPayment>(`${url}/loan/payment`, payment)
    return res.data
  } catch (err) {
    console.error("Failed to record loan payment: ", err)
    throw err
  }
}

export const recalculateAllLoanBalances = async (): Promise<string> => {
  try {
    const res = await axios.post<string>(`${url}/loan/recalculate-balances`)
    return res.data
  } catch (err) {
    console.error("Failed to recalculate loan balances: ", err)
    throw err
  }
}

