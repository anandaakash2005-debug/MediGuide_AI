// Storage utility for localStorage
export const storage = {
    get(key) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return null;
        }
    },

    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Error writing to localStorage:', error);
            return false;
        }
    },

    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Error removing from localStorage:', error);
            return false;
        }
    },

    clear() {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('Error clearing localStorage:', error);
            return false;
        }
    }
};

// Storage keys
export const STORAGE_KEYS = {
    USER: 'mediguide_user',
    HEALTH_PLAN: 'mediguide_health_plan',
    DISEASE: 'mediguide_disease',
    REMINDERS: 'mediguide_reminders',
    NOTIFICATIONS_ENABLED: 'mediguide_notifications_enabled',
    USER_LOCATION: 'mediguide_user_location',
    INTERVALS: 'mediguide_intervals'
};

