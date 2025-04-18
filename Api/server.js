const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

// Initialize Express
const app = express();

// Middleware
app.use(cors());
app.use(cors({
    origin: "*",
    methods: ["GET", "PUT", "DELETE"],
}))
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import Routes
const accountRoutes = require('./routes/accounts');
const customerRoutes = require('./routes/customers')
const loanRoutes = require('./routes/loan')
const historyRoutes = require('./routes/history')

// Routes
app.get('/', (req, res) => {
    res.send("Hello from Vercel Server!");
});

app.use('/accounts', accountRoutes); 
app.use('/customers', customerRoutes)
app.use('/loan', loanRoutes)
app.use('/history', historyRoutes)

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;
