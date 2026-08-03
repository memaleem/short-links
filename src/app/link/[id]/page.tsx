import { notFound } from "next/navigation";
import { db } from "@/lib/supabase";
import { shortBase } from "@/lib/url";
import { summarize } from "@/lib/analytics";
import LinkDetail from "@/components/LinkDetail";
import type { LinkRow, ClickRow } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function LinkPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supa = db();

  const { data: linkData } = await supa.from("links").select("*").eq("id", id).maybeSingle();
  const link = linkData as LinkRow | null;
  if (!link) notFound();

  const { data: clickData } = await supa
    .from("clicks")
    .select("*")
    .eq("link_id", id)
    .order("created_at", { ascending: false })
    .limit(5000);

  const clicks = (clickData ?? []) as ClickRow[];
  const summary = summarize(clicks);

  return <LinkDetail link={link} summary={summary} shortHost={shortBase()} />;
}
