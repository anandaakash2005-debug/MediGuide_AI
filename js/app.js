import { generateHealthPlan } from './api.js';
import { getCurrentLocation } from './api.js';
import { storage, STORAGE_KEYS } from './storage.js';

const form = document.getElementById('health-plan-form');
const diseaseInput = document.getElementById('disease-input');
const generateBtn = document.getElementById('generate-btn');
const btnText = document.getElementById('btn-text');
const btnLoader = document.getElementById('btn-loader');
const errorMessage = document.getElementById('error-message');

// Update nav based on user
const user = storage.get(STORAGE_KEYS.USER);
const loginLink = document.getElementById('login-link');
if (user) {
    loginLink.textContent = 'Profile';
    loginLink.href = 'profile.html';
} else {
    loginLink.textContent = 'Sign In';
    loginLink.href = 'login.html';
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const disease = diseaseInput.value.trim();
    if (!disease) {
        showError('Please enter a disease name');
        return;
    }

    setLoading(true);
    hideError();

    try {
        // Get user location if available
        let location = '';
        try {
            const position = await getCurrentLocation();
            location = `${position.lat},${position.lng}`;
        } catch (err) {
            console.log('Location not available');
        }

        const healthPlan = await generateHealthPlan(disease, location);

        // Store health plan
        storage.set(STORAGE_KEYS.HEALTH_PLAN, healthPlan);
        storage.set(STORAGE_KEYS.DISEASE, disease);

        // Navigate to health plan page
        window.location.href = 'health-plan.html';
    } catch (err) {
        showError(err.message || 'Something went wrong. Please try again.');
    } finally {
        setLoading(false);
    }
});

function setLoading(loading) {
    generateBtn.disabled = loading;
    if (loading) {
        btnText.style.display = 'none';
        btnLoader.style.display = 'inline-block';
    } else {
        btnText.style.display = 'inline';
        btnLoader.style.display = 'none';
    }
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
}

function hideError() {
    errorMessage.style.display = 'none';
}

