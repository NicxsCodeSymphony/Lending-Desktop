import { useEffect } from "react"

const Dashboard = () => {

 useEffect(() => {
    const user = localStorage.getItem('authToken')
    if(!user){
        window.location.href = "/"
    }
 }, [])



    return(
        <div>This is the Dashboard</div>
    )

}

export default Dashboard