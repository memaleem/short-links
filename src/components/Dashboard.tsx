"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { LinkRow } from "@/lib/types";
import { PLATFORMS } from "@/lib/platform";
import LinkForm from "./LinkForm";
import Modal from "./Modal";
import CopyButton from "./CopyButton";
import QrCode from "./QrCode";
import { PlatformChip, formatDate, StatTile } from "./bits";

export default function Dashboard({
  links,
  shortHost,
  hubPath,
}: {
  links: LinkRow[];
  shortHost: string;
  hubPath?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [platformFilter, setPlatformFilter] = useState<string>("");
  const [creating, setCreating] = useState(false);
  const [justCreated, setJustCreated] = useState<LinkRow | null>(null);

  const shortUrl = (slug: string) => `https://${shortHost}/${slug}`;

  const totalClicks = useMemo(
    () => links.reduce((s, l) => s + (l.click_count || 0), 0),
    [links]
  );
  const platformsUsed = useMemo(
    () => new Set(links.map((l) => l.platform || "other")).size,
    [links]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return links.filter((l) => {
      if (platformFilter && (l.platform || "other") !== platformFilter) return false;
      if (!q) return true;
      return (
        (l.title || "").toLowerCase().includes(q) ||
        l.slug.toLowerCase().includes(q) ||
        l.destination_url.toLowerCase().includes(q)
      );
    });
  }, [links, query, platformFilter, ]);

  const activePlatforms = useMemo(() => {
    const s = new Set(links.map((l) => l.platform || "other"));
    return [...s];
  }, [links]);

  return (
    <div style={{ maxWidth: 940, margin: "0 auto", padding: "28px 20px 80px" }}>
      {/* Header */}
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 26 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <span className="live-dot" />
            <span style={{ fontSize: 13, color: "var(--muted)", letterSpacing: 0.3 }}>קיצור קישורים</span>
          </div>
          <h1 style={{ fontSize: 27, fontWeight: 700, margin: "8px 0 0" }}>הקישורים שלי</h1>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-primary" onClick={() => setCreating(true)}>
            + קישור חדש
          </button>
          {hubPath && (
            <Link className="btn btn-ghost" href={hubPath}>
              המפה
            </Link>
          )}
          <button
            className="btn btn-quiet"
            onClick={async () => {
              await fetch("/api/auth", { method: "DELETE" });
              router.replace("/login");
              router.refresh();
            }}
          >
            יציאה
          </button>
        </div>
      </header>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 22 }}>
        <StatTile value={links.length} label="קישורים פעילים" />
        <StatTile value={totalClicks.toLocaleString("en-US")} label="סך הלחיצות" accent />
        <StatTile value={platformsUsed} label="פלטפורמות" />
      </div>

      {/* Search + filters */}
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
        <input
          className="input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="חיפוש לפי כותרת, סיומת או יעד…"
          style={{ flex: 1, minWidth: 220 }}
        />
      </div>
      {activePlatforms.length > 1 && (
        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          <FilterChip label="הכל" active={!platformFilter} onClick={() => setPlatformFilter("")} />
          {activePlatforms.map((p) => (
            <FilterChip
              key={p}
              label={`${PLATFORMS[p]?.emoji ?? "🔗"} ${PLATFORMS[p]?.label ?? p}`}
              active={platformFilter === p}
              onClick={() => setPlatformFilter(platformFilter === p ? "" : p)}
            />
          ))}
        </div>
      )}

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState hasLinks={links.length > 0} onCreate={() => setCreating(true)} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map((l, i) => (
            <div key={l.id} className="rise" style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}>
              <LinkRowCard link={l} shortUrl={shortUrl(l.slug)} />
            </div>
          ))}
        </div>
      )}

      {/* Create modal */}
      {creating && (
        <Modal title="קישור חדש" onClose={() => setCreating(false)}>
          <LinkForm
            mode="create"
            onSaved={(link) => {
              setCreating(false);
              setJustCreated(link);
              router.refresh();
            }}
            onCancel={() => setCreating(false)}
          />
        </Modal>
      )}

      {/* Success modal */}
      {justCreated && (
        <Modal title="הקישור מוכן 🎉" onClose={() => setJustCreated(null)} width={480}>
          <SuccessCard link={justCreated} shortUrl={shortUrl(justCreated.slug)} onClose={() => setJustCreated(null)} />
        </Modal>
      )}
    </div>
  );
}

