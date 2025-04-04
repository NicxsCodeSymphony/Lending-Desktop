const express = require('express');
const router = express.Router();
const { pool } = require('../query'); 

const getLoans = async () => {
    const [rows] = await pool.query(`SELECT l.*, c.first_name, c.middle_name, c.last_name 
        FROM loan l 
        LEFT JOIN customer c
        ON l.customer_id = c.customer_id 
        WHERE l.status = 'Active'`)
    return rows
}

const getLoan = async (id) => {
    const [rows] = await pool.query("SELECT * FROM loan WHERE customer_id = ? WHERE status = 'Active'", [id])
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
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?);`, [customer_id, loan_start, months, loan_end, transaction_date, loan_amount, interest, gross_receivable, payday_payment, service, balance, adjustment, overall_balance]);

    let breakdown = (loan_amount + (loan_amount * interest)) / months;
    
    for (let i = 0; i < months; i++) {
        let scheduleDate = new Date(loan_start);
        scheduleDate.setMonth(scheduleDate.getMonth() + i);
        let formattedScheduleDate = scheduleDate.toISOString().split('T')[0];
        
        await pool.query(`INSERT INTO receipt (loan_id, amount, to_pay, schedule) 
            VALUES (?, ?, ?, ?)`, [result.insertId, 0, breakdown, formattedScheduleDate]);
    }

    return result.affectedRows > 0 ? "Loan has been added successfully" : "Error on adding loan";
};



const deleteLoan = async(loanId) => {
    const [result] = await pool.query('UPDATE loan SET status = ? WHERE loan_id = ? ', ['Deleted', loanId])
    return result.affectedRows > 0 ? "Loan has been deleted" : "Error on deleting loan"
}

router.get('/', async(req, res) =>{ 
    try{
        const loan = await getLoans()
        res.status(200).send(loan)
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

router.delete('/:id', async(req, res) => {
    const {id} = req.params
    try{
        const result = await deleteLoan(id)
        res.status(200).send(result)
    }
    catch(err){
        res.status(500).send({error: err.message})
    }
})

module.exports = router