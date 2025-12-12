import { storage, STORAGE_KEYS } from './storage.js';

const reminders = storage.get(STORAGE_KEYS.REMINDERS) || [];
const healthPlan = storage.get(STORAGE_KEYS.HEALTH_PLAN);

// Calculate stats
const today = new Date();
const todayTasks = reminders.filter(r => {
    if (r.done) return false;
    const [hours, minutes] = r.time.split(':').map(Number);
    const reminderDate = new Date();
    reminderDate.setHours(hours, minutes, 0, 0);
    return reminderDate.toDateString() === today.toDateString() || reminderDate > today;
});

const completedToday = reminders.filter(r => r.done).length;

// Update stats
document.getElementById('reminders-today').textContent = todayTasks.length;
document.getElementById('completed-today').textContent = completedToday;
document.getElementById('total-reminders').textContent = reminders.length;

// Display today's schedule
const scheduleListEl = document.getElementById('today-schedule');
if (todayTasks.length > 0) {
    todayTasks.forEach(task => {
        const div = document.createElement('div');
        div.className = 'schedule-item';
        div.innerHTML = `
            <div class="schedule-item-content">
                <div class="schedule-item-title">${task.message}</div>
                <div class="schedule-item-time">${task.type === 'pill' ? '💊' : '🍽️'} ${task.time}</div>
            </div>
            <button class="btn btn-primary btn-sm" onclick="markDone('${task.id}')">Done</button>
        `;
        scheduleListEl.appendChild(div);
    });
} else {
    scheduleListEl.innerHTML = '<p class="empty-text">No reminders scheduled for today</p>';
}

// Display health plan summary
const summaryEl = document.getElementById('health-plan-summary');
if (healthPlan) {
    summaryEl.innerHTML = `
        <div class="summary-item">
            <h3>🍽️ Diet Plan</h3>
            <p>${healthPlan.diet?.take?.length || 0} foods to take, ${healthPlan.diet?.avoid?.length || 0} to avoid</p>
        </div>
        <div class="summary-item">
            <h3>🏋️ Exercise Plan</h3>
            <p>${healthPlan.exercise?.length || 0} recommended exercises</p>
        </div>
        <div class="summary-item">
            <h3>💊 Medications</h3>
            <p>${healthPlan.medicine?.length || 0} medications recommended</p>
        </div>
        <div class="summary-item">
            <h3>👨‍⚕️ Doctor</h3>
            <p>${healthPlan.doctor?.specialization || 'Not specified'}</p>
        </div>
    `;
} else {
    summaryEl.innerHTML = '<p class="empty-text">No health plan available. Generate one from the home page.</p>';
}

// Mark as done function (global for onclick)
window.markDone = function(id) {
    const updated = reminders.map(r => r.id === id ? { ...r, done: true } : r);
    storage.set(STORAGE_KEYS.REMINDERS, updated);
    location.reload();
};

