// API utility for making requests
const API_BASE_URL = 'http://localhost:3001/api'; // Change this to your backend URL

export async function generateHealthPlan(disease, location = '') {
    try {
        const response = await fetch(`${API_BASE_URL}/health-plan`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ disease, location }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to generate health plan');
        }

        const data = await response.json();
        return data.data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

export async function getCurrentLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported by your browser'));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                });
            },
            (error) => {
                reject(new Error('Failed to get location'));
            },
            { timeout: 5000 }
        );
    });
}

