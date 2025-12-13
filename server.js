require("dotenv").config();
const http = require("http");
const https = require("https");
const { URL } = require("url");

const PORT = 3001;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

/* ------------------- BASIC SERVER ------------------- */
const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);

  /* ---------- 1️⃣ PROVIDE MAP KEY (DYNAMICALLY) ---------- */
  if (parsedUrl.pathname === "/api/maps-key" && req.method === "GET") {
    if (!GOOGLE_MAPS_API_KEY) {
      res.writeHead(500, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "Google Maps key missing" }));
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ key: GOOGLE_MAPS_API_KEY }));
  }

  /* ---------- 2️⃣ FIND NEARBY DOCTORS (BACKEND ONLY) ---------- */
  if (parsedUrl.pathname === "/api/nearby-doctors" && req.method === "GET") {
    const lat = parsedUrl.searchParams.get("lat");
    const lng = parsedUrl.searchParams.get("lng");
    const specialization = parsedUrl.searchParams.get("type") || "doctor";

    if (!lat || !lng) {
      res.writeHead(400, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "Location required" }));
    }

    const apiURL = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=5000&type=doctor&keyword=${specialization}&key=${GOOGLE_MAPS_API_KEY}`;

    https
      .get(apiURL, apiRes => {
        let data = "";
        apiRes.on("data", chunk => (data += chunk));
        apiRes.on("end", () => {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(data);
        });
      })
      .on("error", err => {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err.message }));
      });

    return;
  }

  /* ---------- 3️⃣ HEALTH PLAN API (UNCHANGED) ---------- */
  if (parsedUrl.pathname === "/api/health-plan" && req.method === "POST") {
    let body = "";
    req.on("data", chunk => (body += chunk.toString()));
    req.on("end", () => handleHealthPlan(body, res));
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not found" }));
});

/* ------------------- HEALTH PLAN FUNCTION ------------------- */
function handleHealthPlan(body, res) {
  try {
    const { disease, location } = JSON.parse(body);
    if (!OPENROUTER_API_KEY) {
      res.writeHead(500);
      return res.end(JSON.stringify({ error: "OpenRouter key missing" }));
    }

    generateHealthPlan(disease, location)
      .then(data => {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(data));
      })
      .catch(err => {
        res.writeHead(500);
        res.end(JSON.stringify({ error: err.message }));
      });
  } catch {
    res.writeHead(400);
    res.end(JSON.stringify({ error: "Invalid JSON" }));
  }
}

/* ------------------- OPENROUTER ------------------- */
function generateHealthPlan(disease, location) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      model: "openai/gpt-oss-20b:free",
      messages: [
        { role: "system", content: "Return JSON only" },
        { role: "user", content: `Disease: ${disease}, Location: ${location}` }
      ]
    });

    const req = https.request(
      {
        hostname: "openrouter.ai",
        path: "/api/v1/chat/completions",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENROUTER_API_KEY}`
        }
      },
      res => {
        let data = "";
        res.on("data", c => (data += c));
        res.on("end", () => resolve(JSON.parse(data)));
      }
    );

    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

server.listen(PORT, () =>
  console.log(`✅ Server running on http://localhost:${PORT}`)
);
