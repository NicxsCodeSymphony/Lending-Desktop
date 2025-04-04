import axios from "axios";


const fetchData = async () => {
    try{
        const res = await axios.get('http://localhost:3002/loan')
        console.log(res)
    }
    catch(err){
        console.log(err)
    }
}

fetchData()