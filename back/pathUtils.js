import path from "path";

/** Paths like multer/avatar/... for DB + JSON responses (works on Windows). */
export function toPublicMulterPath(absolutePath) {
  if (!absolutePath) return null;
  const rel = path.relative(process.cwd(), absolutePath).replace(/\\/g, "/");
  if (rel.startsWith("multer/")) return rel;
  const parts = absolutePath.split(/[/\\]/);
  const idx = parts.indexOf("multer");
  if (idx >= 0) return parts.slice(idx).join("/");
  return null;
}
