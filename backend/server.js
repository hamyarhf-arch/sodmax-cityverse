const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
    res.json({ 
        message: '🚀 SODmAX CityVerse Backend is running!',
        version: '2.0.0',
        endpoints: {
            auth: '/api/auth',
            users: '/api/users',
            mining: '/api/mining',
            missions: '/api/missions'
        }
    });
});

// Auth routes
app.post('/api/auth/register', (req, res) => {
    console.log('📝 Register attempt:', req.body);
    res.json({
        success: true,
        message: 'ثبت‌نام موفق (آزمایشی)',
        data: {
            user: {
                id: 1,
                name: req.body.name,
                phone: req.body.phone,
                level: 1,
                sod_balance: 1000
            },
            token: 'test_jwt_token_' + Date.now()
        }
    });
});

app.post('/api/auth/login', (req, res) => {
    console.log('🔐 Login attempt:', req.body);
    res.json({
        success: true,
        message: 'ورود موفق (آزمایشی)',
        data: {
            user: {
                id: 1,
                name: 'کاربر تست',
                phone: req.body.phone,
                level: 5,
                sod_balance: 1845200,
                toman_balance: 28400
            },
            token: 'test_jwt_token_' + Date.now()
        }
    });
});

// Mining routes
app.post('/api/mining/manual', (req, res) => {
    console.log('⚡ Manual mining request');
    res.json({
        success: true,
        message: 'استخراج موفق',
        data: {
            mined: 180,
            total_balance: 1845380
        }
    });
});

app.post('/api/mining/upgrade', (req, res) => {
    console.log('⬆️ Upgrade miner request');
    res.json({
        success: true,
        message: 'ارتقاء موفق',
        data: {
            new_level: 4,
            new_power: 20
        }
    });
});

// User routes
app.get('/api/users/profile', (req, res) => {
    res.json({
        success: true,
        data: {
            user: {
                id: 1,
                name: 'علی محمدی',
                phone: '09123456789',
                level: 5,
                total_earned: 124500,
                referral_count: 24,
                join_date: '۱۴۰۲/۰۵/۱۰'
            }
        }
    });
});

// Mission routes
app.get('/api/missions/active', (req, res) => {
    res.json({
        success: true,
        data: {
            missions: [
                {
                    id: 1,
                    title: '۱۰۰ کلیک در بازی',
                    reward: 500,
                    progress: 45,
                    max: 100
                },
                {
                    id: 2,
                    title: 'دعوت ۵ دوست',
                    reward: 1000,
                    progress: 2,
                    max: 5
                }
            ]
        }
    });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📡 API Base URL: http://localhost:${PORT}/api`);
});
