import { storage, STORAGE_KEYS } from './storage.js';

const user = storage.get(STORAGE_KEYS.USER);
const notificationsEnabled = storage.get(STORAGE_KEYS.NOTIFICATIONS_ENABLED) !== false;
const userLocation = storage.get(STORAGE_KEYS.USER_LOCATION) || '';

// Update user info
if (user) {
    document.getElementById('user-name').textContent = user.displayName || 'User';
    document.getElementById('user-email').textContent = user.email || '';
    document.getElementById('user-phone').textContent = user.phone || 'Not provided';
    document.getElementById('logout-btn').style.display = 'block';
} else {
    document.getElementById('user-name').textContent = 'Guest User';
    document.getElementById('user-email').textContent = 'Not signed in';
}

// Set form values
document.getElementById('notifications-toggle').checked = notificationsEnabled;
document.getElementById('user-location').value = userLocation;

// Save settings
document.getElementById('save-settings-btn').addEventListener('click', () => {
    const notifications = document.getElementById('notifications-toggle').checked;
    const location = document.getElementById('user-location').value;

    storage.set(STORAGE_KEYS.NOTIFICATIONS_ENABLED, notifications);
    if (location) {
        storage.set(STORAGE_KEYS.USER_LOCATION, location);
    }

    alert('Settings saved!');
});

// Logout
document.getElementById('logout-btn').addEventListener('click', () => {
    if (confirm('Are you sure you want to log out?')) {
        storage.remove(STORAGE_KEYS.USER);
        window.location.href = 'index.html';
    }
});

