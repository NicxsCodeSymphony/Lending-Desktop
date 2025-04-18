import axios from 'axios'
import type { Loan } from './Loan'

const url = 'http://localhost:3002/'

export const fetchLoans = async (): Promise<Loan[]> => {
    try{
        const res = await axios.get<Loan[]>(`${url}loan`)
        console.log(res.data)
        return res.data
    }
    catch(err){
        console.error("Failed to fetch loan: ", err)
        return []
    }
}