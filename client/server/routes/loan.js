const express = require('express');
const router = express.Router();
const initDb = require('../db');

const getLoans = async () => {
    const db = await initDb();
    const result = await db.all(`SELECT l.*, c.first_name, c.middle_name, c.last_name 
        FROM loan l 
        LEFT JOIN customers c
        ON l.customer_id = c.customer_id 
        WHERE l.status != 'Deleted'`);
    return result;
};

const getLoan = async (id) => {
    const db = await initDb();
    const result = await db.all("SELECT * FROM loan WHERE customer_id = ? AND status = 'Active'", [id]);
    return result;
};

const getReceiptByLoanId = async(loanId) => {
    const db = await initDb();
    const result = await db.all('SELECT * FROM receipt where loan_id = ?', [loanId]);
    return result;
};

const insertLoan = async (customer_id, loan_start, months, loan_end, transaction_date, loan_amount, interest, gross_receivable, payday_payment, service, balance, adjustment, overall_balance, penalty) => {
    const db = await initDb();
    const insertLoan = await db.run(`INSERT INTO loan (
        customer_id, loan_start, months, loan_end, transaction_date, 
        loan_amount, interest, gross_receivable, payday_payment, service, balance, adjustment, overall_balance, penalty, status) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Recently Added')`, [customer_id, loan_start, months, loan_end, transaction_date, loan_amount, interest, gross_receivable, payday_payment, service, balance, adjustment, overall_balance, penalty || 0]);
    const loanId = insertLoan.lastID;
    let breakdown = gross_receivable / months;
    for (let i = 0; i < months; i++) {
        let scheduleDate = new Date(loan_start);
        scheduleDate.setMonth(scheduleDate.getMonth() + i);
        let formattedScheduleDate = scheduleDate.toISOString().split('T')[0];
        await db.run(`INSERT INTO receipt (loan_id, amount, to_pay, schedule, status) 
            VALUES (?, ?, ?, ?, 'Not Paid')`, [loanId, 0, breakdown, formattedScheduleDate]);
    }
    return "Loan has been added successfully";
};

