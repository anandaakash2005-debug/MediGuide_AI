import { storage, STORAGE_KEYS } from './storage.js';

let isLogin = true;

const authForm = document.getElementById('auth-form');
const authModeTitle = document.getElementById('auth-mode-title');
const authSubmitBtn = document.getElementById('auth-submit-btn');
const authBtnText = document.getElementById('auth-btn-text');
const authBtnLoader = document.getElementById('auth-btn-loader');
const authSwitchBtn = document.getElementById('auth-switch-btn');
const authSwitchText = document.getElementById('auth-switch-text');
const authError = document.getElementById('auth-error');

// Check if user is already logged in
const user = storage.get(STORAGE_KEYS.USER);
if (user) {
    window.location.href = 'dashboard.html';
}

// Toggle login/signup
authSwitchBtn.addEventListener('click', () => {
    isLogin = !isLogin;
    updateAuthMode();
});

function updateAuthMode() {
    if (isLogin) {
        authModeTitle.textContent = 'Sign In';
        authBtnText.textContent = 'Sign In';
        authSwitchText.textContent = "Don't have an account? ";
        authSwitchBtn.textContent = 'Sign up';
    } else {
        authModeTitle.textContent = 'Sign Up';
        authBtnText.textContent = 'Sign Up';
        authSwitchText.textContent = 'Already have an account? ';
        authSwitchBtn.textContent = 'Sign in';
    }
}

// Handle form submission
authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;

    setLoading(true);
    hideError();

    try {
        // Simple mock authentication (replace with real Firebase/auth)
        // For demo purposes, we'll just store user data
        const userData = {
            uid: Date.now().toString(),
            email,
            displayName: email.split('@')[0],
        };

        storage.set(STORAGE_KEYS.USER, userData);
        
        // Redirect to dashboard
        window.location.href = 'dashboard.html';
    } catch (err) {
        showError(err.message || 'Authentication failed');
    } finally {
        setLoading(false);
    }
});

// Google auth (mock)
document.getElementById('google-auth-btn').addEventListener('click', () => {
    const userData = {
        uid: Date.now().toString(),
        email: 'user@gmail.com',
        displayName: 'Google User',
    };

    storage.set(STORAGE_KEYS.USER, userData);
    window.location.href = 'dashboard.html';
});

function setLoading(loading) {
    authSubmitBtn.disabled = loading;
    if (loading) {
        authBtnText.style.display = 'none';
        authBtnLoader.style.display = 'inline-block';
    } else {
        authBtnText.style.display = 'inline';
        authBtnLoader.style.display = 'none';
    }
}

function showError(message) {
    authError.textContent = message;
    authError.style.display = 'block';
}

function hideError() {
    authError.style.display = 'none';
}

