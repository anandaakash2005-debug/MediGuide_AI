import { getCurrentLocation } from './api.js';
import { storage, STORAGE_KEYS } from './storage.js';

// Mock doctor data (replace with real API call)
function findNearbyDoctors(specialization, lat, lng) {
    return new Promise((resolve) => {
        setTimeout(() => {
            const mockDoctors = [
                {
                    name: 'Dr. Sarah Johnson',
                    specialization,
                    address: '123 Medical Center, Main Street',
                    phone: '+91-9555-0101',
                    rating: 4.8,
                    lat: lat + 0.01,
                    lng: lng + 0.01,
                },
                {
                    name: 'Dr. Michael Chen',
                    specialization,
                    address: '456 Health Plaza, Oak Avenue',
                    phone: '+91-9555-0102',
                    rating: 4.6,
                    lat: lat - 0.01,
                    lng: lng + 0.01,
                },
                {
                    name: 'Dr. Emily Rodriguez',
                    specialization,
                    address: '789 Wellness Center, Park Road',
                    phone: '+91-9555-0103',
                    rating: 4.9,
                    lat: lat + 0.01,
                    lng: lng - 0.01,
                },
                {
                    name: 'Dr. James Wilson',
                    specialization,
                    address: '321 Care Clinic, Elm Street',
                    phone: '+91-9555-0104',
                    rating: 4.7,
                    lat: lat - 0.01,
                    lng: lng - 0.01,
                },
            ];
            resolve(mockDoctors);
        }, 500);
    });
}

// Get specialization from health plan
const healthPlan = storage.get(STORAGE_KEYS.HEALTH_PLAN);
if (healthPlan?.doctor?.specialization) {
    document.getElementById('specialization-input').value = healthPlan.doctor.specialization;
}

const findDoctorsBtn = document.getElementById('find-doctors-btn');
const findBtnText = document.getElementById('find-btn-text');
const findBtnLoader = document.getElementById('find-btn-loader');
const specializationInput = document.getElementById('specialization-input');
const errorMessage = document.getElementById('error-message');
const mapContainer = document.getElementById('map-container');
const doctorsGrid = document.getElementById('doctors-grid');
const noDoctors = document.getElementById('no-doctors');

findDoctorsBtn.addEventListener('click', async () => {
    const specialization = specializationInput.value.trim();
    
    if (!specialization) {
        showError('Please enter a doctor specialization');
        return;
    }

    setLoading(true);
    hideError();

    try {
        const location = await getCurrentLocation();
        const doctors = await findNearbyDoctors(specialization, location.lat, location.lng);

        displayDoctors(doctors);
        displayMap(doctors, location);
    } catch (err) {
        showError(err.message || 'Failed to get location. Please enable location access and try again.');
    } finally {
        setLoading(false);
    }
});

function setLoading(loading) {
    findDoctorsBtn.disabled = loading;
    if (loading) {
        findBtnText.style.display = 'none';
        findBtnLoader.style.display = 'inline-block';
    } else {
        findBtnText.style.display = 'inline';
        findBtnLoader.style.display = 'none';
    }
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
}

function hideError() {
    errorMessage.style.display = 'none';
}

function displayDoctors(doctors) {
    doctorsGrid.innerHTML = '';
    noDoctors.style.display = 'none';

    if (doctors.length === 0) {
        noDoctors.style.display = 'block';
        return;
    }

    doctors.forEach(doctor => {
        const div = document.createElement('div');
        div.className = 'doctor-card';
        div.innerHTML = `
            <div class="doctor-header">
                <div>
                    <h3 class="doctor-name">${doctor.name}</h3>
                    <p class="doctor-specialization">${doctor.specialization}</p>
                </div>
                ${doctor.rating ? `
                    <div class="doctor-rating">
                        ⭐ ${doctor.rating}
                    </div>
                ` : ''}
            </div>
            <div class="doctor-details">
                <div class="doctor-detail">
                    <span class="doctor-detail-icon">📍</span>
                    <span>${doctor.address}</span>
                </div>
                ${doctor.phone ? `
                    <div class="doctor-detail">
                        <span class="doctor-detail-icon">📞</span>
                        <a href="tel:${doctor.phone}" class="doctor-phone">${doctor.phone}</a>
                    </div>
                ` : ''}
            </div>
        `;
        doctorsGrid.appendChild(div);
    });
}

function displayMap(doctors, center) {
    if (typeof google === 'undefined') {
        console.warn('Google Maps not loaded');
        return;
    }

    mapContainer.style.display = 'block';
    mapContainer.innerHTML = '';

    const map = new google.maps.Map(mapContainer, {
        center,
        zoom: 13,
    });

    // Add markers
    doctors.forEach(doctor => {
        const marker = new google.maps.Marker({
            position: { lat: doctor.lat, lng: doctor.lng },
            map,
            title: doctor.name,
        });

        const infoWindow = new google.maps.InfoWindow({
            content: `
                <div style="padding: 8px;">
                    <h3 style="margin: 0 0 8px 0; font-weight: bold;">${doctor.name}</h3>
                    <p style="margin: 0 0 4px 0; color: #666;">${doctor.specialization}</p>
                    <p style="margin: 0 0 4px 0; color: #666;">${doctor.address}</p>
                    ${doctor.phone ? `<p style="margin: 0; color: #666;">${doctor.phone}</p>` : ''}
                    ${doctor.rating ? `<p style="margin: 4px 0 0 0; color: #666;">⭐ ${doctor.rating}</p>` : ''}
                </div>
            `,
        });

        marker.addListener('click', () => {
            infoWindow.open(map, marker);
        });
    });

    // Add center marker
    new google.maps.Marker({
        position: center,
        map,
        title: 'Your Location',
        icon: {
            url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
        },
    });
}

