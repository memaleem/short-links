import type { ClickParams } from "./types";

/**
 * חילוץ פרמטרי מעקב מה-query string של הקישור המקוצר.
 *
 * נשמרים רק פרמטרים שהם באמת מעקב שיווקי - לא כל מה שנגרר בכתובת.
 * הסיבה: כתובות מודעות ורשתות חברתיות אוספות בדרך זבל ולפעמים מזהים
 * אישיים, ואין שום סיבה לשמור אותם במסד.
 */

/**
 * מזהי קליק ששווה לשמור. הרשימה רחבה בכוונה - כאן רק מחליטים מה נכנס
 * למסד, ולא מה נחשב ממומן. את ההחלטה הזו עושה PAID_CLICK_IDS למטה.
 */
const CAPTURE_CLICK_IDS = new Set([
  "gclid",
  "wbraid",
  "gbraid",
  "dclid",
  "msclkid",
  "ttclid",
  "twclid",
  "fbclid",
  "igshid",
  "epik",
  "li_fat_id",
]);

/** פרמטרים כלליים נפוצים שנהוג להשתמש בהם לייחוס. */
const EXTRA = new Set(["ref", "src", "source", "campaign"]);

const MAX_PARAMS = 12;
const MAX_KEY = 40;
const MAX_VALUE = 200;

function isTrackingKey(key: string): boolean {
  return (
    key.startsWith("utm_") ||
    key.endsWith("clid") ||
    CAPTURE_CLICK_IDS.has(key) ||
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

/**
 * מזהי קליק שמופיעים אך ורק בתנועה ממומנת.
 *
 * שים לב למי שאיננו כאן, ובכוונה:
 * fbclid ו-igshid נדבקים לכל קישור יוצא מפייסבוק ומאינסטגרם, גם בפוסט
 * אורגני לגמרי. אילו היינו סופרים אותם כממומן, כל שיתוף אורגני ברשתות
 * היה נצבע כתנועה ששילמנו עליה - בדיוק ההטעיה שהפילוח הזה בא למנוע.
 */
const PAID_CLICK_IDS = new Set([
  "gclid", // גוגל אדס
  "wbraid", // גוגל אדס, מכשירי אפל
  "gbraid", // גוגל אדס, מכשירי אפל
  "dclid", // Display & Video 360
  "msclkid", // מיקרוסופט אדס
  "ttclid", // טיקטוק אדס
  "twclid", // X אדס
  "epik", // פינטרסט אדס
  "li_fat_id", // לינקדאין אדס
]);

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
    if (PAID_CLICK_IDS.has(key)) return true;
  }
  const medium = (params.utm_medium || "").toLowerCase();
  return PAID_MEDIUMS.has(medium);
}

/**
 * שלוש הקטגוריות של פילוח "ממומן מול אורגני".
 *
 * "לא מתויג" קיימת כי לחיצה בלי פרמטרים איננה עדות לתנועה אורגנית -
 * היא פשוט לחיצה שלא ידוע מאיפה הגיעה. כל הלחיצות ההיסטוריות, מלפני
 * שהתחלנו לתייג, נופלות לכאן. לספור אותן כאורגניות היה מנפח את הצד
 * האורגני ומייפה את התמונה.
 */
export type TrafficKind = "paid" | "organic" | "untagged";

export function trafficKind(params: ClickParams | null): TrafficKind {
  if (!params || Object.keys(params).length === 0) return "untagged";
  return isPaid(params) ? "paid" : "organic";
}
