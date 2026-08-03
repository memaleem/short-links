"use client";

import { useState } from "react";
import { PLATFORMS, PLATFORM_KEYS, detectPlatform } from "@/lib/platform";
import { shortBase } from "@/lib/url";
import type { LinkRow } from "@/lib/types";

type Props = {
  mode: "create" | "edit";
  initial?: LinkRow;
  onSaved: (link: LinkRow) => void;
  onCancel?: () => void;
};

export default function LinkForm({ mode, initial, onSaved, onCancel }: Props) {
  const [destination, setDestination] = useState(initial?.destination_url ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [platform, setPlatform] = useState(initial?.platform ?? "");
  const [platformTouched, setPlatformTouched] = useState(!!initial?.platform);

  const [utm, setUtm] = useState({
    source: initial?.utm?.source ?? "",
    medium: initial?.utm?.medium ?? "",
    campaign: initial?.utm?.campaign ?? "",
    term: initial?.utm?.term ?? "",
    content: initial?.utm?.content ?? "",
  });
  const [pixel, setPixel] = useState({
    fb: initial?.pixel?.fb ?? "",
    gtag: initial?.pixel?.gtag ?? "",
  });

  const [showUtm, setShowUtm] = useState(hasAny(initial?.utm));
  const [showPixel, setShowPixel] = useState(!!(initial?.pixel?.fb || initial?.pixel?.gtag));

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function onDestinationChange(v: string) {
    setDestination(v);
    if (!platformTouched && v.trim().length > 6) {
      setPlatform(detectPlatform(v));
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!destination.trim()) {
      setError("צריך להזין כתובת יעד.");
      return;
    }
    setSaving(true);
    const payload = {
      destination_url: destination,
      title,
      slug: slug || undefined,
      platform: platform || undefined,
      utm,
      pixel,
    };
    const url = mode === "create" ? "/api/links" : `/api/links/${initial!.id}`;
    const method = mode === "create" ? "POST" : "PATCH";
    const res = await fetch(url, {
      method,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(json?.error || "משהו השתבש. נסו שוב.");
      return;
    }
    onSaved(json.link as LinkRow);
  }

  return (
    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* יעד */}
      <div>
        <label className="label">כתובת היעד (לאן הקישור מפנה)</label>
        <input
          className="input mono"
          value={destination}
          onChange={(e) => onDestinationChange(e.target.value)}
          placeholder="https://..."
          autoFocus={mode === "create"}
          dir="ltr"
        />
        {mode === "edit" && (
          <p style={{ fontSize: 12.5, color: "var(--muted)", margin: "7px 2px 0" }}>
            אפשר לשנות את היעד בכל רגע. הקישור הקצר עצמו לא משתנה ולא נשבר.
          </p>
        )}
      </div>

      {/* כותרת + פלטפורמה */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 170px", gap: 14 }}>
        <div>
          <label className="label">כותרת (שם פנימי)</label>
          <input
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="למשל: הרצאת הורים - מודעה"
          />
        </div>
        <div>
          <label className="label">פלטפורמה</label>
          <select
            className="select"
            value={platform || "landing"}
            onChange={(e) => {
              setPlatform(e.target.value);
              setPlatformTouched(true);
            }}
          >
            {PLATFORM_KEYS.map((k) => (
              <option key={k} value={k}>
                {PLATFORMS[k].emoji} {PLATFORMS[k].label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* סיומת */}
      <div>
        <label className="label">סיומת הקישור {mode === "create" && "(אפשר להשאיר ריק - ייווצר קוד אקראי)"}</label>
        <div
          style={{
            display: "flex",
            alignItems: "stretch",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-sm)",
            overflow: "hidden",
            background: "var(--bg)",
          }}
        >
          <span
            className="mono"
            style={{
              display: "flex",
              alignItems: "center",
              padding: "0 12px",
              background: "var(--surface-2)",
              color: "var(--muted)",
              fontSize: 14,
              borderInlineEnd: "1px solid var(--border)",
            }}
          >
            {shortBase()}/
          </span>
          <input
            className="mono"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="hartzaa"
            dir="ltr"
            style={{
              flex: 1,
              border: 0,
              background: "transparent",
              color: "var(--text)",
              padding: "11px 12px",
              fontSize: 14,
              outline: "none",
              textAlign: "left",
            }}
          />
        </div>
      </div>

      {/* מתקדם: UTM */}
      <Section
        title="פרמטרי מעקב (UTM)"
        hint="לניתוח ב-Google Analytics / הפרסום"
        open={showUtm}
        onToggle={() => setShowUtm((v) => !v)}
      >
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="מקור (source)" value={utm.source} onChange={(v) => setUtm({ ...utm, source: v })} placeholder="whatsapp" />
          <Field label="מדיום (medium)" value={utm.medium} onChange={(v) => setUtm({ ...utm, medium: v })} placeholder="social" />
          <Field label="קמפיין (campaign)" value={utm.campaign} onChange={(v) => setUtm({ ...utm, campaign: v })} placeholder="hartzaa-horim" />
          <Field label="תוכן (content)" value={utm.content} onChange={(v) => setUtm({ ...utm, content: v })} placeholder="story-1" />
        </div>
      </Section>

      {/* מתקדם: פיקסל */}
      <Section
        title="פיקסל ריטרגטינג"
        hint="פרסום אחר כך למי שלחץ"
        open={showPixel}
        onToggle={() => setShowPixel((v) => !v)}
      >
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Meta / Facebook Pixel ID" value={pixel.fb} onChange={(v) => setPixel({ ...pixel, fb: v })} placeholder="1234567890" mono />
          <Field label="Google tag (AW-/G-)" value={pixel.gtag} onChange={(v) => setPixel({ ...pixel, gtag: v })} placeholder="AW-123456789" mono />
        </div>
        <p style={{ fontSize: 12.5, color: "var(--muted)", margin: "10px 2px 0", lineHeight: 1.6 }}>
          קישור עם פיקסל עובר דרך דף ביניים זעיר (פחות משנייה) שמפעיל את הפיקסל, ואז מעביר ליעד. בלי פיקסל - ההעברה מיידית.
        </p>
      </Section>

      {error && <p style={{ color: "var(--danger)", fontSize: 14, margin: 0 }}>{error}</p>}

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-start", marginTop: 4 }}>
        <button className="btn btn-primary" type="submit" disabled={saving}>
          {saving ? "שומר…" : mode === "create" ? "יצירת קישור" : "שמירת שינויים"}
        </button>
        {onCancel && (
          <button className="btn btn-quiet" type="button" onClick={onCancel}>
            ביטול
          </button>
        )}
      </div>
    </form>
  );
}

function hasAny(u: LinkRow["utm"] | undefined): boolean {
  return !!u && Object.values(u).some((v) => (v || "").trim());
}

function Section({
  title,
  hint,
  open,
  onToggle,
  children,
}: {
  title: string;
  hint: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", overflow: "hidden" }}>
      <button
        type="button"
        onClick={onToggle}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 14px",
          background: "var(--surface-2)",
          border: 0,
          color: "var(--text)",
          cursor: "pointer",
          fontFamily: "var(--font-ui)",
          fontSize: 14.5,
          fontWeight: 600,
        }}
      >
        <span>
          {title}{" "}
          <span style={{ color: "var(--muted)", fontWeight: 400, fontSize: 13 }}>· {hint}</span>
        </span>
        <span style={{ color: "var(--muted)", transform: open ? "rotate(180deg)" : "none", transition: "transform .15s" }}>
          ⌄
        </span>
      </button>
      {open && <div style={{ padding: 14, background: "var(--bg)" }}>{children}</div>}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  mono,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  mono?: boolean;
}) {
  return (
    <div>
      <label className="label" style={{ fontSize: 12.5 }}>
        {label}
      </label>
      <input
        className={`input ${mono ? "mono" : ""}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        dir={mono ? "ltr" : undefined}
        style={{ padding: "9px 12px", fontSize: 14 }}
      />
    </div>
  );
}
