export const API_BASE =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "http://localhost:5050";

export async function geocode(query) {
  const url = new URL(`${API_BASE}/api/geocode`);
  url.searchParams.set("q", query);
  const res = await fetch(url);
  if (!res.ok) throw new Error("Geocoding failed");
  return await res.json();
}

export async function forecast({ lat, lon, units }) {
  const url = new URL(`${API_BASE}/api/forecast`);
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lon));
  url.searchParams.set("units", units);
  const res = await fetch(url);
  if (!res.ok) throw new Error("Forecast failed");
  return await res.json();
}

