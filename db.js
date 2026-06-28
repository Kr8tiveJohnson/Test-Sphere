// db.js
const { Sequelize } = require('sequelize');
// Force Vercel to bundle pg dialect for Sequelize
require('pg');
require('dotenv').config();

console.log('⏳ Initializing core Sequelize database instance...');

const sequelize = new Sequelize(
    process.env.DB_NAME || 'testsphere_db',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASSWORD || '', // Keeping your passwordless settings
    {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        dialect: 'postgres',
        logging: false, 
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    }
);

// Verify runtime database layer connectivity
sequelize.authenticate()
    .then(() => {
        console.log('✅ PostgreSQL database layer connected successfully via Sequelize.');
    })
    .catch(err => {
        console.error('❌ PostgreSQL database layer connection failure:', err.message);
    });

// 💡 CRITICAL FIX: Export ONLY the instance directly, NOT an object wrapped in curly braces
module.exports = sequelize;