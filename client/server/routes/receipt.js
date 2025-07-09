const express = require('express')
const router = express.Router()
const initDb = require('../db')

router.get('/', async(req, res) => {
    try{
        const db = await initDb()
        const result = await db.all(`SELECT * FROM receipt`)
        res.status(200).send(result)
    }
    catch(err){res.status(500).json({error: `Failed to fetch histroy data: ${err.message}`})}
})

router.get('/:id', async(req, res) => {
    const {id} = req.params;
    try{
        const db = await initDb()
        const result = await db.all(`SELECT * FROM receipt WHERE loan_id = ?`, [id])
        res.status(200).send(result)
    }
    catch(err){res.status(500).json({error: `Failed to fetch history data: ${err.message}`})}
})


module.exports = router