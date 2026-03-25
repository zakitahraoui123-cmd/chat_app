export const API_BASE =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "http://localhost:5000";

export function assetUrl(path) {
  if (!path) return null;
  return `${API_BASE}/${String(path).replace(/\\/g, "/")}`;
}
