// Authentication and API management
const API_BASE_URL = 'http://localhost:3000/api';

// Global auth state
let currentUser = null;
let authToken = null;

// Initialize auth on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔐 Auth.js DOM loaded');
    loadAuthFromStorage();
    checkAuthState();
    setupAuthForms();
    console.log('✅ Auth initialization complete');
});

// Load saved auth state from localStorage
function loadAuthFromStorage() {
    // Check both old and new storage keys for compatibility
    const savedToken = localStorage.getItem('token') || localStorage.getItem('authToken');
    const savedUser = localStorage.getItem('user') || localStorage.getItem('currentUser');
    
    console.log('🗂️ Loading from storage:', { savedToken: !!savedToken, savedUser: !!savedUser });
    console.log('💾 localStorage content:', {
        token: localStorage.getItem('token'),
        user: localStorage.getItem('user'),
        authToken: localStorage.getItem('authToken'),
        currentUser: localStorage.getItem('currentUser')
    });
    
    if (savedToken && savedUser) {
        authToken = savedToken;
        currentUser = JSON.parse(savedUser);
        
        console.log('👤 Loaded user:', currentUser);
        
        // Update to use consistent keys
        localStorage.setItem('token', savedToken);
        localStorage.setItem('user', savedUser);
        localStorage.setItem('authToken', savedToken);
        localStorage.setItem('currentUser', savedUser);
        
        updateUIForLoggedInUser();
    } else {
        console.log('❌ No saved auth data found');
    }
}

// Check if user is authenticated
function isAuthenticated() {
    return authToken && currentUser;
}

// Update UI based on auth state
function updateUIForLoggedInUser() {
    const userInfo = document.getElementById('userInfo');
    const authButtons = document.getElementById('authButtons');
    const userName = document.getElementById('userName');
    
    console.log('🔍 UpdateUI called. Auth status:', isAuthenticated(), 'User:', currentUser);
    
    if (isAuthenticated()) {
        console.log('✅ User authenticated, showing user info');
        if (userInfo) userInfo.style.display = 'flex';
        if (authButtons) authButtons.style.display = 'none';
        
        // Hiển thị tên và role
        const roleIcon = currentUser.role === 'admin' ? '👑' : '👤';
        if (userName) {
            userName.textContent = `${roleIcon} ${currentUser.username}`;
            console.log('👤 Set username:', userName.textContent);
        }
        
        // Thêm nút Admin Panel nếu là admin
        addAdminButtonIfNeeded();
    } else {
        console.log('❌ User not authenticated, showing login buttons');
        if (userInfo) userInfo.style.display = 'none';
        if (authButtons) authButtons.style.display = 'flex';
    }
}

// Thêm nút Admin Panel cho admin users
function addAdminButtonIfNeeded() {
    if (currentUser && currentUser.role === 'admin') {
        const userSection = document.getElementById('userSection');
        let adminBtn = document.getElementById('adminPanelBtn');
        
        if (!adminBtn) {
            adminBtn = document.createElement('a');
            adminBtn.id = 'adminPanelBtn';
            adminBtn.href = 'admin.html';
            adminBtn.className = 'auth-btn admin-btn';
            adminBtn.innerHTML = '<i class="fas fa-shield-alt"></i> Admin Panel';
            adminBtn.style.cssText = `
                background: linear-gradient(135deg, #e74c3c, #c0392b);
                margin-left: 10px;
                animation: pulse 2s infinite;
            `;
            
            const userInfo = document.getElementById('userInfo');
            userInfo.appendChild(adminBtn);
        }
    }
}

