import { createClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client, bound to the `links` schema, using the service
 * role key. The browser never talks to Supabase directly — all access goes
 * through server components and API routes behind the password gate.
 *
 * A single cached client is reused across requests (recommended). Creating a
 * new client per request churns HTTP connections needlessly.
 */
function makeClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase env vars missing (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)");
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
    db: { schema: "links" },
  });
}

let cached: ReturnType<typeof makeClient> | null = null;

export function db() {
  return (cached ??= makeClient());
}
