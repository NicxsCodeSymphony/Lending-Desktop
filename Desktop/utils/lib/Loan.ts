export interface Loan{
    loan_id: number;
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
    created_at: string;
    updated_at: string;
}