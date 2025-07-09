const express = require('express');
const router = express.Router();
const initDb = require('../db');

router.get('/', async (req, res) => {
    try {
        const db = await initDb();
        const result = await db.all("SELECT * FROM customers");
        res.status(200).send(result)
    } catch (err) {
        res.status(500).json({ error: `Failed to fetch customers: ${err.message}` });
    }
});

router.post('/', async (req, res) => {
    const { first_name, middle_name, last_name, contact, address, birthdate } = req.body;
    try {
        const db = await initDb();
        const result = await db.run(
            `INSERT INTO customers(first_name, middle_name, last_name, contact, address, birthdate) VALUES (?, ?, ?, ?, ?, ?)`,
            [first_name, middle_name, last_name, contact, address, birthdate]
        );
        res.status(201).send({response: "Customer data successfully added", details: result});
    } catch (err) {
        res.status(500).json({ error: `Failed to add customer data: ${err.message}` });
    }
});

router.put('/:customer_id', async (req, res) => {
    const { first_name, middle_name, last_name, contact, address, birthdate } = req.body;
    const { customer_id } = req.params;

    try {
        const db = await initDb();
        const result = await db.run(
            `UPDATE customers SET first_name = ?, middle_name = ?, last_name = ?, contact = ?, address = ?, birthdate = ? WHERE customer_id = ?`,
            [first_name, middle_name, last_name, contact, address, birthdate, customer_id]
        );

        if (result.changes > 0) {
            res.status(200).send({response: "Customer data was successfully updated", details: result});
        } else {
            res.status(404).send("Account not found or no changes made");
        }
    } catch (err) {
        res.status(500).json({ error: `Error on updating customer data: ${err.message}` });
    }
});

router.delete('/:customer_id', async (req, res) => {
    const { customer_id } = req.params;

    try {
        const db = await initDb();
        const result = await db.run(`UPDATE customers set status = ? WHERE customer_id = ?`, ['Deleted',customer_id]);

        if (result.changes > 0) {
            res.status(200).send("Customer data successfully deleted");
        } else {
            res.status(404).send("Account not found");
        }
    } catch (err) {
        res.status(500).json({ error: `Error on deleting customer data: ${err.message}` });
    }
});

module.exports = router;
