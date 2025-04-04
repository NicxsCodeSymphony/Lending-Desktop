export interface Loan{
    loan_id: number,
    customer_id: number,
    first_name: string,
    last_name: string,
    loan_start: string,
    months: number,
    loan_end: string,
    transaction_date: string,
    loan_amount: number,
    interest: number,
    gross_receivable: number,
    payday_payment: number,
    service: number,
    balance: number,
    adjustment: number,
    overall_balance: number,
    status: string,
    created_at: string,
    updated_at: string
}

export interface Receipt{
    pay_id: number,
    loan_id: number,
    amount: number,
    to_pay: number,
    schedule: string
}


export interface LoanFormData {
    customer_id: string;
    loan_start: string;
    months: number;
    loan_end: string;
    transaction_date: string;
    loan_amount: number;
    interest: number;
    gross_receivable: number;
    payday_payment: number;
    service: number;
    balance: number;
    adjustment: number;
    overall_balance: number;
    status: string
  }
  