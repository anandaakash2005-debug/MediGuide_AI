import { storage, STORAGE_KEYS } from './storage.js';

// Request notification permission
export function requestNotificationPermission() {
    if (!('Notification' in window)) {
        console.warn('This browser does not support notifications');
        return Promise.resolve('denied');
    }

    if (Notification.permission === 'granted') {
        return Promise.resolve('granted');
    }

    if (Notification.permission === 'denied') {
        return Promise.resolve('denied');
    }

    return Notification.requestPermission();
}

// Show notification
export function showNotification(title, options = {}) {
    if (Notification.permission === 'granted') {
        new Notification(title, {
            icon: '/icon-192x192.png',
            badge: '/icon-192x192.png',
            ...options,
        });
    }
}

// Schedule reminder
export function scheduleReminder(reminder, onDone) {
    const [hours, minutes] = reminder.time.split(':').map(Number);
    const now = new Date();
    const reminderTime = new Date();
    reminderTime.setHours(hours, minutes, 0, 0);

    // If time has passed today, schedule for tomorrow
    if (reminderTime < now) {
        reminderTime.setDate(reminderTime.getDate() + 1);
    }

    const timeUntilReminder = reminderTime.getTime() - now.getTime();

    setTimeout(() => {
        const storedReminders = storage.get(STORAGE_KEYS.REMINDERS) || [];
        const currentReminder = storedReminders.find(r => r.id === reminder.id);
        
        if (currentReminder && !currentReminder.done) {
            showNotification(reminder.message, {
                body: reminder.type === 'pill' 
                    ? `Time to take ${reminder.medicineName || 'your medicine'}`
                    : `Time for ${reminder.name}`,
                tag: reminder.id,
                requireInteraction: true,
            });

            // Repeat notification every 2 minutes until done
            const intervalId = setInterval(() => {
                const updatedReminders = storage.get(STORAGE_KEYS.REMINDERS) || [];
                const updatedReminder = updatedReminders.find(r => r.id === reminder.id);
                
                if (updatedReminder?.done) {
                    clearInterval(intervalId);
                    clearReminderInterval(reminder.id);
                    if (onDone) onDone();
                } else {
                    showNotification(reminder.message, {
                        body: reminder.type === 'pill' 
                            ? `Time to take ${reminder.medicineName || 'your medicine'}`
                            : `Time for ${reminder.name}`,
                        tag: reminder.id,
                        requireInteraction: true,
                    });
                }
            }, 2 * 60 * 1000); // Every 2 minutes

            // Store interval ID
            const intervals = storage.get(STORAGE_KEYS.INTERVALS) || {};
            intervals[reminder.id] = intervalId;
            storage.set(STORAGE_KEYS.INTERVALS, intervals);
        }
    }, timeUntilReminder);
}

// Clear reminder interval
export function clearReminderInterval(reminderId) {
    const intervals = storage.get(STORAGE_KEYS.INTERVALS) || {};
    if (intervals[reminderId]) {
        clearInterval(intervals[reminderId]);
        delete intervals[reminderId];
        storage.set(STORAGE_KEYS.INTERVALS, intervals);
    }
}

// Initialize all reminders
export function initializeReminders() {
    const reminders = storage.get(STORAGE_KEYS.REMINDERS) || [];
    reminders.forEach(reminder => {
        if (!reminder.done) {
            scheduleReminder(reminder);
        }
    });
}

