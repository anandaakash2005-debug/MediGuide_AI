require("dotenv").config();
const http = require('http');
const https = require('https');
const { URL } = require('url');

const PORT = 3001;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

if (!OPENROUTER_API_KEY) {
    console.warn('⚠️ Warning: OPENROUTER_API_KEY not set. Health plan generation will not work.');
}

const server = http.createServer((req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);

    if (parsedUrl.pathname === '/api/health-plan' && req.method === 'POST') {
        let body = '';

        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            try {
                const { disease, location } = JSON.parse(body);

                if (!disease) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Disease name is required' }));
                    return;
                }

                if (!OPENROUTER_API_KEY) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'OpenRouter API key not configured' }));
                    return;
                }

                generateHealthPlan(disease, location)
                    .then(healthPlan => {
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: true, data: healthPlan }));
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: error.message || 'Failed to generate health plan' }));
                    });
            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid request body' }));
            }
        });
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
    }
});

function generateHealthPlan(disease, userLocation) {
    return new Promise((resolve, reject) => {
        const prompt = `The user has the disease: ${disease}. ${userLocation ? `User location: ${userLocation}.` : ''}

Generate a complete personalized health plan including:
1. Foods to eat and avoid
2. Recommended exercises (3–5)
3. Common medicine (name, dosage per day, duration)
4. Type of doctor and specialization

Return valid JSON only with this structure:
{
  "diet": { "take": [], "avoid": [] },
  "exercise": [{ "name": "", "sets": 0, "reps": "" }],
  "medicine": [{ "name": "", "dosage": "", "duration": "" }],
  "doctor": { "specialization": "", "location": "${userLocation || 'General location'}" }
}`;

        const data = JSON.stringify({
            model: "openai/gpt-oss-20b:free",
            messages: [
                {
                    role: 'system',
                    content: 'You are a medical AI assistant. Always respond with JSON only.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.7,
            response_format: { type: 'json_object' },
        });

        const options = {
            hostname: 'openrouter.ai',
            path: '/api/v1/chat/completions',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Referer': 'http://localhost:3001', // ✅ Corrected
                'X-Title': 'NutriBuddy AI',
                'Content-Length': data.length,
            },
        };

        const req = https.request(options, (res) => {
            let responseData = '';

            res.on('data', chunk => (responseData += chunk));
            res.on('end', () => {
                console.log("🩺 Raw OpenRouter Response:", responseData);
                try {
                    const response = JSON.parse(responseData);
                    const content = response.choices?.[0]?.message?.content;

                    if (!content) {
                        reject(new Error('No response from OpenRouter'));
                        return;
                    }

                    const healthPlan = JSON.parse(content);
                    resolve(healthPlan);
                } catch (error) {
                    console.error('Parse error:', responseData);
                    reject(new Error('Failed to parse OpenRouter response'));
                }
            });
        });

        req.on('error', error => reject(error));
        req.write(data);
        req.end();
    });
}

server.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`🔑 Using OpenRouter API key: ${OPENROUTER_API_KEY ? 'Set' : 'Missing'}`);
});
