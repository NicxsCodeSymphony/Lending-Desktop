export interface Receipts{
    pay_id: number;
    loan_id: number;
    to_pay: number;
    schedule: string;
    amount: number;
    transaction_time: string;
    status: string;
    updated_at: string;
    original_to_pay?: number;
}