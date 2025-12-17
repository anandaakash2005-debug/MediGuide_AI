// auth.js
import { storage, STORAGE_KEYS } from './storage.js';

const API_BASE =
    location.hostname === 'localhost'
        ? 'http://localhost:3001'
        : 'https://mediguideai-production.up.railway.app';

let pendingUser = null;

// DOM Elements
const authForm = document.getElementById('auth-form');
const otpSection = document.getElementById('otp-section');
const authModeTitle = document.getElementById('auth-mode-title');
const authSubmitBtn = document.getElementById('auth-submit-btn');
const authBtnText = document.getElementById('auth-btn-text');
const authBtnLoader = document.getElementById('auth-btn-loader');
const authError = document.getElementById('auth-error');
const authEmail = document.getElementById('auth-email');
const authPhone = document.getElementById('auth-phone');
const otpInput = document.getElementById('otp-input');
const verifyOtpBtn = document.getElementById('verify-otp-btn');

// Redirect if already logged in
const user = storage.get(STORAGE_KEYS.USER);
if (user) {
    window.location.href = 'dashboard.html';
}

// Hide toggle elements — use OTP-only flow
const authSwitchBtn = document.getElementById('auth-switch-btn');
const authSwitchText = document.getElementById('auth-switch-text');
if (authSwitchBtn) authSwitchBtn.style.display = 'none';
if (authSwitchText) authSwitchText.style.display = 'none';

// Set UI for OTP-only auth
authModeTitle.textContent = 'Continue with Email';
authBtnText.textContent = 'Send OTP';

// Form submit: send OTP
authForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = authEmail?.value.trim();
    const phone = authPhone?.value.trim();

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
        showError('Please enter a valid email');
        return;
    }

    // Validate phone (required by backend)
    if (!phone) {
        showError('Phone number is required');
        return;
    }

    setLoading(true);
    hideError();

    try {
        const res = await fetch(`${API_BASE}/send-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
            throw new Error(data.error || 'Failed to send OTP');
        }

        // Save pending user
        pendingUser = {
            email,
            phone,
            displayName: email.split('@')[0],
        };

        // Switch to OTP input
        authForm.style.display = 'none';
        otpSection.style.display = 'block';
    } catch (err) {
        console.error(err);
        showError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
        setLoading(false);
    }
});

// OTP Verification
verifyOtpBtn?.addEventListener('click', async () => {
    const otp = otpInput?.value.trim();

    if (!otp || !/^\d{6}$/.test(otp)) {
        showError('Please enter a valid 6-digit OTP');
        return;
    }

    if (!pendingUser) {
        showError('No active session. Please start again.');
        return;
    }

    setLoading(true);
    hideError();

    try {
        const res = await fetch(`${API_BASE}/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: pendingUser.email,
                otp,
                fullName: pendingUser.displayName,
                phone: pendingUser.phone,
            }),
        });

        let data;
        try {
            data = await res.json();
        } catch {
            throw new Error('Invalid server response');
        }

        if (res.ok && data.success) {
            storage.set(STORAGE_KEYS.USER, {
                email: pendingUser.email,
                displayName: pendingUser.displayName,
                phone: pendingUser.phone,
            });
            window.location.href = 'dashboard.html';
        } else {
            throw new Error(data.error || 'OTP verification failed');
        }
    } catch (err) {
        console.error(err);
        showError(err.message || 'Verification failed. Please try again.');
    } finally {
        setLoading(false);
    }
});

// Google Auth (mock for demo)
const googleBtn = document.getElementById('google-auth-btn');
if (googleBtn) {
    googleBtn.addEventListener('click', () => {
        const userData = {
            email: 'demo.user@example.com',
            displayName: 'Demo User',
        };
        storage.set(STORAGE_KEYS.USER, userData);
        window.location.href = 'dashboard.html';
    });
}

// Utility functions
function setLoading(loading) {
    if (authSubmitBtn) authSubmitBtn.disabled = loading;
    if (authBtnText) authBtnText.style.display = loading ? 'none' : 'inline';
    if (authBtnLoader) authBtnLoader.style.display = loading ? 'inline-block' : 'none';
}

function showError(message) {
    if (authError) {
        authError.textContent = message;
        authError.style.display = 'block';
    }
}

function hideError() {
    if (authError) authError.style.display = 'none';
}