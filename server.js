require("dotenv").config();
const express = require("express");
const https = require("https");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3001;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

app.use(express.json());
app.use(express.static(__dirname));

/* ---------- HEALTH PLAN API ---------- */
app.post("/api/health-plan", (req, res) => {
  const { disease, location } = req.body;

  if (!disease) {
    return res.status(400).json({ error: "Disease name is required" });
  }

  if (!OPENROUTER_API_KEY) {
    return res.status(500).json({ error: "OpenRouter API key not configured" });
  }

  generateHealthPlan(disease, location)
    .then(data => res.json({ success: true, data }))
    .catch(err => res.status(500).json({ error: err.message }));
});

/* ---------- ROOT PAGE ---------- */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

function generateHealthPlan(disease, userLocation) {
  return new Promise((resolve, reject) => {

    const prompt = `The user has the disease: ${disease}.
${userLocation ? `User location: ${userLocation}.` : ""}

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
  "doctor": {
    "specialization": "",
    "location": "${userLocation || 'General location'}"
  }
}`;

    const data = JSON.stringify({
      model: "openai/gpt-oss-20b:free",
      messages: [
        {
          role: "system",
          content: "You are a medical AI assistant. Always respond with valid JSON only."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const options = {
      hostname: "openrouter.ai",
      path: "/api/v1/chat/completions",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Length": data.length
      }
    };

    const req = https.request(options, res => {
      let body = "";
      res.on("data", c => (body += c));
      res.on("end", () => {
        try {
          const json = JSON.parse(body);
          resolve(JSON.parse(json.choices[0].message.content));
        } catch {
          reject(new Error("Failed to parse OpenRouter response"));
        }
      });
    });

    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
