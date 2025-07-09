const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

let db;

async function initDb() {
    db = await open({
        filename: path.resolve(__dirname, './lending.db'),
        driver: sqlite3.Database
    });

    await db.run(`
        CREATE TABLE IF NOT EXISTS user (
            account_id INTEGER PRIMARY KEY AUTOINCREMENT,
            account_name TEXT NOT NULL,
            username TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await db.run(`
        CREATE TABLE IF NOT EXISTS customers (
            customer_id INTEGER PRIMARY KEY AUTOINCREMENT,
            first_name TEXT NOT NULL,
            middle_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            contact TEXT NOT NULL,
            address TEXT NOT NULL,
            birthdate TEXT NOT NULL,
            status TEXT DEFAULT "Recently Added",
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await db.run(`
        CREATE TABLE IF NOT EXISTS loan (
            loan_id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id INTEGER NOT NULL,
            loan_start DATE NOT NULL,
            months INTEGER NOT NULL,
            loan_end DATE NOT NULL,
            transaction_date DATE NOT NULL,
            loan_amount REAL NOT NULL,
            interest REAL NOT NULL,
            gross_receivable REAL NOT NULL,
            payday_payment REAL NOT NULL,
            service REAL NOT NULL,
            balance REAL NOT NULL,
            adjustment REAL NOT NULL,
            overall_balance REAL NOT NULL,
            penalty REAL DEFAULT 0,
            status TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_customer FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE
        )
    `);


    await db.run(`
        CREATE TABLE IF NOT EXISTS receipt (
            pay_id INTEGER PRIMARY KEY AUTOINCREMENT,
            loan_id INTEGER NOT NULL,
            to_pay REAL NOT NULL,
            original_to_pay REAL,
            schedule TEXT NOT NULL,
            amount REAL NOT NULL,
            transaction_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            status TEXT NOT NULL DEFAULT 'Not Paid',
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_loan FOREIGN KEY (loan_id) REFERENCES loan(loan_id) ON DELETE CASCADE
        )
    `);
    
    await db.run(`
        CREATE TABLE IF NOT EXISTS payment_history (
            history_id INTEGER PRIMARY KEY AUTOINCREMENT,
            loan_id INTEGER NOT NULL,
            pay_id INTEGER NOT NULL,
            amount REAL NOT NULL,
            payment_method TEXT NOT NULL,
            notes TEXT NOT NULL,
            transaction_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_payment_loan FOREIGN KEY (loan_id) REFERENCES loan(loan_id) ON DELETE CASCADE,
            CONSTRAINT fk_payment_receipt FOREIGN KEY (pay_id) REFERENCES receipt(pay_id) ON DELETE CASCADE
        )
    `);

    // Create default admin user if it doesn't exist
    const existingAdmin = await db.get(`
        SELECT username FROM user WHERE username = 'admin'
    `);

    if (!existingAdmin) {
        await db.run(`
            INSERT INTO user (account_name, username, password)
            VALUES ('admin', 'admin', 'admin')
        `);
    } else {
        console.log('ℹ️  Admin user already exists');
    }

    return db;
}

module.exports = initDb;
