import { storage, STORAGE_KEYS } from './storage.js';

const API_BASE =
    location.hostname === "localhost"
        ? "http://localhost:3001"
        : "https://mediguideai-production.up.railway.app";



let isLogin = true;
let pendingUser = null; // temp store before OTP verify



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
document.getElementById("auth-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById('auth-email').value;
    const phone = document.getElementById('auth-phone')?.value;
    const password = document.getElementById('auth-password')?.value;

    if (!password || password.length < 6) {
        showError("Password must be at least 6 characters");
        setLoading(false);
        return;
    }



    setLoading(true);
    hideError();


    try {

        if (isLogin) {
            if (!email) {
                showError("Email is required");
                setLoading(false);
                return;
            }

            const userData = {
                uid: Date.now().toString(),
                email,
                displayName: email.split('@')[0],
            };

            storage.set(STORAGE_KEYS.USER, userData);
            window.location.href = 'dashboard.html';
            return;
        }


        if (!phone) {
            showError("Phone number is required");
            setLoading(false);
            return;
        }

        pendingUser = {
            uid: Date.now().toString(),
            email,
            phone,
            displayName: email.split('@')[0],
        };

        const res = await fetch(`${API_BASE}/send-otp`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
        });


        const data = await res.json();

        if (!data.success) {
            showError("Failed to send OTP");
            setLoading(false);
            return;
        }


        // Show OTP section
        document.getElementById("otp-section").style.display = "block";
        setLoading(false);
        return;


    } catch (err) {
        showError(err.message || 'Authentication failed');
    } finally {
        setLoading(false);
    }
});

const googleBtn = document.getElementById("google-auth-btn");


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

// ✅ 6️⃣ PLACE OTP VERIFY CODE HERE (THIS IS THE ANSWER)
document.getElementById("verify-otp-btn")?.addEventListener("click", async () => {
    const otp = document.getElementById("otp-input").value;

    if (!otp || otp.length !== 6) {
        showError("Please enter a valid 6-digit OTP");
        return;
    }


    if (!pendingUser) {
        showError("No signup in progress");
        return;
    }

    const res = await fetch(`${API_BASE}/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            email: pendingUser.email,
            otp,
            fullName: pendingUser.displayName,
            phone: pendingUser.phone
        }),
    });


    const data = await res.json();

    if (data.success) {
        storage.set(STORAGE_KEYS.USER, pendingUser);
        window.location.href = "dashboard.html";
    } else {
        showError(data.error || "OTP verification failed");
    }
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

