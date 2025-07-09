import axios from 'axios'
import type { Receipts } from './Receipt'

const url = "http://localhost:45632"

export const fetchReceipt = async ():Promise<Receipts[]> => {
    try{
        const res = await axios.get<Receipts[]>(`${url}/receipt`)
        console.log('🔍 Raw receipts data from API:', res.data);
        return res.data
    }
    catch(err){
        console.error("Failed to fetch receipts: ", err)
        return []
    }
}

export const getReceiptByLoanId = async (loanId: number): Promise<Receipts[]> => {
    try{
        const res = await axios.get<Receipts[]>(`${url}/loan/getReceipt/${loanId}`)
        return res.data
    }
    catch(err){
        console.error("Failed to fetch receipts for loan: ", err)
        throw err
    }
}