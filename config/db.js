// db.js
const { Sequelize } = require('sequelize');
require('dotenv').config();

// Initialize Sequelize instance using your environment parameters and passwordless "trust" setup
let sequelize;

if (process.env.DATABASE_URL) {
    console.log('🔗 Connecting to database using DATABASE_URL...');
    sequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres',
        logging: false,
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        }
    });
} else {
    sequelize = new Sequelize(
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
}

// Verify runtime database layer connectivity
sequelize.authenticate()
    .then(() => {
        console.log('✅ PostgreSQL database layer connected successfully via Sequelize.');
    })
    .catch(err => {
        console.error('❌ PostgreSQL database layer connection failure:', err.message);
    });

module.exports = sequelize;