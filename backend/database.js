const { Pool } = require('pg');
require('dotenv').config();

// Create a connection pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false // Required for Supabase
    }
});

// Test database connection
pool.connect((err, client, release) => {
    if (err) {
        console.error('❌ Database connection error:', err.message);
    } else {
        console.log('✅ Connected to PostgreSQL database (Supabase)');
        release();
    }
});

// Database helper functions
const db = {
    // Query function
    async query(text, params) {
        try {
            const result = await pool.query(text, params);
            return result;
        } catch (error) {
            console.error('Database query error:', error);
            throw error;
        }
    },

    // Create users table
    async createTables() {
        const usersTable = `
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                phone VARCHAR(20) UNIQUE NOT NULL,
                full_name VARCHAR(100) NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                level INTEGER DEFAULT 1,
                sod_balance INTEGER DEFAULT 1000,
                toman_balance INTEGER DEFAULT 0,
                referral_code VARCHAR(20) UNIQUE,
                referral_link VARCHAR(500),
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );
        `;

        const transactionsTable = `
            CREATE TABLE IF NOT EXISTS transactions (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                type VARCHAR(50) NOT NULL,
                amount INTEGER NOT NULL,
                currency VARCHAR(10) NOT NULL,
                status VARCHAR(20) DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT NOW()
            );
        `;

        try {
            await this.query(usersTable);
            console.log('✅ Users table created/verified');
            
            await this.query(transactionsTable);
            console.log('✅ Transactions table created/verified');
            
            return true;
        } catch (error) {
            console.error('Error creating tables:', error);
            return false;
        }
    },

    // Insert a new user
    async insertUser(userData) {
        const query = `
            INSERT INTO users (phone, full_name, password_hash, level, sod_balance, referral_code, referral_link)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id, phone, full_name, level, sod_balance, referral_code, created_at;
        `;
        
        const values = [
            userData.phone,
            userData.full_name,
            userData.password_hash,
            userData.level || 1,
            userData.sod_balance || 1000,
            userData.referral_code,
            userData.referral_link
        ];
        
        return this.query(query, values);
    },

    // Find user by phone
    async findUserByPhone(phone) {
        const query = `
            SELECT * FROM users 
            WHERE phone = $1 
            LIMIT 1;
        `;
        
        const result = await this.query(query, [phone]);
        return result.rows[0];
    },

    // Update user balance
    async updateUserBalance(userId, sodAmount = 0, tomanAmount = 0) {
        const query = `
            UPDATE users 
            SET sod_balance = sod_balance + $1,
                toman_balance = toman_balance + $2,
                updated_at = NOW()
            WHERE id = $3
            RETURNING sod_balance, toman_balance;
        `;
        
        return this.query(query, [sodAmount, tomanAmount, userId]);
    }
};

// Export database functions
module.exports = db;
