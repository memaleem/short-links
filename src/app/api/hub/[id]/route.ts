import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { HUB_CATEGORIES } from "@/lib/hub";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (body.title !== undefined) {
    const title = String(body.title).trim();
    if (!title) return NextResponse.json({ error: "חסר שם לקישור." }, { status: 400 });
    patch.title = title;
  }
  if (body.url !== undefined) {
    const url = normalizeUrl(String(body.url));
    if (!url) return NextResponse.json({ error: "כתובת לא תקינה." }, { status: 400 });
    patch.url = url;
  }
  if (body.description !== undefined) {
    patch.description = String(body.description).trim() || null;
  }
  if (body.category !== undefined) {
    const category = String(body.category).trim();
    if (!HUB_CATEGORIES.some((c) => c.key === category)) {
      return NextResponse.json({ error: "קטגוריה לא מוכרת." }, { status: 400 });
    }
    patch.category = category;
  }
  if (body.position !== undefined) {
    const position = Number(body.position);
    if (!Number.isFinite(position)) {
      return NextResponse.json({ error: "מיקום לא תקין." }, { status: 400 });
    }
    patch.position = position;
  }
  if (body.starred !== undefined) {
    if (typeof body.starred !== "boolean") {
      return NextResponse.json({ error: "ערך מועדפים לא תקין." }, { status: 400 });
    }
    patch.starred = body.starred;
  }

  const supa = db();
  const { data, error } = await supa
    .from("hub_links")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ link: data });
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const supa = db();
  const { error } = await supa.from("hub_links").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
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
