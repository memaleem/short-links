/**
 * מילוי ראשוני של טבלת hub_links - דף "המפה" (ריכוז כל הקישורים שלך).
 * זהו שלב רשות: אפשר גם להוסיף קישורים ידנית מתוך הדף עצמו.
 * הרצה: node scripts/seed-hub.mjs   (קורא את .env.local)
 * הסקריפט מזין רק אם הטבלה ריקה, אלא אם מוסיפים --force.
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()])
);

const supa = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
  db: { schema: "links" },
});

// [category, title, url, description]
// הקטגוריות המוכרות מוגדרות ב-src/lib/hub.ts:
// main / sales / apps / local / ops / systems / legacy / review
const SEED = [
  // דוגמאות - החלף בקישורים שלך:
  ["main", "האתר הראשי", "https://example.com/", "האתר המרכזי של העסק"],
  ["apps", "קיצור קישורים", "https://example.com/", "המערכת הזו עצמה"],
  ["systems", "מערכת הדיוור", "https://example.com/", "כניסה למערכת הדיוור"],
];

const force = process.argv.includes("--force");

const { count } = await supa.from("hub_links").select("id", { count: "exact", head: true });
if ((count ?? 0) > 0 && !force) {
  console.log(`hub_links כבר מכילה ${count} שורות. להרצה מחדש: node scripts/seed-hub.mjs --force`);
  process.exit(0);
}

if (force) {
  await supa.from("hub_links").delete().neq("id", "00000000-0000-0000-0000-000000000000");
}

const rows = SEED.map(([category, title, url, description], i) => ({
  category,
  title,
  url,
  description,
  position: i,
}));

const { error } = await supa.from("hub_links").insert(rows);
if (error) {
  console.error("שגיאה בהזנה:", error.message);
  process.exit(1);
}
console.log(`הוזנו ${rows.length} קישורים לטבלת hub_links.`);
