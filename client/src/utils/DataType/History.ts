export interface PaymentHistory{
    history_id: number;
    loan_id: number;
    pay_id: number;
    amount: number;
    payment_method: string;
    notes: string;
    transaction_time: string;
}