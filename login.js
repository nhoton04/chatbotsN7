// API Base URL
const API_BASE_URL = 'http://localhost:3000/api';

// Dark mode toggle
function toggleDarkMode() {
    document.body.classList.toggle('dark');
    localStorage.setItem('darkMode', document.body.classList.contains('dark'));
}

// Initialize dark mode
function initializeDarkMode() {
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    if (isDarkMode) {
        document.body.classList.add('dark');
    }
}

// Tab switching
function switchTab(tabName) {
    // Remove active class from all tabs and panes
    document.querySelectorAll('.modern-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.modern-tab-pane').forEach(pane => {
        pane.classList.remove('active');
    });
    
    // Add active class to selected tab and pane
    document.getElementById(tabName + 'Tab').classList.add('active');
    document.getElementById(tabName + 'Pane').classList.add('active');
    
    // Clear forms
    document.getElementById('loginForm').reset();
    document.getElementById('registerForm').reset();
}

// Show loading overlay
function showLoading() {
    document.getElementById('loadingOverlay').style.display = 'flex';
}

// Hide loading overlay
function hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
}

// Toast notification system
function showToast(message, type = 'info', duration = 3000) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
}

// API call wrapper
async function apiCall(endpoint, method = 'GET', data = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
    };
    
    if (data) {
        options.body = JSON.stringify(data);
    }
    
    const token = localStorage.getItem('token');
    if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'Something went wrong');
        }
        
        return result;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Login function
async function loginUser() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    if (!username || !password) {
        showToast('Vui lòng điền đầy đủ thông tin', 'error');
        return;
    }
    
    try {
        showLoading();
        
        const data = await apiCall('/auth/login', 'POST', {
            username,
            password
        });
        
        // Store token and user info
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        showToast(data.message || 'Đăng nhập thành công!', 'success');
        
        // Clear form
        document.getElementById('loginForm').reset();
        
        // Redirect to main page after 1 second
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
        
    } catch (error) {
        showToast(error.message || 'Có lỗi xảy ra khi đăng nhập', 'error');
    } finally {
        hideLoading();
    }
}

// Register function
async function registerUser() {
    const username = document.getElementById('registerUsername').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const acceptTerms = document.getElementById('acceptTerms').checked;
    
    // Validation
    if (!username || !email || !password || !confirmPassword) {
        showToast('Vui lòng điền đầy đủ thông tin', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showToast('Mật khẩu xác nhận không khớp', 'error');
        return;
    }
    
    if (password.length < 6) {
        showToast('Mật khẩu phải có ít nhất 6 ký tự', 'error');
        return;
    }
    
    if (!acceptTerms) {
        showToast('Vui lòng đồng ý với điều khoản sử dụng', 'error');
        return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showToast('Email không hợp lệ', 'error');
        return;
    }
    
    try {
        showLoading();
        
        const data = await apiCall('/auth/register', 'POST', {
            username,
            email,
            password
        });
        
        // Store token and user info
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        showToast(data.message || 'Đăng ký thành công!', 'success');
        
        // Clear form
        document.getElementById('registerForm').reset();
        
        // Redirect to main page after 1 second
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
        
    } catch (error) {
        showToast(error.message || 'Có lỗi xảy ra khi đăng ký', 'error');
    } finally {
        hideLoading();
    }
}

// Social login (placeholder)
function socialLogin(provider) {
    showToast(`Đăng nhập với ${provider} sẽ được hỗ trợ trong tương lai`, 'info');
}

// Form submission handlers
function setupFormHandlers() {
    // Login form
    document.getElementById('loginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        loginUser();
    });
    
    // Register form
    document.getElementById('registerForm').addEventListener('submit', function(e) {
        e.preventDefault();
        registerUser();
    });
    
    // Password confirmation validation
    document.getElementById('confirmPassword').addEventListener('input', function() {
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = this.value;
        
        if (password !== confirmPassword && confirmPassword.length > 0) {
            this.style.borderColor = '#e74c3c';
            this.style.boxShadow = '0 0 0 3px rgba(231, 76, 60, 0.1)';
        } else {
            this.style.borderColor = '#000';
            this.style.boxShadow = 'none';
        }
    });
    
    // Real-time email validation
    document.getElementById('registerEmail').addEventListener('input', function() {
        const email = this.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (!emailRegex.test(email) && email.length > 0) {
            this.style.borderColor = '#e74c3c';
            this.style.boxShadow = '0 0 0 3px rgba(231, 76, 60, 0.1)';
        } else {
            this.style.borderColor = '#000';
            this.style.boxShadow = 'none';
        }
    });
    
    // Real-time password strength validation
    document.getElementById('registerPassword').addEventListener('input', function() {
        const password = this.value;
        
        if (password.length < 6 && password.length > 0) {
            this.style.borderColor = '#e74c3c';
            this.style.boxShadow = '0 0 0 3px rgba(231, 76, 60, 0.1)';
        } else {
            this.style.borderColor = '#000';
            this.style.boxShadow = 'none';
        }
    });
}

