import axios from 'axios'
import type { PaymentHistory } from './History'

const url = "http://localhost:45632/"

export const fetchHistory = async (loan_id: number): Promise<PaymentHistory[]> => {
    try{
        const res = await axios.get<PaymentHistory[]>(`${url}history/` + loan_id)
        return res.data
    }
    catch(err){
        console.error("Failed to fetch payment history: ", err)
        return []
    }
}