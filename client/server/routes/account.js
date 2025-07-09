const express = require('express')
const router = express.Router()
const initDb = require('../db')

router.get('/', async(req, res) => {
    try{
    const db = await initDb();
        const users = await db.all("SELECT * FROM user")
        res.json(users)
    }   
    catch(err){res.status(500).json({error: "Failed ot fetch users"})}
})


router.post('/', async (req, res) => {
    const { account_name, username, password } = req.body;

    try {
        const db = await initDb();
        const result = await db.run(
            `INSERT INTO user (account_name, username, password) VALUES (?, ?, ?)`,
            [account_name, username, password]
        );

        res.status(201).send({response: "Add account successfully", details: result});
    } catch (err) {
        res.status(500).json({ error: "Failed to add account", details: err.message });
    }
});


router.put('/:account_id', async (req, res) => {
    const { account_name, username, password } = req.body;
    const { account_id } = req.params;

    try {
        const db = await initDb();
        const result = await db.run(
            `UPDATE user SET account_name = ?, username = ?, password = ?, updated_at = CURRENT_TIMESTAMP WHERE account_id = ?`,
            [account_name, username, password, account_id]
        );

        if (result.changes > 0) {
            res.status(200).send({response: "Successfully updated", details: result});
        } else {
            res.status(404).send("Account not found or no changes made");
        }
    } catch (err) {
        res.status(500).json({ error: "Error on updating account", details: err.message });
    }
});


module.exports = router