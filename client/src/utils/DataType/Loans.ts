export interface Loan {
  loan_id: number
  customer_id: number
  customer_name: string // Denormalized for display
  loan_amount: number
  interest_rate: number
  interest_amount: number
  notes_receivable: number
  balance: number
  penalty: number
  status: 'Active' | 'Completed' | 'Overdue' | 'Pending' | 'Cancelled'
  start_date: string
  due_date: string
  created_at: string
  updated_at: string
  payment_schedule: 'Weekly' | 'Monthly' | 'Quarterly' | 'Semi-Annual' | 'Annual'
  terms_months: number
}

export interface AddLoan {
  customer_id: number
  loan_amount: number
  interest_rate: number
  payment_schedule: 'Weekly' | 'Monthly' | 'Quarterly' | 'Semi-Annual' | 'Annual'
  terms_months: number
  start_date: string
  due_date: string
}

export interface EditLoan {
  loan_id: number
  customer_id: number
  loan_amount: number
  interest_rate: number
  payment_schedule: 'Weekly' | 'Monthly' | 'Quarterly' | 'Semi-Annual' | 'Annual'
  terms_months: number
  start_date: string
  due_date: string
  status: 'Active' | 'Completed' | 'Overdue' | 'Pending' | 'Cancelled'
  updated_at: string
}

export interface LoanPayment {
  payment_id: number
  loan_id: number
  amount: number
  payment_date: string
  payment_type: 'Principal' | 'Interest' | 'Penalty' | 'Full'
  notes?: string
  created_at: string
}

export interface LoanStats {
  total_loans: number
  active_loans: number
  completed_loans: number
  overdue_loans: number
  pending_loans: number
  cancelled_loans: number
  total_amount_disbursed: number
  total_outstanding_balance: number
  total_interest_earned: number
  total_penalties: number
  collection_rate: number
} 