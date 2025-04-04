import axios from "axios";
import { useState, useEffect } from "react";
import type { Loan } from "../../utils/lib/Loan";


const Lending: React.FC = () => {
    const [loan, setLoan] = useState<Loan>([])
    const fetchLoan = async () => {
        try{
            const res = await axios.get<Loan>('http://localhost:3002/loan')
            setLoan(res.data)
        }
        catch(err){
            console.error(err)
        }
    }
    useEffect(() => {
        fetchLoan()
    }, [loan])


    return(
        <div>
           {loan.map((data) => (
            <div key={data?.loan_id}>
                <p>{data?.customer_id}</p>
                <p>{data?.loan_start}</p>
            </div>
           ))}
        </div>
    )
}

export default Lending