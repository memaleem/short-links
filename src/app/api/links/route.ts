import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { randomSlug, normalizeSlug, isValidSlug } from "@/lib/slug";
import { detectPlatform } from "@/lib/platform";
import { normalizeDestination, cleanUtm, cleanPixel } from "@/lib/validate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const supa = db();
  const { data, error } = await supa
    .from("links")
    .select("*")
    .eq("archived", false)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ links: data });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));

  const destination = normalizeDestination(String(body?.destination_url ?? ""));
  if (!destination) {
    return NextResponse.json(
      { error: "כתובת היעד לא תקינה. בדקו שהזנתם כתובת מלאה." },
      { status: 400 }
    );
  }

  const supa = db();

  // בחירת סיומת: מותאמת אישית או אקראית ייחודית.
  let slug: string;
  const requested = String(body?.slug ?? "").trim();
  if (requested) {
    slug = normalizeSlug(requested);
    if (!isValidSlug(slug)) {
      return NextResponse.json(
        { error: "הסיומת לא חוקית או שמורה. השתמשו באותיות לטיניות, ספרות ומקף." },
        { status: 400 }
      );
    }
    const { data: exists } = await supa.from("links").select("id").eq("slug", slug).maybeSingle();
    if (exists) {
      return NextResponse.json({ error: "הסיומת הזו כבר תפוסה. בחרו אחרת." }, { status: 409 });
    }
  } else {
    slug = await uniqueRandomSlug(supa);
  }

  const platform = String(body?.platform ?? "").trim() || detectPlatform(destination);

  const { data, error } = await supa
    .from("links")
    .insert({
      slug,
      destination_url: destination,
      title: String(body?.title ?? "").trim() || null,
      platform,
      utm: cleanUtm(body?.utm),
      pixel: cleanPixel(body?.pixel),
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ link: data }, { status: 201 });
}

async function uniqueRandomSlug(
  supa: ReturnType<typeof db>
): Promise<string> {
  for (let i = 0; i < 6; i++) {
    const s = randomSlug(i < 3 ? 6 : 7);
    const { data } = await supa.from("links").select("id").eq("slug", s).maybeSingle();
    if (!data) return s;
  }
  return randomSlug(9);
}