function LinkRowCard({ link, shortUrl }: { link: LinkRow; shortUrl: string }) {
  return (
    <div
      className="card"
      style={{
        padding: "16px 18px",
        display: "flex",
        alignItems: "center",
        gap: 16,
        boxShadow: "none",
        transition: "border-color .15s, transform .12s",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 7 }}>
          <PlatformChip platform={link.platform} />
          <span style={{ fontWeight: 600, fontSize: 15.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {link.title || link.slug}
          </span>
        </div>
        <Link href={`/link/${link.id}`} className="mono" style={{ fontSize: 14, color: "var(--accent)", textDecoration: "none" }}>
          {shortUrl.replace(/^https:\/\//, "")}
        </Link>
        <div className="mono" style={{ fontSize: 12.5, color: "var(--faint)", marginTop: 5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 460 }} dir="ltr">
          ↳ {link.destination_url}
        </div>
      </div>

      <div style={{ textAlign: "center", minWidth: 64 }}>
        <div className="mono" style={{ fontSize: 22, fontWeight: 700 }}>{(link.click_count || 0).toLocaleString("en-US")}</div>
        <div style={{ fontSize: 11.5, color: "var(--muted)" }}>לחיצות</div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "stretch" }}>
        <CopyButton text={shortUrl} label="העתקה" compact />
        <Link href={`/link/${link.id}`} className="btn btn-quiet" style={{ fontSize: 13.5, padding: "7px 12px" }}>
          פתיחה
        </Link>
      </div>
    </div>
  );
}

function SuccessCard({ link, shortUrl, onClose }: { link: LinkRow; shortUrl: string; onClose: () => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, alignItems: "center", textAlign: "center" }}>
      <div style={{ width: "100%", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <span className="mono" style={{ fontSize: 15, color: "var(--accent)" }} dir="ltr">
          {shortUrl.replace(/^https:\/\//, "")}
        </span>
        <CopyButton text={shortUrl} label="העתקה" compact />
      </div>
      <QrCode value={shortUrl} filename={link.slug} size={170} />
      <div style={{ display: "flex", gap: 10 }}>
        <a className="btn btn-ghost" href={`/link/${link.id}`}>לצפייה ולעריכה</a>
        <button className="btn btn-quiet" onClick={onClose}>סגירה</button>
      </div>
    </div>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="chip"
      style={{
        cursor: "pointer",
        borderColor: active ? "var(--accent)" : "var(--border)",
        color: active ? "var(--accent)" : "var(--muted)",
        background: active ? "var(--accent-glow)" : "var(--surface-2)",
      }}
    >
      {label}
    </button>
  );
}

function EmptyState({ hasLinks, onCreate }: { hasLinks: boolean; onCreate: () => void }) {
  return (
    <div className="card" style={{ padding: "56px 24px", textAlign: "center", boxShadow: "none" }}>
      <div style={{ fontSize: 34, marginBottom: 10 }}>🔗</div>
      <h3 style={{ margin: "0 0 8px", fontSize: 18 }}>
        {hasLinks ? "אין קישורים שתואמים לחיפוש" : "עוד אין קישורים"}
      </h3>
      <p style={{ color: "var(--muted)", margin: "0 0 20px" }}>
        {hasLinks ? "נסו מונח אחר או נקו את הסינון." : "צרו את הקישור הראשון וקבלו כתובת קצרה לשיתוף."}
      </p>
      {!hasLinks && (
        <button className="btn btn-primary" onClick={onCreate}>
          + יצירת קישור ראשון
        </button>
      )}
    </div>
  );
}
