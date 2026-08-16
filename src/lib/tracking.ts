import type { ClickParams } from "./types";

/**
 * חילוץ פרמטרי מעקב מה-query string של הקישור המקוצר.
 *
 * נשמרים רק פרמטרים שהם באמת מעקב שיווקי - לא כל מה שנגרר בכתובת.
 * הסיבה: כתובות מודעות ורשתות חברתיות אוספות בדרך זבל ולפעמים מזהים
 * אישיים, ואין שום סיבה לשמור אותם במסד.
 */

/** מזהי קליק של רשתות הפרסום - כולם מסתיימים ב-clid חוץ מאלה. */
const CLICK_IDS = new Set(["gclid", "wbraid", "gbraid", "dclid", "msclkid", "igshid"]);

/** פרמטרים כלליים נפוצים שנהוג להשתמש בהם לייחוס. */
const EXTRA = new Set(["ref", "src", "source", "campaign"]);

const MAX_PARAMS = 12;
const MAX_KEY = 40;
const MAX_VALUE = 200;

function isTrackingKey(key: string): boolean {
  return (
    key.startsWith("utm_") ||
    key.endsWith("clid") ||
    CLICK_IDS.has(key) ||
    EXTRA.has(key)
  );
}

/**
 * מחזיר את פרמטרי המעקב מהבקשה, או null אם אין.
 * null (ולא אובייקט ריק) כדי שהעמודה תישאר NULL ברוב הלחיצות
 * והאינדקס החלקי יישאר קטן.
 */
export function extractParams(searchParams: URLSearchParams): ClickParams | null {
  const out: ClickParams = {};
  let n = 0;
  for (const [rawKey, rawValue] of searchParams) {
    if (n >= MAX_PARAMS) break;
    const key = rawKey.trim().toLowerCase();
    const value = rawValue.trim();
    if (!key || !value) continue;
    if (key.length > MAX_KEY) continue;
    if (!isTrackingKey(key)) continue;
    if (key in out) continue; // פרמטר כפול - הראשון קובע
    out[key] = value.slice(0, MAX_VALUE);
    n++;
  }
  return n > 0 ? out : null;
}

/** ערכי utm_medium שמעידים על תנועה ממומנת. */
const PAID_MEDIUMS = new Set([
  "cpc",
  "ppc",
  "paid",
  "paidsocial",
  "paid_social",
  "cpm",
  "cpv",
  "display",
  "banner",
  "ads",
]);

/**
 * האם הלחיצה הגיעה מתנועה ממומנת.
 *
 * מזהה קליק של רשת פרסום הוא ההוכחה החזקה ביותר - הוא נוצר על ידי
 * הרשת עצמה ולא ניתן להדביק אותו בטעות. utm_medium הוא הצהרה ידנית
 * ולכן נבדק אחריו.
 */
export function isPaid(params: ClickParams | null): boolean {
  if (!params) return false;
  for (const key of Object.keys(params)) {
    if (key.endsWith("clid") || CLICK_IDS.has(key)) return true;
  }
  const medium = (params.utm_medium || "").toLowerCase();
  return PAID_MEDIUMS.has(medium);
}
