const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./database');

class AuthService {
    // Register new user
    static async register(userData) {
        try {
            // Check if user exists
            const existingUser = await db.findUserByPhone(userData.phone);
            if (existingUser) {
                return {
                    success: false,
                    message: 'این شماره موبایل قبلاً ثبت‌نام کرده است'
                };
            }

            // Hash password
            const passwordHash = await bcrypt.hash(userData.password, 10);

            // Generate referral code
            const referralCode = this.generateReferralCode(userData.full_name);

            // Prepare user data
            const newUser = {
                phone: userData.phone,
                full_name: userData.full_name,
                password_hash: passwordHash,
                level: 1,
                sod_balance: 1000,
                referral_code: referralCode,
                referral_link: `https://sodmax.city/invite/${referralCode}`
            };

            // Add referral bonus if code provided
            if (userData.referral_code) {
                const referrer = await db.findUserByReferralCode(userData.referral_code);
                if (referrer) {
                    // Add bonus to referrer
                    await db.updateUserBalance(referrer.id, 0, 1000);
                    newUser.sod_balance += 500; // Bonus for new user
                }
            }

            // Save to database
            const result = await db.insertUser(newUser);
            const user = result.rows[0];

            // Generate token
            const token = jwt.sign(
                { userId: user.id, phone: user.phone },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );

            // Remove password hash from response
            delete user.password_hash;

            return {
                success: true,
                message: 'ثبت‌نام موفق',
                data: { user, token }
            };

        } catch (error) {
            console.error('Registration error:', error);
            return {
                success: false,
                message: 'خطا در ثبت‌نام'
            };
        }
    }

    // Login user
    static async login(phone, password) {
        try {
            // Find user
            const user = await db.findUserByPhone(phone);
            if (!user) {
                return {
                    success: false,
                    message: 'شماره موبایل یا رمز عبور اشتباه است'
                };
            }

            // Verify password
            const isValidPassword = await bcrypt.compare(password, user.password_hash);
            if (!isValidPassword) {
                return {
                    success: false,
                    message: 'شماره موبایل یا رمز عبور اشتباه است'
                };
            }

            // Generate token
            const token = jwt.sign(
                { userId: user.id, phone: user.phone },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );

            // Remove password hash from response
            delete user.password_hash;

            return {
                success: true,
                message: 'ورود موفق',
                data: { user, token }
            };

        } catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                message: 'خطا در ورود'
            };
        }
    }

    // Generate referral code
    static generateReferralCode(name) {
        const namePart = name.replace(/\s/g, '').substring(0, 3).toUpperCase();
        const randomPart = Math.floor(10000 + Math.random() * 90000);
        return `${namePart}${randomPart}`;
    }

    // Verify token
    static verifyToken(token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            return { success: true, data: decoded };
        } catch (error) {
            return { success: false, message: 'توکن نامعتبر است' };
        }
    }
}

module.exports = AuthService;
