import { db } from "@/lib/supabase";
import { shortBase } from "@/lib/url";
import { hubSecret } from "@/lib/hub";
import Dashboard from "@/components/Dashboard";
import type { LinkRow } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supa = db();
  const { data } = await supa
    .from("links")
    .select("*")
    .eq("archived", false)
    .order("created_at", { ascending: false });

  const links = (data ?? []) as LinkRow[];
  const secret = hubSecret();
  return (
    <Dashboard
      links={links}
      shortHost={shortBase()}
      hubPath={secret ? `/h/${secret}` : undefined}
    />
  );
}
