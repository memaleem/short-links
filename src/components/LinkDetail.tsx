"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { LinkRow } from "@/lib/types";
import type { Summary, Bucket } from "@/lib/analytics";
import { flag } from "@/lib/analytics";
import { hasUtm } from "@/lib/url";
import { hasPixel } from "@/lib/pixel";
import LinkForm from "./LinkForm";
import CopyButton from "./CopyButton";
import QrCode from "./QrCode";
import { PlatformChip } from "./bits";

export default function LinkDetail({
  link,
  summary,
  shortHost,
}: {
  link: LinkRow;
  summary: Summary;
  shortHost: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const shortUrl = `https://${shortHost}/${link.slug}`;

  async function archive() {
    if (!confirm("להשבית את הקישור? הוא יפסיק לעבוד אבל הנתונים יישמרו.")) return;
    setBusy(true);
    await fetch(`/api/links/${link.id}`, { method: "DELETE" });
    router.push("/");
    router.refresh();
  }

  async function remove() {
    if (!confirm("למחוק לצמיתות? פעולה זו לא ניתנת לביטול והלחיצות יימחקו.")) return;
    setBusy(true);
    await fetch(`/api/links/${link.id}?hard=1`, { method: "DELETE" });
    router.push("/");
    router.refresh();
  }

  return (
    <div style={{ maxWidth: 940, margin: "0 auto", padding: "24px 20px 80px" }}>
      <Link href="/" className="btn-quiet" style={{ display: "inline-flex", textDecoration: "none", marginBottom: 18, padding: "6px 2px", color: "var(--muted)" }}>
        → חזרה לכל הקישורים
      </Link>

      {/* Hero */}
      <div className="card rise" style={{ padding: 24, marginBottom: 18 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 20, alignItems: "flex-start", justifyContent: "space-between" }}>
          <div style={{ flex: 1, minWidth: 260 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <PlatformChip platform={link.platform} />
              {hasUtm(link.utm) && <span className="chip">UTM</span>}
              {hasPixel(link.pixel) && <span className="chip" style={{ color: "var(--amber)" }}>פיקסל פעיל</span>}
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 14px" }}>{link.title || link.slug}</h1>

            <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
              <a href={shortUrl} target="_blank" rel="noreferrer" className="mono" style={{ fontSize: 15, color: "var(--accent)", textDecoration: "none" }} dir="ltr">
                {shortUrl.replace(/^https:\/\//, "")}
              </a>
              <CopyButton text={shortUrl} label="העתקה" compact />
            </div>
            <div className="mono" style={{ fontSize: 13, color: "var(--faint)", wordBreak: "break-all" }} dir="ltr">
              ↳ {link.destination_url}
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
              <button className="btn btn-ghost" onClick={() => setEditing((v) => !v)}>
                {editing ? "סגירת עריכה" : "עריכת קישור"}
              </button>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
            <div style={{ textAlign: "center" }}>
              <div className="mono" style={{ fontSize: 40, fontWeight: 700, color: "var(--accent)", lineHeight: 1 }}>
                {(link.click_count || 0).toLocaleString("en-US")}
              </div>
              <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 6 }}>סך הלחיצות</div>
            </div>
            <QrCode value={shortUrl} filename={link.slug} size={150} />
          </div>
        </div>

        {editing && (
          <div style={{ marginTop: 22, paddingTop: 22, borderTop: "1px solid var(--border)" }}>
            <LinkForm
              mode="edit"
              initial={link}
              onSaved={() => {
                setEditing(false);
                router.refresh();
              }}
              onCancel={() => setEditing(false)}
            />
          </div>
        )}
      </div>

      {/* Analytics */}
      {summary.total === 0 ? (
        <div className="card" style={{ padding: 34, textAlign: "center", boxShadow: "none", color: "var(--muted)" }}>
          עדיין אין לחיצות. ברגע שמישהו ילחץ על הקישור, הנתונים יופיעו כאן.
        </div>
      ) : (
        <>
          <DayBars summary={summary} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 14 }}>
            <BreakdownCard title="מכשיר" buckets={summary.byDevice} total={summary.total} />
            <BreakdownCard title="מקור התנועה" buckets={summary.byReferrer} total={summary.total} />
            <BreakdownCard title="מדינה" buckets={summary.byCountry.slice(0, 6)} total={summary.total} withFlag />
            <BreakdownCard title="עיר" buckets={summary.byCity.slice(0, 6)} total={summary.total} empty="אין נתוני עיר" />
            {summary.hasParams && (
              <>
                <BreakdownCard title="קמפיין" buckets={summary.byCampaign.slice(0, 6)} total={summary.total} />
                <BreakdownCard title="ממומן מול אורגני" buckets={summary.byTraffic} total={summary.total} />
              </>
            )}
          </div>
          {!summary.hasParams && (
            <div className="card" style={{ padding: "16px 20px", marginTop: 14, boxShadow: "none", borderColor: "var(--border-soft)", fontSize: 13.5, color: "var(--muted)" }}>
              רוצה לדעת איזה קמפיין הביא כל לחיצה? הוסף פרמטר לקישור בכל מקום שבו אתה מפרסם אותו,
              למשל <span className="mono" dir="ltr">{`${shortUrl}?utm_campaign=ep12&utm_medium=cpc`}</span>.
              יופיע כאן פילוח לפי קמפיין ולפי ממומן מול אורגני.
            </div>
          )}
        </>
      )}

      {/* Danger zone */}
      <div className="card" style={{ padding: 18, marginTop: 24, boxShadow: "none", borderColor: "var(--border-soft)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>ניהול הקישור</div>
            <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 3 }}>
              השבתה עוצרת את הקישור ושומרת נתונים. מחיקה מוחקת הכל לצמיתות.
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-quiet" onClick={archive} disabled={busy}>
              השבתה
            </button>
            <button className="btn btn-quiet" onClick={remove} disabled={busy} style={{ color: "var(--danger)" }}>
              מחיקה לצמיתות
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DayBars({ summary }: { summary: Summary }) {
  const max = Math.max(1, ...summary.last14.map((d) => d.count));
  return (
    <div className="card" style={{ padding: "20px 22px", boxShadow: "none" }}>
      <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 18 }}>לחיצות ב-14 הימים האחרונים</div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 120 }}>
        {summary.last14.map((d) => (
          <div key={d.day} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, height: "100%", justifyContent: "flex-end" }}>
            <span className="mono" style={{ fontSize: 11, color: d.count ? "var(--text)" : "transparent" }}>{d.count}</span>
            <div
              title={`${d.label}: ${d.count}`}
              style={{
                width: "100%",
                maxWidth: 26,
                height: `${(d.count / max) * 100}%`,
                minHeight: d.count ? 4 : 2,
                background: d.count ? "var(--accent)" : "var(--surface-3)",
                borderRadius: 5,
                transition: "height .3s",
              }}
            />
            <span style={{ fontSize: 10.5, color: "var(--faint)" }}>{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BreakdownCard({
  title,
  buckets,
  total,
  withFlag,
  empty,
}: {
  title: string;
  buckets: Bucket[];
  total: number;
  withFlag?: boolean;
  empty?: string;
}) {
  return (
    <div className="card" style={{ padding: "18px 20px", boxShadow: "none" }}>
      <div style={{ fontWeight: 600, fontSize: 14.5, marginBottom: 14 }}>{title}</div>
      {buckets.length === 0 ? (
        <div style={{ color: "var(--faint)", fontSize: 13 }}>{empty || "אין נתונים"}</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {buckets.map((b) => {
            const pct = Math.round((b.count / total) * 100);
            return (
              <div key={b.key}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, marginBottom: 5 }}>
                  <span>
                    {withFlag && <span style={{ marginInlineEnd: 6 }}>{flag(b.key)}</span>}
                    {b.label}
                  </span>
                  <span className="mono" style={{ color: "var(--muted)" }}>
                    {b.count} · {pct}%
                  </span>
                </div>
                <div style={{ height: 6, background: "var(--surface-2)", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: "var(--accent)", borderRadius: 4 }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
