const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

// Initialize Express
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import Routes
const accountRoutes = require('./routes/accounts');

// Routes
app.get('/', (req, res) => {
    res.send("Hello from Vercel Server!");
});

app.use('/accounts', accountRoutes); // Use the accounts route

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;
