"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { HubLinkRow } from "@/lib/types";
import { HUB_CATEGORIES } from "@/lib/hub";
import Modal from "./Modal";

/**
 * "המפה" — כל האתרים והמערכות שלך בדף אחד.
 * צפייה חופשית; מעבר למצב עריכה מאומת מול השרת (עוגיית לוח הבקרה).
 */
export default function Hub({
  links,
  hubPath,
}: {
  links: HubLinkRow[];
  hubPath: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(false);
  const [editing, setEditing] = useState<HubLinkRow | null>(null);
  const [creatingIn, setCreatingIn] = useState<string | null>(null);
  const [starBusy, setStarBusy] = useState<string | null>(null);
  const [pageCopied, setPageCopied] = useState(false);

  // חזרה ממסך הכניסה עם ?edit=1 — נכנסים ישר למצב עריכה, בלי לחיצה נוספת.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("edit") !== "1") return;
    window.history.replaceState(null, "", window.location.pathname);
    fetch("/api/hub").then((res) => {
      if (res.ok) setEditMode(true);
    });
  }, []);

  const q = query.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      q
        ? links.filter(
            (l) =>
              l.title.toLowerCase().includes(q) ||
              (l.description ?? "").toLowerCase().includes(q) ||
              l.url.toLowerCase().includes(q)
          )
        : links,
    [links, q]
  );

  const sections = useMemo(
    () =>
      HUB_CATEGORIES.map((cat) => ({
        ...cat,
        items: filtered
          .filter((l) => l.category === cat.key)
          .sort((a, b) => a.position - b.position),
      })).filter((s) => s.items.length > 0 || (editMode && !q)),
    [filtered, editMode, q]
  );

  // מדף המועדפים: המסומנים בכוכב, לפי סדר הקטגוריות ואז לפי מיקום.
  const favorites = useMemo(() => {
    const order = new Map(HUB_CATEGORIES.map((c, i) => [c.key, i]));
    return filtered
      .filter((l) => l.starred)
      .sort(
        (a, b) =>
          (order.get(a.category) ?? 99) - (order.get(b.category) ?? 99) ||
          a.position - b.position
      );
  }, [filtered]);

  async function toggleEdit() {
    if (editMode) return setEditMode(false);
    setCheckingAuth(true);
    try {
      const res = await fetch("/api/hub");
      if (res.ok) {
        setEditMode(true);
      } else {
        window.location.href = `/login?next=${encodeURIComponent(`${hubPath}?edit=1`)}`;
      }
    } finally {
      setCheckingAuth(false);
    }
  }

  async function copyPageUrl() {
    const url = window.location.origin + hubPath;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const el = document.createElement("textarea");
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      el.remove();
    }
    setPageCopied(true);
    setTimeout(() => setPageCopied(false), 1600);
  }

  async function toggleStar(row: HubLinkRow) {
    if (starBusy) return;
    setStarBusy(row.id);
    try {
      const res = await fetch(`/api/hub/${row.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ starred: !row.starred }),
      });
      if (res.status === 401) {
        window.location.href = `/login?next=${encodeURIComponent(hubPath)}`;
        return;
      }
      router.refresh();
    } finally {
      setStarBusy(null);
    }
  }

  async function remove(row: HubLinkRow) {
    if (!confirm(`למחוק את "${row.title}" מהמפה?`)) return;
    const res = await fetch(`/api/hub/${row.id}`, { method: "DELETE" });
    if (!res.ok) alert("המחיקה נכשלה. נסו שוב.");
    router.refresh();
  }

  async function move(row: HubLinkRow, dir: -1 | 1, items: HubLinkRow[]) {
    const idx = items.findIndex((l) => l.id === row.id);
    const other = items[idx + dir];
    if (!other) return;
    await Promise.all([
      fetch(`/api/hub/${row.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ position: other.position }),
      }),
      fetch(`/api/hub/${other.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ position: row.position }),
      }),
    ]);
    router.refresh();
  }

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto", padding: "28px 20px 90px" }}>
      {/* כותרת */}
      <header style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <span className="live-dot" />
            <span style={{ fontSize: 13, color: "var(--muted)", letterSpacing: 0.3 }}>המפה</span>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: "8px 0 4px" }}>כל הקישורים שלך. מקום אחד.</h1>
          <p style={{ color: "var(--muted)", fontSize: 14.5, margin: 0 }}>
            {links.length} קישורים · הקלידו שם או נושא כדי למצוא מיד.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <button
            className={`btn btn-ghost${pageCopied ? " flash" : ""}`}
            onClick={copyPageUrl}
            title="העתקת הכתובת של הדף הזה, לשליחה בוואטסאפ או במייל"
          >
            {pageCopied ? "✓ הועתק" : "העתקת כתובת הדף"}
          </button>
          <button className="btn btn-ghost" onClick={toggleEdit} disabled={checkingAuth}>
            {checkingAuth ? "רגע…" : editMode ? "סיום עריכה" : "עריכה"}
          </button>
        </div>
      </header>

      {/* חיפוש */}
      <div className="hub-search">
        <input
          className="input"
          type="search"
          inputMode="search"
          placeholder="חיפוש לפי שם או נושא…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="חיפוש קישור"
          style={{ fontSize: 16, padding: "13px 16px" }}
        />
      </div>

      {q && filtered.length === 0 && (
        <p style={{ color: "var(--muted)", textAlign: "center", padding: "40px 0" }}>
          לא נמצא כלום עבור "{query}". נסו מילה אחרת, או עברו למצב עריכה והוסיפו את הקישור.
        </p>
      )}

      {/* מדף המועדפים */}
      {favorites.length > 0 && (
        <section style={{ marginTop: 34 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 4 }}>
            <h2 style={{ fontSize: 18.5, fontWeight: 700, margin: 0, color: "var(--accent)" }}>★ מועדפים</h2>
            <span className="chip">{favorites.length}</span>
          </div>
          <div className="hub-grid" style={{ marginTop: 10 }}>
            {favorites.map((row) => (
              <HubCard
                key={`fav-${row.id}`}
                row={row}
                editMode={false}
                starBusy={starBusy === row.id}
                onToggleStar={() => toggleStar(row)}
                onEdit={() => setEditing(row)}
                onDelete={() => remove(row)}
                onMove={() => {}}
              />
            ))}
          </div>
        </section>
      )}

      {/* קטגוריות */}
      {sections.map((sec) => (
        <section key={sec.key} style={{ marginTop: 34 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 4 }}>
            <h2 style={{ fontSize: 18.5, fontWeight: 700, margin: 0 }}>{sec.label}</h2>
            <span className="chip">{sec.items.length}</span>
            {editMode && (
              <button className="btn btn-quiet" style={{ marginInlineStart: "auto" }} onClick={() => setCreatingIn(sec.key)}>
                + הוספה
              </button>
            )}
          </div>
          {sec.hint && (
            <p style={{ color: "var(--faint)", fontSize: 13, margin: "0 0 10px" }}>{sec.hint}</p>
          )}
          <div className="hub-grid" style={{ marginTop: 10 }}>
            {sec.items.map((row) => (
              <HubCard
                key={row.id}
                row={row}
                editMode={editMode}
                starBusy={starBusy === row.id}
                onToggleStar={() => toggleStar(row)}
                onEdit={() => setEditing(row)}
                onDelete={() => remove(row)}
                onMove={(dir) => move(row, dir, sec.items)}
              />
            ))}
          </div>
        </section>
      ))}

      {(editing || creatingIn) && (
        <HubForm
          row={editing}
          presetCategory={creatingIn ?? editing?.category ?? "main"}
          onClose={() => {
            setEditing(null);
            setCreatingIn(null);
          }}
          onSaved={() => {
            setEditing(null);
            setCreatingIn(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function HubCard({
  row,
  editMode,
  starBusy,
  onToggleStar,
  onEdit,
  onDelete,
  onMove,
}: {
  row: HubLinkRow;
  editMode: boolean;
  starBusy: boolean;
  onToggleStar: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  const domain = hostOf(row.url);
  const copy = <CopyUrlButton url={row.url} />;
  const star = (
    <button
      type="button"
      className={`hub-star${row.starred ? " on" : ""}`}
      aria-label={row.starred ? "הסרה מהמועדפים" : "הוספה למועדפים"}
      title={row.starred ? "הסרה מהמועדפים" : "הוספה למועדפים"}
      disabled={starBusy}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggleStar();
      }}
    >
      {row.starred ? "★" : "☆"}
    </button>
  );
  const body = (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 10, paddingInlineEnd: 62 }}>
        <SiteIcon domain={domain} title={row.title} />
        <strong style={{ fontSize: 15.5, lineHeight: 1.3 }}>{row.title}</strong>
      </div>
      {row.description && (
        <p style={{ color: "var(--muted)", fontSize: 13.5, margin: "8px 0 0", lineHeight: 1.5 }}>{row.description}</p>
      )}
      <span className="mono" style={{ display: "block", color: "var(--faint)", fontSize: 11.5, marginTop: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {domain}
      </span>
    </>
  );

  if (!editMode) {
    return (
      <a className="hub-card" href={row.url} target="_blank" rel="noopener noreferrer">
        {star}
        {copy}
        {body}
      </a>
    );
  }

  return (
    <div className="hub-card" style={{ cursor: "default" }}>
      {star}
      {copy}
      {body}
      <div style={{ display: "flex", gap: 6, marginTop: 12, borderTop: "1px solid var(--border-soft)", paddingTop: 10 }}>
        <button className="btn btn-quiet" onClick={onEdit}>עריכה</button>
        <button className="btn btn-quiet" style={{ color: "var(--danger)" }} onClick={onDelete}>מחיקה</button>
        <span style={{ marginInlineStart: "auto", display: "flex", gap: 2 }}>
          <button className="btn btn-quiet" aria-label="הזזה למעלה" onClick={() => onMove(-1)}>▲</button>
          <button className="btn btn-quiet" aria-label="הזזה למטה" onClick={() => onMove(1)}>▼</button>
        </span>
      </div>
    </div>
  );
}

function HubForm({
  row,
  presetCategory,
  onClose,
  onSaved,
}: {
  row: HubLinkRow | null;
  presetCategory: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(row?.title ?? "");
  const [url, setUrl] = useState(row?.url ?? "");
  const [description, setDescription] = useState(row?.description ?? "");
  const [category, setCategory] = useState(row?.category ?? presetCategory);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const payload = { title, url, description, category };
    const res = row
      ? await fetch(`/api/hub/${row.id}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await fetch("/api/hub", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        });
    if (res.ok) return onSaved();
    const data = await res.json().catch(() => ({}));
    setError(data?.error ?? "השמירה נכשלה. נסו שוב.");
    setSaving(false);
  }

  return (
    <Modal title={row ? "עריכת קישור" : "קישור חדש"} onClose={onClose} width={480}>
      <form onSubmit={save}>
        <label className="label" htmlFor="hub-title">שם</label>
        <input id="hub-title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus placeholder="למשל: הזמנת הרצאות" />

        <label className="label" htmlFor="hub-url" style={{ marginTop: 14 }}>כתובת</label>
        <input id="hub-url" className="input mono" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." dir="ltr" />

        <label className="label" htmlFor="hub-desc" style={{ marginTop: 14 }}>תיאור קצר (לא חובה)</label>
        <input id="hub-desc" className="input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="מה יש שם?" />

        <label className="label" htmlFor="hub-cat" style={{ marginTop: 14 }}>קטגוריה</label>
        <select id="hub-cat" className="select" value={category} onChange={(e) => setCategory(e.target.value)}>
          {HUB_CATEGORIES.map((c) => (
            <option key={c.key} value={c.key}>{c.label}</option>
          ))}
        </select>

        {error && <p style={{ color: "var(--danger)", fontSize: 14, margin: "12px 0 0" }}>{error}</p>}

        <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
          <button className="btn btn-primary" type="submit" disabled={saving || !title.trim() || !url.trim()}>
            {saving ? "שומר…" : "שמירה"}
          </button>
          <button className="btn btn-ghost" type="button" onClick={onClose}>ביטול</button>
        </div>
      </form>
    </Modal>
  );
}

