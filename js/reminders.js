import { storage, STORAGE_KEYS } from './storage.js';
import { scheduleReminder, clearReminderInterval, requestNotificationPermission } from './notifications.js';

const API_BASE_URL =
    location.hostname === "localhost"
        ? "http://localhost:3001"
        : "https://mediguideai-production.up.railway.app";


// 🔐 AUTH GUARD (ADD THIS)
const user = storage.get(STORAGE_KEYS.USER);
if (!user) {
    alert("Please login first");
    window.location.href = "login.html";
    throw new Error("User not logged in");
}

// let reminders = storage.get(STORAGE_KEYS.REMINDERS) || [];

// Request notification permission on load
requestNotificationPermission();

// Initialize existing reminders
// reminders.forEach(reminder => {
//     if (!reminder.done) {
//         scheduleReminder(reminder);
//     }
// });

const addReminderBtn = document.getElementById('add-reminder-btn');
if (!user) {
    addReminderBtn.disabled = true;
}
const reminderForm = document.getElementById('reminder-form');
const reminderFormElement = document.getElementById('reminder-form-element');
const cancelBtn = document.getElementById('cancel-reminder-btn');
const reminderType = document.getElementById('reminder-type');
const medicineNameGroup = document.getElementById('medicine-name-group');
const mealTypeGroup = document.getElementById('meal-type-group');
const reminderNameGroup = document.getElementById('reminder-name-group');

// Toggle form
addReminderBtn.addEventListener('click', () => {
    reminderForm.style.display = reminderForm.style.display === 'none' ? 'block' : 'none';
});

cancelBtn.addEventListener('click', () => {
    reminderForm.style.display = 'none';
    reminderFormElement.reset();
});

// Toggle form fields based on type
reminderType.addEventListener('change', (e) => {
    if (e.target.value === 'pill') {
        medicineNameGroup.style.display = 'block';
        mealTypeGroup.style.display = 'none';
        reminderNameGroup.style.display = 'block';
    } else {
        medicineNameGroup.style.display = 'none';
        mealTypeGroup.style.display = 'block';
        reminderNameGroup.style.display = 'none';
    }
});

// Handle form submission
reminderFormElement.addEventListener('submit', async (e) => {
    e.preventDefault();


    const type = reminderType.value;
    const name = type === 'meal'
        ? document.getElementById('meal-type').value
        : document.getElementById('reminder-name').value;
    const time = document.getElementById('reminder-time').value;
    const message = document.getElementById('reminder-message').value || name;
    const medicineName = type === 'pill' ? document.getElementById('medicine-name').value : undefined;

    if (!name || !time) {
        alert('Please fill in all required fields');
        return;
    }

    const newReminder = {
        id: Date.now().toString(),
        type,
        name,
        time,
        message,
        done: false,
        medicineName
    };

    try {
        const res = await fetch(`${API_BASE}/api/reminders`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: user.email,
                title: newReminder.name,
                message: newReminder.message,
                time: newReminder.time
            }),
        });

        if (!res.ok) throw new Error("Server error");

    } catch (err) {
        console.error(err);
        alert("Reminder server not reachable");
        return; // STOP here
    }


    let reminders = storage.get(STORAGE_KEYS.REMINDERS) || [];
    reminders.push(newReminder);
    storage.set(STORAGE_KEYS.REMINDERS, reminders);


    // Schedule the reminder
    scheduleReminder(newReminder);

    // Reset form and hide
    reminderFormElement.reset();
    reminderForm.style.display = 'none';

    // Reload to show new reminder
    //location.reload();

});


// Display reminders
// function displayReminders() {
//     const remindersListEl = document.getElementById('reminders-list');
//     remindersListEl.innerHTML = '';

//     if (reminders.length === 0) {
//         remindersListEl.innerHTML = `
//             <div class="empty-state">
//                 <div class="empty-icon">🔔</div>
//                 <p class="empty-text">No reminders set</p>
//                 <p class="empty-subtext">Click "Add Reminder" to create your first reminder</p>
//             </div>
//         `;
//         return;
//     }

//     reminders.forEach(reminder => {
//         const div = document.createElement('div');
//         div.className = `reminder-item ${reminder.type} ${reminder.done ? 'done' : ''}`;
//         div.innerHTML = `
//             <div class="reminder-content">
//                 <div class="reminder-header">
//                     <span class="reminder-icon">${reminder.type === 'pill' ? '💊' : '🍽️'}</span>
//                     <span class="reminder-title">${reminder.message}</span>
//                     ${reminder.done ? '<span class="reminder-badge">Done</span>' : ''}
//                 </div>
//                 <div class="reminder-details">
//                     <span>⏰ ${reminder.time}</span>
//                     ${reminder.medicineName ? `<span>${reminder.medicineName}</span>` : ''}
//                 </div>
//             </div>
//             <div class="reminder-actions">
//                 ${!reminder.done ? `<button class="btn btn-primary btn-sm" onclick="markDone('${reminder.id}')">Mark Done</button>` : ''}
//                 <button class="btn btn-danger btn-sm" onclick="deleteReminder('${reminder.id}')">🗑️</button>
//             </div>
//         `;
//         remindersListEl.appendChild(div);
//     });
// }

// // Global functions for onclick handlers
// window.markDone = function (id) {
//     clearReminderInterval(id);
//     reminders = reminders.map(r => r.id === id ? { ...r, done: true } : r);
//     storage.set(STORAGE_KEYS.REMINDERS, reminders);
//     displayReminders();
// };

// window.deleteReminder = function (id) {
//     if (confirm('Are you sure you want to delete this reminder?')) {
//         clearReminderInterval(id);
//         reminders = reminders.filter(r => r.id !== id);
//         storage.set(STORAGE_KEYS.REMINDERS, reminders);
//         displayReminders();
//     }
// };

//displayReminders();

