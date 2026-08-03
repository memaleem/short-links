import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";

/**
 * סמל אתר עבור דף המפה. מאתר את הסמל האמיתי של הדומיין לפי הסדר:
 * 1. תגית <link rel="icon"> בעמוד הבית (שם יושבים הלוגואים האמיתיים בוורדפרס ו-Next)
 * 2. /favicon.ico בשורש האתר
 * 3. שירות הסמלים של DuckDuckGo
 * 4. שירות הסמלים של גוגל
 * אם אין - 404, והדפדפן מציג אות ראשונה במקום.
 *
 * פתוח לציבור (דף המפה פתוח), ולכן מוגבל לדומיינים שמופיעים בטבלת המפה בלבד.
 * נשמר במטמון ה-CDN שבוע, כך שהאיתור רץ פעם אחת לכל דומיין.
 */

export const maxDuration = 30;

const FETCH_TIMEOUT = 3500;
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";
const CACHE_HIT = "public, max-age=86400, s-maxage=604800, stale-while-revalidate=604800";
const CACHE_MISS = "public, max-age=3600, s-maxage=3600";

async function fetchWithTimeout(url: string): Promise<Response | null> {
  try {
    return await fetch(url, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT),
      headers: { "user-agent": UA, accept: "*/*" },
      redirect: "follow",
    });
  } catch {
    return null;
  }
}

/** מנסה להביא כתובת כתמונה; מחזיר את גוף התמונה או null. */
async function tryImage(url: string): Promise<NextResponse | null> {
  const res = await fetchWithTimeout(url);
  if (!res || !res.ok) return null;
  const type = (res.headers.get("content-type") ?? "").split(";")[0].trim();
  const looksImage = type.startsWith("image/") || type === "application/octet-stream";
  if (!looksImage) return null;
  const buf = await res.arrayBuffer();
  if (buf.byteLength < 32) return null; // ריק או שבור
  return new NextResponse(buf, {
    headers: {
      "content-type": type.startsWith("image/") ? type : "image/x-icon",
      "cache-control": CACHE_HIT,
    },
  });
}

/** שולף כתובות סמל מתגיות <link rel*="icon"> בעמוד הבית. */
function iconHrefsFromHtml(html: string, base: string): string[] {
  const hrefs: string[] = [];
  const linkTags = html.match(/<link\b[^>]*>/gi) ?? [];
  for (const tag of linkTags) {
    if (!/rel\s*=\s*["'][^"']*icon[^"']*["']/i.test(tag)) continue;
    const m = tag.match(/href\s*=\s*["']([^"']+)["']/i);
    if (!m) continue;
    try {
      hrefs.push(new URL(m[1], base).toString());
    } catch {
      /* href לא תקין - מדלגים */
    }
  }
  return hrefs.slice(0, 3);
}

export async function GET(req: NextRequest) {
  const domain = (req.nextUrl.searchParams.get("domain") ?? "").trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9.-]{1,250}$/.test(domain)) {
    return NextResponse.json({ error: "דומיין לא תקין" }, { status: 400 });
  }

  // כתובות מקומיות/פנימיות (כלים שרצים על המחשב המקומי) - אין מאיפה להביא סמל,
  // ואסור לשרת לנסות לפנות לרשת הפנימית של עצמו. הלקוח יציג אות ראשונה.
  const isPrivate =
    domain === "localhost" ||
    !domain.includes(".") ||
    domain.endsWith(".local") ||
    /^(\d{1,3}\.){3}\d{1,3}$/.test(domain);
  if (isPrivate) {
    return NextResponse.json(
      { error: "כתובת מקומית" },
      { status: 404, headers: { "cache-control": CACHE_HIT } }
    );
  }

  // מגבילים לדומיינים שקיימים במפה - הנתיב פתוח לציבור.
  const supa = db();
  const { data } = await supa.from("hub_links").select("url");
  const allowed = new Set(
    (data ?? [])
      .map((r) => {
        try {
          return new URL(r.url as string).hostname.replace(/^www\./, "").toLowerCase();
        } catch {
          return null;
        }
      })
      .filter(Boolean)
  );
  if (!allowed.has(domain) && !allowed.has(`www.${domain}`)) {
    return NextResponse.json({ error: "לא במפה" }, { status: 404 });
  }

  const base = `https://${domain}/`;

  // 1. הסמל שמוגדר בעמוד הבית עצמו
  const home = await fetchWithTimeout(base);
  if (home && home.ok && (home.headers.get("content-type") ?? "").includes("text/html")) {
    const html = await home.text();
    for (const href of iconHrefsFromHtml(html, base)) {
      const icon = await tryImage(href);
      if (icon) return icon;
    }
  }

  // 2. favicon.ico בשורש - רק אם הדומיין בכלל עונה
  if (home) {
    const icon = await tryImage(`${base}favicon.ico`);
    if (icon) return icon;
  }

  // 3+4. שירותי סמלים חיצוניים
  for (const url of [
    `https://icons.duckduckgo.com/ip3/${domain}.ico`,
    `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
  ]) {
    const icon = await tryImage(url);
    if (icon) return icon;
  }

  return NextResponse.json(
    { error: "אין סמל" },
    { status: 404, headers: { "cache-control": CACHE_MISS } }
  );
}
