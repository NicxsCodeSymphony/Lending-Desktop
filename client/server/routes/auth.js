const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const initDb = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

router.post('/', async (req, res) => {
    const { username, password } = req.body;

    try {
        const db = await initDb();

        const user = await db.get(`SELECT * FROM user WHERE username = ?`, [username]);

        if (!user || user.password !== password) {
            return res.status(401).json({ error: "Invalid username or password" });
        }

        const payload = {
            account_id: user.account_id,
            username: user.username
        };

        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
        res.json({token: token, message: "Successfully Logged in" });
    } catch (err) {
        res.status(500).json({ error: "Login failed", details: err.message });
    }
});

// New endpoint for changing password
router.post('/change-password', async (req, res) => {
    const { username, currentPassword, newPassword } = req.body;

    try {
        const db = await initDb();

        // First verify the current password
        const user = await db.get(`SELECT * FROM user WHERE username = ?`, [username]);

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        if (user.password !== currentPassword) {
            return res.status(401).json({ error: "Current password is incorrect" });
        }

        // Update the password and get the result
        const result = await db.run(
            `UPDATE user SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE username = ?`,
            [newPassword, username]
        );

        // Verify the update was successful
        if (result.changes === 0) {
            return res.status(500).json({ error: "Password update failed - no rows affected" });
        }

        // Double-check by fetching the updated user
        const updatedUser = await db.get(`SELECT password FROM user WHERE username = ?`, [username]);
        
        if (updatedUser.password !== newPassword) {
            return res.status(500).json({ error: "Password update verification failed" });
        }

        res.json({ 
            message: "Password changed successfully",
            rowsAffected: result.changes
        });
    } catch (err) {
        console.error("Password change error:", err);
        res.status(500).json({ error: "Failed to change password", details: err.message });
    }
});

// Debug endpoint to check user data (remove in production)
router.get('/debug/:username', async (req, res) => {
    const { username } = req.params;
    
    try {
        const db = await initDb();
        const user = await db.get(`SELECT account_id, account_name, username, created_at, updated_at FROM user WHERE username = ?`, [username]);
        
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        
        res.json(user);
    } catch (err) {
        console.error("Debug endpoint error:", err);
        res.status(500).json({ error: "Failed to fetch user data", details: err.message });
    }
});

// Reset admin password endpoint (for debugging)
router.post('/reset-admin', async (req, res) => {
    try {
        const db = await initDb();
        
        // Reset admin password to 'admin'
        const result = await db.run(
            `UPDATE user SET password = 'admin', updated_at = CURRENT_TIMESTAMP WHERE username = 'admin'`
        );
        
        if (result.changes === 0) {
            return res.status(404).json({ error: "Admin user not found" });
        }
        
        res.json({ 
            message: "Admin password reset to 'admin'",
            rowsAffected: result.changes
        });
    } catch (err) {
        console.error("Reset admin error:", err);
        res.status(500).json({ error: "Failed to reset admin password", details: err.message });
    }
});

module.exports = router;
