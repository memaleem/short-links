import type { ClickRow } from "./types";

export type Bucket = { key: string; label: string; count: number };

function tally(
  rows: ClickRow[],
  pick: (c: ClickRow) => string,
  label: (k: string) => string = (k) => k
): Bucket[] {
  const m = new Map<string, number>();
  for (const r of rows) {
    const k = pick(r);
    m.set(k, (m.get(k) || 0) + 1);
  }
  return [...m.entries()]
    .map(([key, count]) => ({ key, label: label(key), count }))
    .sort((a, b) => b.count - a.count);
}

function hostOf(ref: string | null): string {
  if (!ref) return "direct";
  try {
    return new URL(ref).hostname.replace(/^www\./, "");
  } catch {
    return "direct";
  }
}

const REF_LABEL: Record<string, string> = {
  direct: "ישיר / הודבק",
  "l.instagram.com": "אינסטגרם",
  "instagram.com": "אינסטגרם",
  "lm.facebook.com": "פייסבוק",
  "m.facebook.com": "פייסבוק",
  "facebook.com": "פייסבוק",
  "t.co": "X / טוויטר",
  "com.google.android.gm": "Gmail",
};

/** דגל אמוג'י מקוד מדינה דו-אותי. */
export function flag(cc: string): string {
  if (!cc || cc.length !== 2 || cc === "—") return "🌍";
  const base = 0x1f1e6;
  return String.fromCodePoint(
    base + (cc.charCodeAt(0) - 65),
    base + (cc.charCodeAt(1) - 65)
  );
}

const DEVICE_LABEL: Record<string, string> = {
  mobile: "נייד",
  tablet: "טאבלט",
  desktop: "מחשב",
};

export function summarize(clicks: ClickRow[]) {
  const byDevice = tally(clicks, (c) => c.device || "desktop", (k) => DEVICE_LABEL[k] || k);
  const byCountry = tally(clicks, (c) => c.country || "—", (k) =>
    k === "—" ? "לא ידוע" : k
  );
  const byCity = tally(clicks, (c) => c.city || "—").filter((b) => b.key !== "—");
  const byReferrer = tally(clicks, (c) => hostOf(c.referrer), (k) => REF_LABEL[k] || k);
  return {
    total: clicks.length,
    byDevice,
    byCountry,
    byCity,
    byReferrer,
    last14: daySeries(clicks, 14),
  };
}

export type Summary = ReturnType<typeof summarize>;

export type DayPoint = { day: string; label: string; count: number };

/** סדרת ימים (UTC) עבור העמודות. */
export function daySeries(clicks: ClickRow[], days: number): DayPoint[] {
  const now = Date.now();
  const dayMs = 86400000;
  const counts = new Map<string, number>();
  for (const c of clicks) {
    const d = new Date(c.created_at);
    const key = d.toISOString().slice(0, 10);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  const out: DayPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now - i * dayMs);
    const key = d.toISOString().slice(0, 10);
    out.push({
      day: key,
      label: `${d.getDate()}.${d.getMonth() + 1}`,
      count: counts.get(key) || 0,
    });
  }
  return out;
}
