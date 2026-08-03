import type { Utm, PixelConfig } from "./types";

/** משלים סכימה לכתובת ומוודא שהיא תקינה. מחזיר null אם לא ניתן להשתמש בה. */
export function normalizeDestination(raw: string): string | null {
  let v = (raw || "").trim();
  if (!v) return null;
  if (/^(mailto:|sms:|tel:)/i.test(v)) return v;
  if (!/^https?:\/\//i.test(v)) v = "https://" + v;
  try {
    const u = new URL(v);
    if (!u.hostname.includes(".")) return null;
    return u.toString();
  } catch {
    return null;
  }
}

export function cleanUtm(input: unknown): Utm {
  const src = (input || {}) as Record<string, unknown>;
  const out: Utm = {};
  for (const k of ["source", "medium", "campaign", "term", "content"] as const) {
    const v = typeof src[k] === "string" ? (src[k] as string).trim() : "";
    if (v) out[k] = v;
  }
  return out;
}

export function cleanPixel(input: unknown): PixelConfig {
  const src = (input || {}) as Record<string, unknown>;
  const out: PixelConfig = {};
  const fb = typeof src.fb === "string" ? src.fb.trim() : "";
  const gtag = typeof src.gtag === "string" ? src.gtag.trim() : "";
  if (fb) out.fb = fb;
  if (gtag) out.gtag = gtag;
  return out;
}
