import { storage, STORAGE_KEYS } from './storage.js';

const healthPlan = storage.get(STORAGE_KEYS.HEALTH_PLAN);
const disease = storage.get(STORAGE_KEYS.DISEASE);
const trustBadge = document.querySelector(".who-trust-badge");

if (!healthPlan) {
    window.location.href = 'index.html';
    throw new Error('No health plan found');
}

if (trustBadge && guidelineSource === "WHO") {
    trustBadge.style.display = "flex";
}


// Display disease name
const diseaseNameEl = document.getElementById('disease-name');
if (disease) {
    diseaseNameEl.textContent = `Personalized recommendations for: ${disease}`;
}

// Display diet
const dietTakeEl = document.getElementById('diet-take');
const dietAvoidEl = document.getElementById('diet-avoid');

if (healthPlan.diet?.take) {
    healthPlan.diet.take.forEach(food => {
        const li = document.createElement('li');
        li.textContent = food;
        dietTakeEl.appendChild(li);
    });
}

if (healthPlan.diet?.avoid) {
    healthPlan.diet.avoid.forEach(food => {
        const li = document.createElement('li');
        li.textContent = food;
        dietAvoidEl.appendChild(li);
    });
}

// Display exercises
const exerciseListEl = document.getElementById('exercise-list');
if (healthPlan.exercise) {
    healthPlan.exercise.forEach(ex => {
        const div = document.createElement('div');
        div.className = 'exercise-item';
        div.innerHTML = `
            <h3>${ex.name}</h3>
            <p>Sets: ${ex.sets} • Reps: ${ex.reps}</p>
        `;
        exerciseListEl.appendChild(div);
    });
}

// Display medicines
const medicineListEl = document.getElementById('medicine-list');
if (healthPlan.medicine) {
    healthPlan.medicine.forEach(med => {
        const div = document.createElement('div');
        div.className = 'medicine-item';
        div.innerHTML = `
            <h3>${med.name}</h3>
            <p><strong>Dosage:</strong> ${med.dosage}</p>
            <p><strong>Duration:</strong> ${med.duration}</p>
        `;
        medicineListEl.appendChild(div);
    });
}

// Display doctor
const doctorInfoEl = document.getElementById('doctor-info');
if (healthPlan.doctor) {
    doctorInfoEl.innerHTML = `
        <h3>${healthPlan.doctor.specialization || 'General Practitioner'}</h3>
        <p>Location: ${healthPlan.doctor.location || 'Not specified'}</p>
    `;
}

