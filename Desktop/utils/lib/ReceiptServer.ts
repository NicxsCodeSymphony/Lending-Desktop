import axios from 'axios'
import type { Receipt } from './Receipt'

const url = "http://localhost:3002/"

export const fetchReceipt = async ():Promise<Receipt[]> => {
    try{
        const res = await axios.get<Receipt[]>(`${url}receipt`)
        return res.data
    }
    catch(err){
        console.error("Failed to fetch receipts: ", err)
        return []
    }
}