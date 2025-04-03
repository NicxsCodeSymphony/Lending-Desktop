const express = require('express');
const router = express.Router();
const { pool } = require('../query'); 

const getLoans = async () => {
    const [rows] = await pool.query("SELECT * FROM loan")
    return rows
}

const getLoan = async (id) => {
    const [rows] = await pool.query("SELECT * FROM loan WHERE customer_id = ?", [id])
    return rows
}

const getReceiptByLoanId = async(loanId) => {
    const [rows] = await pool.query('SELECT * FROM receipt where loan_id = ?', [loanId])
    return rows
}

const insertLoan = async (customer_id, loan_start, months, loan_end, transaction_date, loan_amount, interest, gross_receivable, payday_payment, service, balance, adjustment, overall_balance) => {
    const [result] = await pool.query(`INSERT INTO loan (
    customer_id, loan_start, months, loan_end, transaction_date, 
    loan_amount, interest, gross_receivable, payday_payment, service, balance, adjustment, overall_balance) 
VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?);`, [customer_id, loan_start, months, loan_end, transaction_date, loan_amount, interest, gross_receivable, payday_payment, service, balance, adjustment, overall_balance])
    let breakdown = (loan_amount + (loan_amount * interest)) / months
    for(let i=0; i<months; i++){
       await pool.query(`INSERT INTO receipt (loan_id, amount, to_pay) VALUES(?,?,?)`,[result.insertId, 0, breakdown])
    }

    return result.affectedRows > 0 ? "Loan has been added successfully" : "Error on adding loan"

}




router.get('/', async(req, res) =>{ 
    try{
        const loan = await getLoans()
        res.status(400).send(loan)
    }
    catch(err){
        res.status(500).send({error: err.message})
    }
})

router.get('/:id', async(req, res) =>{ 
    const {id} = req.params
    try{
        const loan = await getLoan(id)
        res.status(400).send(loan)
    }
    catch(err){
        res.status(500).send({error: err.message})
    }
})

router.get('/getReceipt/:id', async(req, res) => {
    const {id} = req.params
    try{
        const receipts = await getReceiptByLoanId(id)
        res.status(200).send(receipts)
    }
    catch(err){
        res.status(500).send({error: err.message})
    }
})


router.post('/', async(req, res) => {
    const {customer_id, loan_start, months, loan_end, transaction_date, loan_amount, interest, gross_receivable, payday_payment, service, balance, adjustment, overall_balance} = req.body
    try{
        const result = await insertLoan(customer_id, loan_start, months, loan_end, transaction_date, loan_amount, interest, gross_receivable, payday_payment, service, balance, adjustment, overall_balance)
        res.status(201).send(result)

    }
    catch(err){
        res.status(500).send({error: err.message})
    }
})

module.exports = router