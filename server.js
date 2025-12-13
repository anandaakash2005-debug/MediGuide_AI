require("dotenv").config();
const express = require("express");
const https = require("https");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3001;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

app.use(express.json());

// ✅ Serve ALL static files (HTML, CSS, JS)
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
Return JSON only with diet, exercise, medicine, and doctor specialization.`;

    const data = JSON.stringify({
      model: "openai/gpt-oss-20b:free",
      messages: [{ role: "user", content: prompt }],
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
          reject(new Error("Failed to parse response"));
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
