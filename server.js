"use strict";
require("dotenv").config();
const path = require("node:path");
const express = require("express");

const ALLOWED_RECIPE_PATHS = /^\/(?:complexSearch|random|[0-9]{1,12}\/information)$/;
const MAX_QUERY_BYTES = 2048;
const MIN_INTERVAL_MS = 500;
const MAX_PER_HOUR = 100;

function createApp({ apiKey = process.env.SPOONACULAR_API_KEY, fetchImpl = globalThis.fetch, now = Date.now } = {}) {
  const app = express();
  app.disable("x-powered-by");
  const buckets = new Map();

  app.get("/", (req, res) => res.sendFile(path.join(__dirname, "index.html")));
  app.get("/style.css", (req, res) => res.type("text/css").sendFile(path.join(__dirname, "style.css")));
  app.get("/main.js", (req, res) => res.type("application/javascript").sendFile(path.join(__dirname, "main.js")));

  app.get(/^\/api\/recipes\/(.+)$/, async (req, res) => {
    const recipePath = "/" + req.params[0];
    if (!ALLOWED_RECIPE_PATHS.test(recipePath)) return res.status(404).json({ error: "Unknown recipe endpoint" });
    if (!apiKey || apiKey === "replace_with_a_new_key") {
      return res.status(503).json({ error: "Recipe API credentials are not configured" });
    }
    const client = req.ip || "local";
    const current = now();
    // Drop stale entries before growth; this demo is intended for local access only.
    for (const [key, entry] of buckets) if (current - entry.start > 3600000) buckets.delete(key);
    const usage = buckets.get(client) || { start: current, count: 0, last: 0 };
    if (current - usage.start > 3600000) { usage.start = current; usage.count = 0; usage.last = 0; }
    if (current - usage.last < MIN_INTERVAL_MS || usage.count >= MAX_PER_HOUR) {
      return res.status(429).json({ error: "Local request limit reached" });
    }
    usage.count++; usage.last = current; buckets.set(client, usage);
    if ((req.originalUrl || "").length > MAX_QUERY_BYTES) return res.status(414).json({ error: "Query too long" });

    const upstream = new URL("https://api.spoonacular.com/recipes" + recipePath);
    for (const [key, value] of Object.entries(req.query || {})) {
      if (key === "apiKey" || key === "api_key") continue;
      if (typeof value === "string" && /^[A-Za-z][A-Za-z0-9_-]{0,42}$/.test(key) && value.length <= 200) {
        upstream.searchParams.set(key, value);
      }
    }
    upstream.searchParams.set("apiKey", apiKey);
    try {
      const response = await fetchImpl(upstream.toString(), {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(12000)
      });
      if (!response.ok) return res.status(response.status === 429 ? 429 : 502).json({ error: "Recipe service request failed" });
      const responseText = await response.text();
      if (responseText.length > 3_000_000) return res.status(502).json({ error: "Recipe response too large" });
      res.type("application/json").send(responseText);
    } catch (error) {
      console.error("Recipe provider request failed:", error?.name || "network error");
      res.status(502).json({ error: "Recipe service unavailable" });
    }
  });
  return app;
}

if (require.main === module) {
  if (!process.env.SPOONACULAR_API_KEY) {
    console.error("Missing SPOONACULAR_API_KEY in local .env. Rotate the formerly published key first.");
    process.exitCode = 1;
  } else {
    const port = Number(process.env.PORT || 3000);
    const app = createApp();
    app.listen(port, "127.0.0.1", () => console.log(`Recipe Master (local only): http://127.0.0.1:${port}`));
  }
}

module.exports = { createApp };
