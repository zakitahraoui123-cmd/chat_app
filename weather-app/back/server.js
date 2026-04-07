import express from "express";
import cors from "cors";

const app = express();

app.use(
  cors({
    origin: true,
  })
);

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

app.get("/api/geocode", async (req, res) => {
  const q = String(req.query.q || "").trim();
  if (!q) return res.status(400).json({ message: "q is required" });

  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.searchParams.set("name", q);
  url.searchParams.set("count", "8");
  url.searchParams.set("language", "en");
  url.searchParams.set("format", "json");

  try {
    const r = await fetch(url);
    if (!r.ok) return res.status(502).json({ message: "geocoding failed" });
    const data = await r.json();
    const results = Array.isArray(data.results) ? data.results : [];
    res.json(
      results.map((x) => ({
        id: `${x.latitude},${x.longitude}`,
        name: x.name,
        country: x.country,
        admin1: x.admin1,
        latitude: x.latitude,
        longitude: x.longitude,
        timezone: x.timezone,
      }))
    );
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "server error" });
  }
});

app.get("/api/forecast", async (req, res) => {
  const latitude = num(req.query.lat);
  const longitude = num(req.query.lon);
  const units = String(req.query.units || "metric"); // metric | imperial
  if (latitude == null || longitude == null) {
    return res.status(400).json({ message: "lat and lon are required" });
  }

  const temperature_unit = units === "imperial" ? "fahrenheit" : "celsius";
  const windspeed_unit = units === "imperial" ? "mph" : "kmh";

  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(latitude));
  url.searchParams.set("longitude", String(longitude));
  url.searchParams.set("current", "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m");
  url.searchParams.set(
    "daily",
    "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset"
  );
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("temperature_unit", temperature_unit);
  url.searchParams.set("windspeed_unit", windspeed_unit);

  try {
    const r = await fetch(url);
    if (!r.ok) return res.status(502).json({ message: "forecast failed" });
    const data = await r.json();
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "server error" });
  }
});

const PORT = Number(process.env.PORT) || 5050;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Weather API listening on ${PORT}`);
});

