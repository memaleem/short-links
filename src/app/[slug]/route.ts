import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { buildDestination } from "@/lib/url";
import { parseUA } from "@/lib/ua";
import { hasPixel, interstitialHtml } from "@/lib/pixel";
import { extractParams } from "@/lib/tracking";
import type { LinkRow, ClickInsert } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ slug: string }> }
) {
  const { slug } = await ctx.params;

  const supa = db();
  const { data } = await supa
    .from("links")
    .select("*")
    .eq("slug", slug)
    .eq("archived", false)
    .maybeSingle();

  const link = data as LinkRow | null;

  if (!link) {
    return new NextResponse(notFoundHtml(), {
      status: 404,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }

  // רישום הלחיצה לפני ההפניה — מובטח ונספר תמיד. מוגן ב-try/catch כך
  // שגם אם המסד ייכשל לרגע, ההפניה עצמה לעולם לא נשברת.
  try {
    const { device, browser, os } = parseUA(req.headers.get("user-agent") || "");
    const country = req.headers.get("x-vercel-ip-country");
    const cityRaw = req.headers.get("x-vercel-ip-city");
    const city = cityRaw ? safeDecode(cityRaw) : null;
    const base: ClickInsert = {
      link_id: link.id,
      country: country && country !== "XX" ? country : null,
      city,
      device,
      browser,
      os,
      referrer: req.headers.get("referer") || null,
    };
    const params = extractParams(req.nextUrl.searchParams);
    const payload: ClickInsert = params ? { ...base, params } : base;

    let { error: clickErr } = await supa.from("clicks").insert(payload);

    // 42703 = העמודה params לא קיימת, כלומר המיגרציה עוד לא הורצה על המסד.
    // נרשמת לחיצה בלי הפילוח, כדי שהמונה לא ייעצר בשקט עד שמריצים אותה.
    if (clickErr && params && clickErr.code === "42703") {
      console.error("[click-params-missing]", "run supabase/migrations/001-click-params.sql");
      ({ error: clickErr } = await supa.from("clicks").insert(base));
    }
    if (clickErr) console.error("[click-insert]", slug, clickErr.message);
  } catch (e) {
    console.error("[click-insert-throw]", slug, (e as Error)?.message);
  }

  const target = buildDestination(link.destination_url, link.utm);

  if (hasPixel(link.pixel)) {
    return new NextResponse(interstitialHtml(target, link.pixel!), {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store, max-age=0",
      },
    });
  }

  return NextResponse.redirect(target, {
    status: 302,
    headers: { "cache-control": "no-store, max-age=0" },
  });
}

function safeDecode(s: string): string | null {
  try {
    return decodeURIComponent(s) || null;
  } catch {
    return s || null;
  }
}

function notFoundHtml(): string {
  return `<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>הקישור לא נמצא</title>
<style>html,body{height:100%;margin:0}body{background:#0e0f13;color:#f3f4f6;font-family:system-ui,'Rubik',sans-serif;display:flex;align-items:center;justify-content:center;text-align:center}h1{font-size:22px;margin:0 0 8px}p{color:#9aa0ac;margin:0}.b{padding:0 24px}</style>
</head><body><div class="b"><h1>הקישור הזה לא קיים</h1><p>ייתכן שהוא נמחק או שהכתובת שגויה.</p></div></body></html>`;
}
