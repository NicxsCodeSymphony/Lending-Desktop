const mysql = require('mysql2')
const dotenv = require('dotenv')
dotenv.config()


const pool = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "journeytrail",
    database: "lending"
}).promise()

module.exports = {pool}