// Setup form event listeners
function setupAuthForms() {
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

// Check authentication state on app load
function checkAuthState() {
    if (isAuthenticated()) {
        // Verify token is still valid
        verifyToken().catch(() => {
            logout();
        });
    }
    updateUIForLoggedInUser();
}

// Verify token with server
async function verifyToken() {
    try {
        const response = await fetch(`${API_BASE_URL}/verify`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Token invalid');
        }
        
        return true;
    } catch (error) {
        console.error('Token verification failed:', error);
        throw error;
    }
}

// Handle login form submission
async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!username || !password) {
        showToast('Vui lòng điền đầy đủ thông tin', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Login successful
            authToken = data.token;
            currentUser = data.user;
            
            // Save to localStorage (use both keys for compatibility)
            localStorage.setItem('token', authToken);
            localStorage.setItem('user', JSON.stringify(currentUser));
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            // Update UI
            updateUIForLoggedInUser();
            closeAuthModal();
            showToast(data.message || 'Đăng nhập thành công!', 'success');
            
            // Clear form
            document.getElementById('loginForm').reset();
            
        } else {
            showToast(data.error || 'Đăng nhập thất bại', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showToast('Lỗi kết nối. Vui lòng thử lại sau.', 'error');
    }
}

// Handle register form submission
async function handleRegister(e) {
    e.preventDefault();
    
    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    
    if (!username || !email || !password) {
        showToast('Vui lòng điền đầy đủ thông tin', 'error');
        return;
    }
    
    if (password.length < 6) {
        showToast('Mật khẩu phải có ít nhất 6 ký tự', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Registration successful
            authToken = data.token;
            currentUser = data.user;
            
            // Save to localStorage (use both keys for compatibility)
            localStorage.setItem('token', authToken);
            localStorage.setItem('user', JSON.stringify(currentUser));
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            // Update UI
            updateUIForLoggedInUser();
            closeAuthModal();
            showToast(data.message || 'Đăng ký thành công!', 'success');
            
            // Clear form
            document.getElementById('registerForm').reset();
            
        } else {
            showToast(data.error || 'Đăng ký thất bại', 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showToast('Lỗi kết nối. Vui lòng thử lại sau.', 'error');
    }
}

// Logout function
function logout() {
    authToken = null;
    currentUser = null;
    
    // Clear all localStorage keys
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    
    // Update UI
    updateUIForLoggedInUser();
    showToast('Đã đăng xuất', 'info');
    
    // Close chatbox if open
    const chatBox = document.getElementById('chatBox');
    if (chatBox && chatBox.style.display !== 'none') {
        closeChatBox();
    }
}

// Show auth modal
function showAuthModal(defaultTab = 'login') {
    const modal = document.getElementById('authModal');
    modal.style.display = 'block';
    setTimeout(() => modal.classList.add('show'), 10);
    
    // Set the default tab
    switchTab(defaultTab);
}

// For backward compatibility
function showLoginModal() {
    showAuthModal('login');
}

function showRegisterModal() {
    showAuthModal('register');
}

// Close auth modal
function closeAuthModal() {
    const modal = document.getElementById('authModal');
    modal.classList.remove('show');
    setTimeout(() => modal.style.display = 'none', 300);
}

// Close modal function (for backward compatibility)
function closeModal(modalId) {
    if (modalId === 'loginModal' || modalId === 'registerModal' || modalId === 'authModal') {
        closeAuthModal();
    } else {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => modal.style.display = 'none', 300);
        }
    }
}

// Switch between tabs
function switchTab(tabName) {
    // Update tab buttons
    const loginTab = document.getElementById('loginTab');
    const registerTab = document.getElementById('registerTab');
    const loginPane = document.getElementById('loginPane');
    const registerPane = document.getElementById('registerPane');
    
    if (tabName === 'login') {
        loginTab.classList.add('active');
        registerTab.classList.remove('active');
        loginPane.classList.add('active');
        registerPane.classList.remove('active');
    } else if (tabName === 'register') {
        registerTab.classList.add('active');
        loginTab.classList.remove('active');
        registerPane.classList.add('active');
        loginPane.classList.remove('active');
    }
}

// Switch between login and register (for backward compatibility)
function switchToRegister() {
    switchTab('register');
}

function switchToLogin() {
    switchTab('login');
}

// Toast notification system
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// API call wrapper with authentication
async function authenticatedFetch(url, options = {}) {
    if (!isAuthenticated()) {
        showToast('Vui lòng đăng nhập để sử dụng tính năng này', 'error');
        showLoginModal();
        throw new Error('Not authenticated');
    }
    
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
        ...options.headers
    };
    
    const response = await fetch(url, {
        ...options,
        headers
    });
    
    if (response.status === 401 || response.status === 403) {
        // Token expired or invalid
        logout();
        showToast('Phiên đăng nhập đã hết hạn', 'error');
        throw new Error('Authentication failed');
    }
    
    return response;
}

// Send message to AI with authentication
async function sendAIMessage(message, subject) {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/chat`, {
            method: 'POST',
            body: JSON.stringify({ message, subject })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            return data.response;
        } else {
            throw new Error(data.error || 'Lỗi AI response');
        }
    } catch (error) {
        console.error('AI message error:', error);
        throw error;
    }
}

// Load chat history for a subject
async function loadChatHistory(subject) {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/chat-history/${encodeURIComponent(subject)}`);
        
        if (response.ok) {
            const history = await response.json();
            return history;
        } else {
            console.error('Failed to load chat history');
            return [];
        }
    } catch (error) {
        console.error('Chat history error:', error);
        return [];
    }
}

// Save quiz progress
async function saveQuizProgress(subject, score, totalQuestions) {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/quiz-progress`, {
            method: 'POST',
            body: JSON.stringify({ subject, score, totalQuestions })
        });
        
        if (response.ok) {
            console.log('Quiz progress saved');
        }
    } catch (error) {
        console.error('Save quiz progress error:', error);
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    const authModal = document.getElementById('authModal');
    if (event.target === authModal) {
        closeAuthModal();
    }
    
    // Handle other modals if any
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal && modal.id !== 'authModal') {
            closeModal(modal.id);
        }
    });
} 