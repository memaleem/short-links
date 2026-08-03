"use client";

import { useEffect } from "react";

export default function Modal({
  title,
  onClose,
  children,
  width = 560,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  width?: number;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(6,7,10,0.72)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "6vh 20px 40px",
        zIndex: 50,
        overflowY: "auto",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="card rise"
        style={{ width, maxWidth: "100%", padding: 26 }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{title}</h2>
          <button
            onClick={onClose}
            className="btn-quiet"
            style={{ border: 0, background: "transparent", color: "var(--muted)", fontSize: 22, cursor: "pointer", lineHeight: 1, padding: 4 }}
            aria-label="סגירה"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
