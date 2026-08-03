import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/supabase";
import { hubSecret } from "@/lib/hub";
import Hub from "@/components/Hub";
import type { HubLinkRow } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "המפה",
  description: "כל האתרים והמערכות במקום אחד.",
  robots: { index: false, follow: false },
};

/**
 * דף "המפה" — ריכוז כל הקישורים שלך בכתובת סודית.
 * צפייה חופשית (בלי סיסמה); עריכה דורשת את סיסמת לוח הבקרה.
 */
export default async function HubPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const secret = hubSecret();
  if (!secret || token !== secret) notFound();

  const supa = db();
  const { data } = await supa
    .from("hub_links")
    .select("*")
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  return <Hub links={(data ?? []) as HubLinkRow[]} hubPath={`/h/${secret}`} />;
}
