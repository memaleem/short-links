"use client";

import { platformMeta } from "@/lib/platform";

export function PlatformChip({ platform }: { platform: string | null }) {
  const m = platformMeta(platform);
  return (
    <span
      className="chip"
      style={{
        borderColor: "transparent",
        background: `color-mix(in srgb, ${m.color} 16%, var(--surface-2))`,
        color: m.color,
      }}
    >
      <span aria-hidden>{m.emoji}</span>
      {m.label}
    </span>
  );
}

export function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("he-IL", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}

export function StatTile({
  value,
  label,
  accent,
}: {
  value: React.ReactNode;
  label: string;
  accent?: boolean;
}) {
  return (
    <div
      className="card"
      style={{ padding: "18px 20px", boxShadow: "none", background: "var(--surface)" }}
    >
      <div
        className="mono"
        style={{
          fontSize: 30,
          fontWeight: 700,
          lineHeight: 1,
          color: accent ? "var(--accent)" : "var(--text)",
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 13.5, color: "var(--muted)", marginTop: 8 }}>{label}</div>
    </div>
  );
}
