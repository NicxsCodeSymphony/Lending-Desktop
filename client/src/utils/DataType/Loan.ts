export interface Loan{
    loan_id: number;
    customer_id: number;
    loan_start: string;
    loan_end: string;
    months: number;
    loan_amount: number;
    interest: number;
    gross_receivable: number;
    payday_payment: number;
    service: number;
    balance: number;
    adjustment: number;
    overall_balance: number;
    penalty: number;
    status: string;
    created_at: string;
    updated_at: string;
    first_name?: string;
    middle_name?: string;
    last_name?: string;
}

export interface InsertLoan{
    customer_id: number;
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
    penalty: number;
}

export interface PayLoan{
    pay_id: number;
    loan_id: number;
    amount: number;
    transaction_date: string;
    method: string;
    notes: string;
}

export interface AddPenalty{
    loan_id: number;
    penalty_amount: number;
    reason: string;
    transaction_date: string;
}