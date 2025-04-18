const express = require('express')
const router = express.Router()
const {pool} = require('../query')

const getHistory = async (loan) => {
    const [rows] = await pool.query('SELECT * FROM paymentHistory WHERE loan_id = ?', [loan])
    return rows
}

router.get('/:id', async (req, res) => {
    const {id} = req.params

    try{
        const result = await getHistory(id)
        res.status(200).send(result)
    }
    catch(err){
        res.status(500).send({error: err.message})
    }
})

module.exports = router