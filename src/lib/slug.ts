/** ניהול הסיומת (slug) של הקישור הקצר. */

// נתיבים שמורים של המערכת — אסור שקישור יתפוס אותם.
export const RESERVED = new Set([
  "login",
  "logout",
  "api",
  "admin",
  "dashboard",
  "link",
  "links",
  "analytics",
  "new",
  "edit",
  "settings",
  "p",
  "static",
  "assets",
  "public",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
  "_next",
  "manifest.json",
]);

// בלי תווים מבלבלים (0/o, 1/l/i).
const ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789";

export function randomSlug(len = 6): string {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  let s = "";
  for (const b of bytes) s += ALPHABET[b % ALPHABET.length];
  return s;
}

/** מנקה קלט משתמש לסיומת חוקית (אותיות לטיניות, ספרות, מקף, קו-תחתון). */
export function normalizeSlug(raw: string): string {
  return (raw || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-_]+|[-_]+$/g, "");
}

export function isValidSlug(s: string): boolean {
  return /^[a-z0-9][a-z0-9\-_]{1,49}$/.test(s) && !RESERVED.has(s);
}