const payLoan = async (pay_id, amount, transaction_time, method, notes, loan_id) => {
    console.log('payLoan called with:', {pay_id, amount, transaction_time, method, notes, loan_id});
    
    let remainingAmount = parseFloat(amount);
    const db = await initDb();
    
    // Check if loan exists
    const loanRow = await db.get('SELECT * FROM loan WHERE loan_id = ?', [loan_id]);
    if (!loanRow) {
        console.log('Loan not found:', loan_id);
        return "Loan not found";
    }
    
    // Check if receipt exists
    const receiptExists = await db.get('SELECT pay_id FROM receipt WHERE pay_id = ?', [pay_id]);
    if (!receiptExists) {
        console.log('Receipt not found:', pay_id);
        return "Receipt not found";
    }
    
    // Get all receipts for this loan, ordered by pay_id
    const receipts = await db.all('SELECT * FROM receipt WHERE loan_id = ? ORDER BY pay_id ASC', [loan_id]);
    console.log('Found receipts:', receipts.length);
    
    let foundStart = false;
    for (let i = 0; i < receipts.length && remainingAmount > 0; i++) {
        const receipt = receipts[i];
        console.log(`Processing receipt ${receipt.pay_id}, foundStart: ${foundStart}, status: ${receipt.status}`);
        
        if (!foundStart && receipt.pay_id == pay_id) {
            foundStart = true;
            console.log('Found starting receipt:', receipt.pay_id);
        }
        if (!foundStart) continue;
        if (receipt.status === 'Paid') {
            console.log('Skipping paid receipt:', receipt.pay_id);
            continue;
        }
        
        const alreadyPaid = parseFloat(receipt.amount);
        const toPay = parseFloat(receipt.to_pay);
        const stillOwed = toPay - alreadyPaid;
        
        console.log(`Receipt ${receipt.pay_id}: alreadyPaid=${alreadyPaid}, toPay=${toPay}, stillOwed=${stillOwed}`);
        
        if (stillOwed <= 0) {
            console.log('Skipping fully paid receipt:', receipt.pay_id);
            continue;
        }
        
        const applyAmount = Math.min(stillOwed, remainingAmount);
        const newAmount = alreadyPaid + applyAmount;
        const newStatus = newAmount >= toPay ? 'Paid' : 'Not Paid';
        
        console.log(`Updating receipt ${receipt.pay_id}: applyAmount=${applyAmount}, newAmount=${newAmount}, newStatus=${newStatus}`);
        
        try {
            await db.run(
                `UPDATE receipt SET amount = ?, transaction_time = ?, status = ? WHERE pay_id = ?`,
                [newAmount, transaction_time, newStatus, receipt.pay_id]
            );
            
            await db.run(
                `INSERT INTO payment_history (loan_id, pay_id, amount, payment_method, notes, transaction_time)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [loan_id, receipt.pay_id, applyAmount, method, notes, transaction_time]
            );
            
            remainingAmount = parseFloat((remainingAmount - applyAmount).toFixed(2));
            console.log(`Remaining amount: ${remainingAmount}`);
        } catch (error) {
            console.error('Database error:', error);
            throw error;
        }
    }
    
    // Don't manually calculate balance - let checkAndUpdateLoanStatus handle it
    // This ensures the balance is always calculated from actual receipt data
    
    const statusUpdated = await checkAndUpdateLoanStatus(loan_id);
    
    console.log('Payment processed successfully');
    return statusUpdated 
        ? "Payment processed successfully. All payments completed - loan marked as completed." 
        : "Payment processed successfully with balance and receipts updated.";
};

const deleteLoan = async(loanId) => {
    const db = await initDb();
    await db.run('UPDATE loan SET status = ? WHERE loan_id = ? ', ['Deleted', loanId]);
    return "Loan has been deleted";
};

const cancelLoan = async(loanId) => {
    const db = await initDb();
    
    // Check if loan exists and get current status
    const loan = await db.get('SELECT status, overall_balance FROM loan WHERE loan_id = ?', [loanId]);
    if (!loan) {
        throw new Error('Loan not found');
    }
    
    // Check if loan can be cancelled (not completed)
    if (loan.status.toLowerCase() === 'completed') {
        throw new Error('Cannot cancel a completed loan');
    }
    
    // Update loan status to cancelled
    await db.run('UPDATE loan SET status = ? WHERE loan_id = ?', ['Cancelled', loanId]);
    
    console.log(`Loan ${loanId} cancelled successfully`);
    return "Loan has been cancelled successfully";
};

const addPenaltyToLoan = async(loanId, penaltyAmount, reason, transactionDate) => {
    const db = await initDb();
    
    // Check if loan exists and get current status
    const loan = await db.get('SELECT status, penalty, overall_balance FROM loan WHERE loan_id = ?', [loanId]);
    if (!loan) {
        throw new Error('Loan not found');
    }
    
    // Check if loan can have penalty added (not completed or cancelled)
    if (loan.status.toLowerCase() === 'completed' || loan.status.toLowerCase() === 'cancelled') {
        throw new Error('Cannot add penalty to completed or cancelled loan');
    }
    
    // Get all receipts for this loan, ordered by pay_id
    const receipts = await db.all('SELECT * FROM receipt WHERE loan_id = ? ORDER BY pay_id ASC', [loanId]);
    
    if (receipts.length === 0) {
        throw new Error('No payment schedule found for this loan');
    }
    
    // Find the most recent unpaid month (first unpaid receipt)
    let targetReceipt = null;
    for (const receipt of receipts) {
        if (receipt.status !== 'Paid') {
            targetReceipt = receipt;
            break;
        }
    }
    
    // If all months are paid, add to the last month
    if (!targetReceipt) {
        targetReceipt = receipts[receipts.length - 1];
    }
    
    // Add penalty to the target month's payment amount
    const newToPay = parseFloat(targetReceipt.to_pay) + parseFloat(penaltyAmount);
    
    // Store the original amount if not already stored
    const originalToPay = targetReceipt.original_to_pay || targetReceipt.to_pay;
    
    await db.run('UPDATE receipt SET to_pay = ?, original_to_pay = ? WHERE pay_id = ?', 
        [newToPay, originalToPay, targetReceipt.pay_id]);
    
    // Add penalty to existing penalty amount in loan table
    const newPenaltyAmount = parseFloat(loan.penalty || 0) + parseFloat(penaltyAmount);
    await db.run('UPDATE loan SET penalty = ? WHERE loan_id = ?', [newPenaltyAmount, loanId]);
    
    // Add penalty record to payment history
    await db.run(
        `INSERT INTO payment_history (loan_id, pay_id, amount, payment_method, notes, transaction_time)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [loanId, targetReceipt.pay_id, penaltyAmount, 'Penalty', reason, transactionDate]
    );
    
    // Recalculate loan balance based on updated receipts
    await checkAndUpdateLoanStatus(loanId);
    
    console.log(`Penalty of ${penaltyAmount} added to month ${targetReceipt.pay_id} for loan ${loanId}. Total penalty: ${newPenaltyAmount}`);
    return "Penalty added successfully";
};

const updateStatus = async(loanId, status) => {
    const db = await initDb();
    await db.run('UPDATE loan SET status = ? WHERE loan_id = ?', [status, loanId]);
    return "Loan status updated successfully";
};

const checkAndUpdateLoanStatus = async(loanId) => {
    const db = await initDb();
    
    const receipts = await db.all('SELECT * FROM receipt WHERE loan_id = ?', [loanId]);
    
    if (receipts.length === 0) return false;
    
    // Always calculate balance from actual receipt data
    const totalDue = receipts.reduce((sum, receipt) => sum + parseFloat(receipt.to_pay), 0);
    const totalPaid = receipts.reduce((sum, receipt) => sum + parseFloat(receipt.amount || 0), 0);
    const remainingBalance = Math.max(0, totalDue - totalPaid);
    
    // Update the overall_balance to reflect actual remaining amount from receipts
    await db.run('UPDATE loan SET overall_balance = ? WHERE loan_id = ?', [remainingBalance, loanId]);
    console.log(`Loan ${loanId} overall_balance updated to: ${remainingBalance} (calculated from receipts)`);
    
    // Determine status based on receipt data
    const allPaid = receipts.every(receipt => receipt.status === 'Paid');
    const hasPartialPayments = receipts.some(receipt => 
        receipt.amount > 0 && receipt.amount < receipt.to_pay
    );
    const hasAnyPayments = receipts.some(receipt => receipt.amount > 0);
    
    if (allPaid) {
        await db.run('UPDATE loan SET status = ? WHERE loan_id = ?', ['Completed', loanId]);
        console.log(`Loan ${loanId} marked as completed - all payments received`);
        return true;
    } else if (hasPartialPayments || hasAnyPayments) {
        await db.run('UPDATE loan SET status = ? WHERE loan_id = ?', ['Partial', loanId]);
        console.log(`Loan ${loanId} marked as partial - some payments received`);
        return true;
    } else {
        // No payments made yet
        await db.run('UPDATE loan SET status = ? WHERE loan_id = ?', ['Active', loanId]);
        console.log(`Loan ${loanId} marked as active - no payments received`);
        return true;
    }
};

// Function to recalculate all loan balances (for fixing existing data)
const recalculateAllLoanBalances = async() => {
    const db = await initDb();
    
    const loans = await db.all('SELECT loan_id FROM loan');
    
    for (const loan of loans) {
        await checkAndUpdateLoanStatus(loan.loan_id);
    }
    
    console.log('All loan balances recalculated');
    return "All loan balances have been recalculated";
};

router.get('/', async(req, res) =>{ 
    try{
        const loan = await getLoans();
        res.status(200).send(loan);
    }
    catch(err){
        res.status(500).send({error: err.message});
    }
});

router.get('/:id', async(req, res) =>{ 
    const {id} = req.params;
    try{
        const loan = await getLoan(id);
        res.status(200).send(loan);
    }
    catch(err){
        res.status(500).send({error: err.message});
    }
});

router.get('/getReceipt/:id', async(req, res) => {
    const {id} = req.params;
    try{
        const receipts = await getReceiptByLoanId(id);
        res.status(200).send(receipts);
    }
    catch(err){
        res.status(500).send({error: err.message});
    }
});

router.post('/', async(req, res) => {
    const {customer_id, loan_start, months, loan_end, transaction_date, loan_amount, interest, gross_receivable, payday_payment, service, balance, adjustment, overall_balance, penalty} = req.body;
    try{
        const result = await insertLoan(customer_id, loan_start, months, loan_end, transaction_date, loan_amount, interest, gross_receivable, payday_payment, service, balance, adjustment, overall_balance, penalty);
        res.status(201).send(result);
    }
    catch(err){
        res.status(500).send({error: err.message});
    }
});

router.put('/updateStatus/:id', async(req, res) => {
    const {id} = req.params;
    const {status} = req.body;
    try{
        const result = await updateStatus(id, status);
        res.status(200).send(result);
    }
    catch(err){res.status(500).send({error: err.message});}
});

router.put('/payLoan/:id', async (req, res) => {
    const {id} = req.params;
    const {amount, transaction_time, method, notes, loan_id} =  req.body;
    
    console.log('Payment request:', {id, amount, transaction_time, method, notes, loan_id});
    
    // Validate required fields
    if (!amount || !transaction_time || !loan_id) {
        return res.status(400).send({error: 'Missing required fields: amount, transaction_time, or loan_id'});
    }
    
    try{
        const result = await payLoan(id, amount, transaction_time, method || 'Cash', notes || '', loan_id);
        res.status(200).send(result);
    }
    catch(err){
        console.error('Payment error:', err);
        res.status(500).send({error: err.message});
    }
});

router.delete('/:id', async(req, res) => {
    const {id} = req.params;
    try{
        const result = await deleteLoan(id);
        res.status(200).send(result);
    }
    catch(err){
        res.status(500).send({error: err.message});
    }
});

router.post('/recalculate-balances', async(req, res) => {
    try{
        const result = await recalculateAllLoanBalances();
        res.status(200).send(result);
    }
    catch(err){
        res.status(500).send({error: err.message});
    }
});

router.put('/cancel/:id', async(req, res) => {
    const {id} = req.params;
    try{
        const result = await cancelLoan(id);
        res.status(200).send(result);
    }
    catch(err){
        res.status(500).send({error: err.message});
    }
});

router.put('/addPenalty', async(req, res) => {
    const {loan_id, penalty_amount, reason, transaction_date} = req.body;
    
    // Validate required fields
    if (!loan_id || !penalty_amount || !reason || !transaction_date) {
        return res.status(400).send({error: 'Missing required fields: loan_id, penalty_amount, reason, or transaction_date'});
    }
    
    try{
        const result = await addPenaltyToLoan(loan_id, penalty_amount, reason, transaction_date);
        res.status(200).send(result);
    }
    catch(err){
        console.error('Penalty error:', err);
        res.status(500).send({error: err.message});
    }
});

router.post("/erase", async() => {
    try{
        const db = await initDb();
    await db.run("DELETE FROM loan");
    await db.run("DELETE FROM receipt");
    await db.run("DROP TABLE loan");
    await db.run("DROP TABLE receipt");
    await db.run("DROP TABLE payment_history");
    return "All data has been erased";
    }
    catch(err){
        console.error('Erase error:', err);
        throw err;
    }
})

module.exports = router;
