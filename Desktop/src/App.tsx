import { Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import LendingPage from "./pages/Dashboard/Lending";

const App = () => {

  return(
    <>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/lending" element={<LendingPage />} />
      </Routes>
    </>
  )

}

export default App