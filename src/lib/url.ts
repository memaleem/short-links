import type { Utm } from "./types";

const UTM_MAP: Record<keyof Utm, string> = {
  source: "utm_source",
  medium: "utm_medium",
  campaign: "utm_campaign",
  term: "utm_term",
  content: "utm_content",
};

/**
 * מרכיב את כתובת היעד הסופית: מצרף פרמטרי UTM (בלי לדרוס פרמטרים קיימים).
 * נשמר בנפרד מהיעד, כך שאפשר לערוך גם את היעד וגם את ה-UTM בכל רגע.
 */
export function buildDestination(destination: string, utm: Utm | null): string {
  if (!utm) return destination;
  const entries = (Object.keys(UTM_MAP) as (keyof Utm)[])
    .map((k) => [UTM_MAP[k], (utm[k] || "").trim()] as const)
    .filter(([, v]) => v);
  if (!entries.length) return destination;
  try {
    const u = new URL(destination);
    for (const [param, value] of entries) {
      if (!u.searchParams.has(param)) u.searchParams.set(param, value);
    }
    return u.toString();
  } catch {
    return destination; // mailto:, sms:, וכתובות לא-סטנדרטיות — משאירים כמו שהן
  }
}

export function hasUtm(utm: Utm | null | undefined): boolean {
  if (!utm) return false;
  return Object.values(utm).some((v) => (v || "").trim());
}

/** בסיס הדומיין הקצר לתצוגה והרכבה (מגיע מ-NEXT_PUBLIC_SHORT_HOST). */
export function shortBase(): string {
  return process.env.NEXT_PUBLIC_SHORT_HOST || "localhost:3000";
}
