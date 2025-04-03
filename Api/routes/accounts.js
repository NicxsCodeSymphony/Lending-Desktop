const express = require('express');
const router = express.Router();
const { pool } = require('../query'); 

const getAccounts = async () => {
    const [rows] = await pool.query("SELECT * FROM accounts")
    return rows
}

router.get('/', async (req, res) => {
    try {
        const users = await getAccounts();
        res.send(users);
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});


router.post('/login', async (req, res) => {
    const {username, password} = req.body

    const users = await getAccounts()

    try{
        users.forEach(s => {
            if(username == s.username){
                
                if(password == s.password){
                    res.status(200).send({message: "Your are now successfully Logged in", token: 12345})
                }else{
                    res.status(400).send({error: "Incorrent Password"})
                }
            }else{
                res.status(400).send({error: "Account doesn't exist!"})
            }
        })
    }
    catch(err){
        res.status(500).send({error: err.message})
    }
})

module.exports = router;
