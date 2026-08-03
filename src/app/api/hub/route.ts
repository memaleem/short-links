import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { HUB_CATEGORIES } from "@/lib/hub";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** בדיקת התחברות בלבד — המידלוור חוסם לא-מחוברים לפני שמגיעים לכאן. */
export async function GET() {
  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));

  const title = String(body?.title ?? "").trim();
  const url = normalizeUrl(String(body?.url ?? ""));
  const description = String(body?.description ?? "").trim() || null;
  const category = String(body?.category ?? "").trim();

  if (!title) return NextResponse.json({ error: "חסר שם לקישור." }, { status: 400 });
  if (!url) return NextResponse.json({ error: "כתובת לא תקינה. בדקו שהזנתם כתובת מלאה." }, { status: 400 });
  if (!HUB_CATEGORIES.some((c) => c.key === category)) {
    return NextResponse.json({ error: "קטגוריה לא מוכרת." }, { status: 400 });
  }

  const supa = db();
  const { data: last } = await supa
    .from("hub_links")
    .select("position")
    .eq("category", category)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await supa
    .from("hub_links")
    .insert({ title, url, description, category, position: (last?.position ?? 0) + 1 })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ link: data }, { status: 201 });
}

function normalizeUrl(raw: string): string | null {
  let value = raw.trim();
  if (!value) return null;
  if (!/^https?:\/\//i.test(value)) value = `https://${value}`;
  try {
    const u = new URL(value);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.toString();
  } catch {
    return null;
  }
}
