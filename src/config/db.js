const path = require('node:path');
const { Pool } = require('pg')
require('dotenv').config({path: path.resolve(__dirname, '../../.env')});

const pool = new Pool( {
    user: process.env.DB_USER,
    password: String(process.env.DB_PASSWORD),
    host: process.env.DB_HOST,
    name: process.env.DB_NAME,
    port: process.env.DB_PORT,
});

pool.connect((err, client, release) => {
    if (err) {
        return console.error('Error acquiring client', err.stack);
    }

    client.query('SELECT NOW()', (err, result) => {
        release();

        if (err) {
            return console.error('Error executing query', err.stack);
        }

        console.log('Database connected: ', result.rows[0]);
    });
});

module.exports = pool;