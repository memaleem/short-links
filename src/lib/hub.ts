/**
 * דף "הקישורים שלי" — ריכוז כל האתרים והמערכות שלך.
 * הדף חי בכתובת סודית (/h/<HUB_SECRET>) ופתוח לצפייה בלי סיסמה;
 * עריכה דורשת את סיסמת לוח הבקרה (אותה עוגייה של שאר המערכת).
 */

export type HubCategory = {
  key: string;
  label: string;
  hint?: string;
};

/** סדר הקטגוריות כאן קובע את סדר ההצגה בדף. */
export const HUB_CATEGORIES: HubCategory[] = [
  { key: "main", label: "האתרים הראשיים" },
  { key: "sales", label: "דפי מכירה והרצאות" },
  { key: "apps", label: "אפליקציות וכלים" },
  {
    key: "local",
    label: "כלים במחשב",
    hint: "רצים על המחשב שלך ונפתחים רק ממנו. קישור לא נפתח? הכלי כבוי במחשב.",
  },
  { key: "ops", label: "ניהול האתרים שלנו" },
  { key: "systems", label: "מערכות חיצוניות" },
  { key: "legacy", label: "אתרי העבר" },
  { key: "review", label: "לבדוק", hint: "דברים ישנים או לא מזוהים. אפשר למחוק מה שמיותר" },
];

export function categoryLabel(key: string): string {
  return HUB_CATEGORIES.find((c) => c.key === key)?.label ?? key;
}

/** הסוד מהסביבה, בלי רווחים או ירידות שורה שנדבקו בהדבקה. */
export function hubSecret(): string {
  return (process.env.HUB_SECRET ?? "").trim();
}
