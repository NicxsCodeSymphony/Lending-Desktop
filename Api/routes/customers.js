const express = require('express');
const router = express.Router();
const { pool } = require('../query'); 

const getCustomers = async() => {
    const [rows] = await pool.query("SELECT * FROM customer")
    return rows
}

const insertCustomer = async(first_name, middle_name, last_name, address, birthdate) => {
    const [result] = await pool.query("INSERT INTO customer(first_name, middle_name, last_name, address, birthdate) VALUES(?,?,?,?,?)", [first_name, middle_name, last_name, address, birthdate])
       return result.affectedRows > 0 ? "Customer has been added successfully" : "Error on adding customer"
}

const updateCustomer = async(customer_id, first_name, middle_name, last_name, address, birthdate) => {
    const [result] =  await pool.query("UPDATE customer SET first_name = ?, middle_name = ?, last_name = ?, address = ?, birthdate = ? WHERE customer_id = ?", [first_name, middle_name, last_name, address, birthdate, customer_id])
    return result.affectedRows > 0 ? "Customer's information has been updated successfully" : "Error on updating customer's information"
}

const deleteCustomer = async(customer_id) =>{
    const [result] = await pool.query("UPDATE customer SET status = ? WHERE customer_id = ?", ["Deleted", customer_id])
    return result.affectedRows > 0 ? "Customer has been deleted successfully" : "Error on deleting customer"
}

router.get('/', async(req, res) => {
    try{
        const result = await getCustomers()
        res.send(result)
    }
    catch(err){
        console.error(err.message)
        res.status(500).send({error: err.message})
    }
})

router.post('/', async(req, res) => {
    const {first_name, middle_name, last_name, address, birthdate} = req.body

    try{
        const result = await insertCustomer(first_name, middle_name, last_name, address, birthdate)
        res.send(result)
        
    }
    catch(err){
        console.error(err.message)
        res.status(500).send({error: err.message})
    }
})

router.put('/:customer_id', async(req, res) => {
    const {customer_id} = req.params
    const {first_name, middle_name, last_name, address, birthdate} = req.body

    try{
        const result = await updateCustomer(customer_id, first_name, middle_name, last_name, address, birthdate)
        res.send(result)
    }
    catch(err){
        console.error(err.message)
        res.status(500).send({error: err.message})
    }
})

router.delete('/:customer_id', async(req, res) => {
    const {customer_id} = req.params

    try{
        const result = await deleteCustomer(customer_id)
        res.send(result)
    }
    catch(err){
        res.status(500).send({error: err.message})
    }
})

module.exports = router