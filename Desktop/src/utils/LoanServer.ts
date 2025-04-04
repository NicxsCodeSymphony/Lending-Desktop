import axios from 'axios'

const url = 'http://localhost:3002/loan'

export async function loan(){
    try{
        const res = await axios.get(url)
        const loan = res.data
        return{loan}
    }
    catch(err){
        console.error(err)
    }
}