// Authentication and API management
const API_BASE_URL = 'http://localhost:3000/api';

// Global auth state
let currentUser = null;
let authToken = null;

// Initialize auth on page load
document.addEventListener('DOMContentLoaded', function() {
    loadAuthFromStorage();
    checkAuthState();
    setupAuthForms();
});

// Load saved auth state from localStorage
function loadAuthFromStorage() {
    const savedToken = localStorage.getItem('authToken');
    const savedUser = localStorage.getItem('currentUser');
    
    if (savedToken && savedUser) {
        authToken = savedToken;
        currentUser = JSON.parse(savedUser);
        updateUIForLoggedInUser();
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
    
    if (isAuthenticated()) {
        userInfo.style.display = 'flex';
        authButtons.style.display = 'none';
        userName.textContent = currentUser.username;
    } else {
        userInfo.style.display = 'none';
        authButtons.style.display = 'flex';
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
            
            // Save to localStorage
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            // Update UI
            updateUIForLoggedInUser();
            closeModal('loginModal');
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
            
            // Save to localStorage
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            // Update UI
            updateUIForLoggedInUser();
            closeModal('registerModal');
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
    
    // Clear localStorage
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

// Show modal functions
function showLoginModal() {
    const modal = document.getElementById('loginModal');
    modal.style.display = 'block';
    setTimeout(() => modal.classList.add('show'), 10);
}

function showRegisterModal() {
    const modal = document.getElementById('registerModal');
    modal.style.display = 'block';
    setTimeout(() => modal.classList.add('show'), 10);
}

// Close modal function
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('show');
    setTimeout(() => modal.style.display = 'none', 300);
}

// Switch between login and register modals
function switchToRegister() {
    closeModal('loginModal');
    setTimeout(() => showRegisterModal(), 300);
}

function switchToLogin() {
    closeModal('registerModal');
    setTimeout(() => showLoginModal(), 300);
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
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            closeModal(modal.id);
        }
    });
} 