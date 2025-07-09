const express = require('express')
require('dotenv').config()
const cors = require('cors')

const app = express()
app.use(express.json())
app.use(cors())
app.use(express.urlencoded({extended: true}))
app.use(cors({
    origin: "*",
    methods: ["GET", "PUT", "DELETE", "POST"]
}))


const accountRes = require('./routes/account')
const loginRouteRes = require('./routes/auth')
const customerRoute = require('./routes/customers')
const loanRoute = require('./routes/loan')
const historyRoute = require('./routes/history')
const receiptRoute = require('./routes/receipt')


app.use('/user', accountRes);
app.use('/login', loginRouteRes)
app.use('/customer', customerRoute)
app.use('/loan', loanRoute)
app.use('/history', historyRoute)
app.use('/receipt', receiptRoute)

// Use a less common port for safety
const PORT = process.env.PORT || 45632;

app.listen(PORT, () => {
    console.log(`Listening on port: ${PORT}`)
})