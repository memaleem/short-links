import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { normalizeSlug, isValidSlug } from "@/lib/slug";
import { normalizeDestination, cleanUtm, cleanPixel } from "@/lib/validate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const supa = db();

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (body?.destination_url !== undefined) {
    const dest = normalizeDestination(String(body.destination_url));
    if (!dest) {
      return NextResponse.json({ error: "כתובת היעד לא תקינה." }, { status: 400 });
    }
    update.destination_url = dest;
  }

  if (body?.slug !== undefined) {
    const slug = normalizeSlug(String(body.slug));
    if (!isValidSlug(slug)) {
      return NextResponse.json({ error: "הסיומת לא חוקית או שמורה." }, { status: 400 });
    }
    const { data: exists } = await supa
      .from("links")
      .select("id")
      .eq("slug", slug)
      .neq("id", id)
      .maybeSingle();
    if (exists) {
      return NextResponse.json({ error: "הסיומת הזו כבר תפוסה." }, { status: 409 });
    }
    update.slug = slug;
  }

  if (body?.title !== undefined) update.title = String(body.title).trim() || null;
  if (body?.platform !== undefined) update.platform = String(body.platform).trim() || null;
  if (body?.utm !== undefined) update.utm = cleanUtm(body.utm);
  if (body?.pixel !== undefined) update.pixel = cleanPixel(body.pixel);
  if (body?.archived !== undefined) update.archived = !!body.archived;

  const { data, error } = await supa
    .from("links")
    .update(update)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ link: data });
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const hard = req.nextUrl.searchParams.get("hard") === "1";
  const supa = db();

  if (hard) {
    const { error } = await supa.from("links").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, deleted: true });
  }

  // ברירת מחדל: השבתה רכה. הסיומת נשארת שמורה והנתונים ההיסטוריים נשמרים.
  const { error } = await supa
    .from("links")
    .update({ archived: true, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, archived: true });
}
