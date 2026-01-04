// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

// Global State
let currentUser = null;
let userToken = null;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is already logged in
    const savedUser = localStorage.getItem('sodmax_user');
    const savedToken = localStorage.getItem('sodmax_token');
    
    if (savedUser && savedToken) {
        currentUser = JSON.parse(savedUser);
        userToken = savedToken;
        showApp();
        updateUI();
    } else {
        showAuth();
    }
    
    // Setup form events
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Register form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
}

// Handle login
async function handleLogin(e) {
    e.preventDefault();
    
    const phone = document.getElementById('loginPhone').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!phone || !password) {
        showMessage('authMessage', 'لطفاً شماره موبایل و رمز عبور را وارد کنید', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ phone, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Save user data
            currentUser = data.data.user;
            userToken = data.data.token;
            
            localStorage.setItem('sodmax_user', JSON.stringify(currentUser));
            localStorage.setItem('sodmax_token', userToken);
            
            showMessage('authMessage', 'ورود موفق!', 'success');
            setTimeout(() => {
                showApp();
                updateUI();
                showToast('👋 خوش آمدید', 'به SODmAX CityVerse خوش آمدید!');
            }, 1000);
        } else {
            showMessage('authMessage', data.message, 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showMessage('authMessage', 'خطا در ارتباط با سرور', 'error');
        
        // Fallback to test data
        useTestData();
    }
}

// Handle registration
async function handleRegister(e) {
    e.preventDefault();
    
    const name = document.getElementById('registerName').value;
    const phone = document.getElementById('registerPhone').value;
    const password = document.getElementById('registerPassword').value;
    const referral = document.getElementById('registerReferral').value;
    
    if (!name || !phone || !password) {
        showMessage('registerMessage', 'لطفاً تمام فیلدهای ضروری را پر کنید', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name,
                phone,
                password,
                referral_code: referral || null
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showMessage('registerMessage', 'ثبت‌نام موفق!', 'success');
            setTimeout(() => {
                showLogin();
            }, 1500);
        } else {
            showMessage('registerMessage', data.message, 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showMessage('registerMessage', 'خطا در ارتباط با سرور', 'error');
    }
}

// Manual mining
async function manualMine() {
    try {
        const response = await fetch(`${API_BASE_URL}/mining/manual`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${userToken}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Update user balance
            currentUser.sod_balance = data.data.total_balance;
            updateUI();
            showToast('⚡ استخراج موفق', `+${data.data.mined} SOD دریافت کردید!`);
            
            // Create mining effect
            createMiningEffect(data.data.mined);
        }
    } catch (error) {
        console.error('Mining error:', error);
        // Fallback
        currentUser.sod_balance += 180;
        updateUI();
        showToast('⚡ استخراج موفق', '+180 SOD دریافت کردید!');
        createMiningEffect(180);
    }
}

// Upgrade miner
async function upgradeMiner() {
    try {
        const response = await fetch(`${API_BASE_URL}/mining/upgrade`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${userToken}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentUser.level = data.data.new_level;
            updateUI();
            showToast('🆙 ارتقاء موفق', `سطح ماینر به ${data.data.new_level} رسید!`);
        }
    } catch (error) {
        console.error('Upgrade error:', error);
        // Fallback
        currentUser.level += 1;
        updateUI();
        showToast('🆙 ارتقاء موفق', `سطح ماینر به ${currentUser.level} رسید!`);
    }
}

// Load missions
async function loadMissions() {
    try {
        const response = await fetch(`${API_BASE_URL}/missions/active`, {
            headers: {
                'Authorization': `Bearer ${userToken}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            displayMissions(data.data.missions);
        }
    } catch (error) {
        console.error('Missions error:', error);
        // Fallback to test missions
        displayMissions(testMissions);
    }
}

// Display missions
function displayMissions(missions) {
    const missionsList = document.getElementById('missionsList');
    if (!missionsList) return;
    
    missionsList.innerHTML = '';
    
    missions.forEach(mission => {
        const progressPercent = (mission.progress / mission.max) * 100;
        
        const missionElement = document.createElement('div');
        missionElement.className = 'mission-item';
        missionElement.innerHTML = `
            <div class="mission-header">
                <div class="mission-title">${mission.title}</div>
                <div class="mission-reward">+${mission.reward} تومان</div>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${progressPercent}%"></div>
            </div>
            <div class="progress-text">
                <span>پیشرفت</span>
                <span>${mission.progress}/${mission.max}</span>
            </div>
        `;
        
        missionsList.appendChild(missionElement);
    });
}

// Update UI with user data
function updateUI() {
    if (!currentUser) return;
    
    // Update user info
    document.getElementById('userAvatar').textContent = 
        currentUser.name ? currentUser.name.charAt(0) : 'ع';
    document.getElementById('userName').textContent = currentUser.name || 'کاربر تست';
    document.getElementById('userLevel').textContent = currentUser.level || 5;
    
    // Update balances
    document.getElementById('sodBalance').textContent = 
        formatNumber(currentUser.sod_balance || 1845200);
    document.getElementById('tomanBalance').textContent = 
        formatNumber(currentUser.toman_balance || 28400);
    document.getElementById('referralCount').textContent = 
        currentUser.referral_count || 24;
    
    // Update mining reward
    const miningPower = (currentUser.level || 5) * 3.6;
    document.getElementById('clickReward').textContent = `+${Math.round(miningPower)} SOD`;
    
    // Load missions
    loadMissions();
}

// Show auth screen
function showAuth() {
    document.getElementById('authContainer').classList.remove('hidden');
    document.getElementById('appContainer').classList.add('hidden');
    showLogin();
}

// Show app screen
function showApp() {
    document.getElementById('authContainer').classList.add('hidden');
    document.getElementById('appContainer').classList.remove('hidden');
}

// Show login form
function showLogin() {
    document.getElementById('loginCard').classList.remove('hidden');
    document.getElementById('registerCard').classList.add('hidden');
    document.getElementById('authMessage').classList.add('hidden');
}

// Show register form
function showRegister() {
    document.getElementById('loginCard').classList.add('hidden');
    document.getElementById('registerCard').classList.remove('hidden');
    document.getElementById('registerMessage').classList.add('hidden');
}

// Show section
function showSection(sectionId) {
    // Update active button
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const activeBtn = document.querySelector(`.nav-btn[onclick*="${sectionId}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
    
    // In a real app, you would load different content here
    showToast('📱 تغییر بخش', `بخش ${sectionId} به زودی نمایش داده می‌شود`);
}

// Logout
function logout() {
    if (confirm('آیا از خروج از حساب کاربری خود مطمئن هستید؟')) {
        currentUser = null;
        userToken = null;
        localStorage.removeItem('sodmax_user');
        localStorage.removeItem('sodmax_token');
        showAuth();
        showToast('👋 خارج شدید', 'با موفقیت از حساب کاربری خارج شدید');
    }
}

// Show message
function showMessage(elementId, message, type) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    element.textContent = message;
    element.className = `message ${type}`;
    element.classList.remove('hidden');
    
    // Auto hide after 5 seconds
    setTimeout(() => {
        element.classList.add('hidden');
    }, 5000);
}

// Show toast notification
function showToast(title, message) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas fa-check"></i>
        </div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
    `;
    
    container.appendChild(toast);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-20px)';
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

// Create mining effect
function createMiningEffect(amount) {
    const minerCircle = document.querySelector('.miner-circle');
    if (!minerCircle) return;
    
    const effect = document.createElement('div');
    effect.style.position = 'absolute';
    effect.style.background = 'rgba(0, 102, 255, 0.2)';
    effect.style.color = '#3395FF';
    effect.style.fontWeight = '900';
    effect.style.fontSize = '20px';
    effect.style.padding = '8px 16px';
    effect.style.borderRadius = '20px';
    effect.style.backdropFilter = 'blur(10px)';
    effect.style.border = '1px solid rgba(0, 102, 255, 0.3)';
    effect.style.zIndex = '1000';
    effect.style.pointerEvents = 'none';
    effect.textContent = `+${amount} SOD`;
    
    const rect = minerCircle.getBoundingClientRect();
    effect.style.left = `${rect.left + rect.width / 2}px`;
    effect.style.top = `${rect.top + rect.height / 2}px`;
    effect.style.transform = 'translate(-50%, -50%)';
    
    document.body.appendChild(effect);
    
    // Animation
    let opacity = 1;
    let y = 0;
    const animation = setInterval(() => {
        opacity -= 0.02;
        y -= 2;
        effect.style.opacity = opacity;
        effect.style.transform = `translate(-50%, ${y}px)`;
        
        if (opacity <= 0) {
            clearInterval(animation);
            effect.remove();
        }
    }, 16);
}

// Format numbers
function formatNumber(num) {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Fallback to test data
function useTestData() {
    currentUser = {
        id: 1,
        name: 'علی محمدی',
        phone: '09123456789',
        level: 5,
        sod_balance: 1845200,
        toman_balance: 28400,
        referral_count: 24
    };
    
    userToken = 'test_token_' + Date.now();
    
    localStorage.setItem('sodmax_user', JSON.stringify(currentUser));
    localStorage.setItem('sodmax_token', userToken);
    
    showApp();
    updateUI();
    showToast('🧪 حالت آزمایشی', 'در حال استفاده از داده‌های تست');
}
