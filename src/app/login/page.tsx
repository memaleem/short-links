"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      // חזרה לעמוד שממנו הגיעו (למשל דף המפה), רק לנתיבים פנימיים.
      const next = new URLSearchParams(window.location.search).get("next");
      const safe = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
      router.replace(safe);
      router.refresh();
    } else {
      setError("סיסמה שגויה. נסו שוב.");
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <form onSubmit={submit} className="card rise" style={{ width: 380, maxWidth: "100%", padding: 34 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <span className="live-dot" />
          <span style={{ fontSize: 13, color: "var(--muted)", letterSpacing: 0.3 }}>
            קיצור קישורים
          </span>
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: "10px 0 6px" }}>שלום, טוב לראות אותך</h1>
        <p style={{ color: "var(--muted)", fontSize: 15, margin: "0 0 26px", lineHeight: 1.6 }}>
          הכניסו את הסיסמה כדי לנהל את הקישורים.
        </p>

        <label className="label" htmlFor="pw">
          סיסמה
        </label>
        <input
          id="pw"
          type="password"
          className="input mono"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••"
          autoFocus
          autoComplete="current-password"
          style={{ textAlign: "center", letterSpacing: 4, fontSize: 18 }}
        />

        {error && (
          <p style={{ color: "var(--danger)", fontSize: 14, margin: "12px 0 0" }}>{error}</p>
        )}

        <button className="btn btn-primary" type="submit" disabled={loading || !password} style={{ width: "100%", marginTop: 22 }}>
          {loading ? "רגע…" : "כניסה"}
        </button>
      </form>
    </main>
  );
}
