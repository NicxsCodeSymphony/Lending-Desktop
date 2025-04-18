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

    let breakdown = gross_receivable / months
    
    for (let i = 0; i < months; i++) {
        let scheduleDate = new Date(loan_start);
        scheduleDate.setMonth(scheduleDate.getMonth() + i);
        let formattedScheduleDate = scheduleDate.toISOString().split('T')[0];
        
        await pool.query(`INSERT INTO receipt (loan_id, amount, to_pay, schedule) 
            VALUES (?, ?, ?, ?)`, [result.insertId, 0, breakdown, formattedScheduleDate]);
    }

    return result.affectedRows > 0 ? "Loan has been added successfully" : "Error on adding loan";
};

const payLoan = async (pay_id, amount, transaction_time, method, notes, loan_id) => {
    let remainingAmount = parseFloat(amount);
  
    const [loanRows] = await pool.query('SELECT balance FROM loan WHERE loan_id = ?', [loan_id]);
    if (loanRows.length === 0) return "Loan not found";
  
    let currentLoanBalance = parseFloat(loanRows[0].balance);
    let newLoanBalance = parseFloat((currentLoanBalance - remainingAmount).toFixed(2));
    if (newLoanBalance < 0) newLoanBalance = 0;
  
    let currentPayId = pay_id;
  
    while (remainingAmount > 0) {
      const [receiptRows] = await pool.query(
        `SELECT pay_id, to_pay FROM receipt WHERE pay_id = ? AND loan_id = ?`,
        [currentPayId, loan_id]
      );
  
      if (receiptRows.length === 0) break;
  
      const toPay = parseFloat(receiptRows[0].to_pay);
      const amountToApply = Math.min(toPay, remainingAmount);
      const newStatus = amountToApply >= toPay ? "Paid" : "Not paid";
  
      await pool.query(
        `UPDATE receipt SET amount = ?, transaction_time = ?, status = ? WHERE pay_id = ?`,
        [amountToApply, transaction_time, newStatus, currentPayId]
      );
  
      remainingAmount = parseFloat((remainingAmount - amountToApply).toFixed(2));
  
      if (remainingAmount > 0) {
        const [nextRows] = await pool.query(
          `SELECT pay_id FROM receipt 
           WHERE loan_id = ? AND status = 'Not paid' AND pay_id > ? 
           ORDER BY pay_id ASC LIMIT 1`,
          [loan_id, currentPayId]
        );
  
        if (nextRows.length === 0) break;
        
        currentPayId = nextRows[0].pay_id;
      }
    }
  
    await pool.query(`UPDATE loan SET balance = ? WHERE loan_id = ?`, [newLoanBalance, loan_id]);
    await pool.query(
        `INSERT INTO paymentHistory (loan_id, pay_id, amount, payment_method, notes, transaction_time)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [loan_id, currentPayId, amount, method, notes, transaction_time]
      );
      
    return "Payment processed successfully with balance and receipts updated.";
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

// PAY LOAN

router.put('/payLoan/:id', async (req, res) => {
    const {id} = req.params
    const {amount, transaction_time, method, notes, loan_id} =  req.body

    try{
        const result = await payLoan(id,amount, transaction_time, method, notes, loan_id)
        res.status(200).send(result)
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