// Check if user is already logged in
function checkAuthStatus() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
        // User is already logged in, redirect to main page
        showToast('Bạn đã đăng nhập rồi, đang chuyển về trang chủ...', 'info');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
    }
}

// Add keyboard shortcuts
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Alt + L for login tab
        if (e.altKey && e.key === 'l') {
            e.preventDefault();
            switchTab('login');
        }
        
        // Alt + R for register tab
        if (e.altKey && e.key === 'r') {
            e.preventDefault();
            switchTab('register');
        }
        
        // Alt + D for dark mode toggle
        if (e.altKey && e.key === 'd') {
            e.preventDefault();
            toggleDarkMode();
        }
        
        // Escape to clear forms
        if (e.key === 'Escape') {
            document.getElementById('loginForm').reset();
            document.getElementById('registerForm').reset();
        }
    });
}

// Add floating animation to elements
function animateFloatingElements() {
    const elements = document.querySelectorAll('.element');
    elements.forEach((element, index) => {
        element.style.animationDelay = `${index * 2}s`;
    });
}

// Add typing animation to welcome text
function animateWelcomeText() {
    const welcomeTexts = document.querySelectorAll('.welcome-header h2');
    
    welcomeTexts.forEach(text => {
        const originalText = text.innerHTML;
        text.innerHTML = '';
        let index = 0;
        
        function typeWriter() {
            if (index < originalText.length) {
                text.innerHTML += originalText.charAt(index);
                index++;
                setTimeout(typeWriter, 50);
            }
        }
        
        // Start typing animation after a delay
        setTimeout(typeWriter, 500);
    });
}

// Initialize page
function initializePage() {
    // Check if user is already logged in
    checkAuthStatus();
    
    // Initialize dark mode
    initializeDarkMode();
    
    // Setup form handlers
    setupFormHandlers();
    
    // Setup keyboard shortcuts
    setupKeyboardShortcuts();
    
    // Animate floating elements
    animateFloatingElements();
    
    // Animate welcome text
    setTimeout(animateWelcomeText, 1000);
    
    // Add focus to first input
    setTimeout(() => {
        document.getElementById('loginUsername').focus();
    }, 1500);
}

// URL parameters handling
function handleURLParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    
    if (tab === 'register') {
        switchTab('register');
    } else {
        switchTab('login');
    }
}

// Page visibility API - pause animations when page is hidden
function handlePageVisibility() {
    document.addEventListener('visibilitychange', function() {
        const elements = document.querySelectorAll('.element, .robot');
        
        if (document.hidden) {
            elements.forEach(el => {
                el.style.animationPlayState = 'paused';
            });
        } else {
            elements.forEach(el => {
                el.style.animationPlayState = 'running';
            });
        }
    });
}

// Error handling for network issues
window.addEventListener('online', function() {
    showToast('Kết nối Internet đã được khôi phục', 'success');
});

window.addEventListener('offline', function() {
    showToast('Mất kết nối Internet. Vui lòng kiểm tra kết nối của bạn.', 'error', 5000);
});

// Page load event
document.addEventListener('DOMContentLoaded', function() {
    // Handle URL parameters
    handleURLParameters();
    
    // Initialize page
    initializePage();
    
    // Handle page visibility
    handlePageVisibility();
    
    console.log('🎓 Trang đăng nhập đã được tải thành công!');
});

// Unload event - clean up
window.addEventListener('beforeunload', function() {
    // Clear any ongoing timeouts or intervals if needed
    hideLoading();
}); 