/**
 * סמל האתר. מגיע מנקודת הקצה שלנו (/api/icon) שמאתרת את הסמל האמיתי של
 * כל דומיין ושומרת אותו במטמון. אם אין סמל בשום מקום - עיגול עם האות
 * הראשונה של השם, שתמיד נראה טוב.
 */
/** כפתור העתקת הכתובת של האתר — לשליחה מהירה בוואטסאפ או במייל. */
function CopyUrlButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const el = document.createElement("textarea");
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      el.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <button
      type="button"
      className={`hub-copy${copied ? " copied" : ""}`}
      aria-label="העתקת הכתובת"
      title="העתקת הכתובת לשליחה בוואטסאפ או במייל"
      onClick={copy}
    >
      {copied ? (
        "✓"
      ) : (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="9" y="9" width="12" height="12" rx="2.5" />
          <path d="M5 15h-.5A2.5 2.5 0 0 1 2 12.5v-8A2.5 2.5 0 0 1 4.5 2h8A2.5 2.5 0 0 1 15 4.5V5" />
        </svg>
      )}
      {copied && <span className="hub-copied-tip">הכתובת הועתקה</span>}
    </button>
  );
}

function SiteIcon({ domain, title }: { domain: string; title: string }) {
  const sources = useMemo(
    () => [`/api/icon?domain=${encodeURIComponent(domain)}`],
    [domain]
  );
  const [idx, setIdx] = useState(0);

  if (idx >= sources.length) {
    return (
      <span
        aria-hidden
        style={{
          width: 22,
          height: 22,
          borderRadius: 6,
          flexShrink: 0,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--accent-glow)",
          color: "var(--accent)",
          fontSize: 12,
          fontWeight: 700,
        }}
      >
        {title.trim().charAt(0) || "•"}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={sources[idx]}
      alt=""
      width={22}
      height={22}
      loading="lazy"
      onError={() => setIdx((i) => i + 1)}
      style={{ borderRadius: 6, flexShrink: 0, background: "var(--surface-3)" }}
    />
  );
}

function hostOf(url: string): string {
  try {
    // host כולל פורט - חשוב לכלים מקומיים (localhost:8765 מול localhost:8777).
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return url;
  }
}
