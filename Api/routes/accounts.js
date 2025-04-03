const express = require('express');
const router = express.Router();
const { getAccounts } = require('../query'); 

// Define the `/accounts` route
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
                    res.status(200).send({message: "Your are now successfully Logged in"})
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
