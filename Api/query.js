const mysql = require('mysql2')
const dotenv = require('dotenv')
dotenv.config()


const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
}).promise()

const getAccounts = async() => {
    const [rows] = await pool.query("SELECT * FROM accounts");
    return rows
}

module.exports = {pool}