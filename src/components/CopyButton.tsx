"use client";

import { useState } from "react";

export default function CopyButton({
  text,
  label = "העתקה",
  className = "btn btn-ghost",
  compact = false,
}: {
  text: string;
  label?: string;
  className?: string;
  compact?: boolean;
}) {
  const [done, setDone] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      el.remove();
    }
    setDone(true);
    setTimeout(() => setDone(false), 1400);
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={`${className} ${done ? "flash" : ""}`}
      style={compact ? { padding: "8px 12px", fontSize: 14 } : undefined}
      aria-label={label}
    >
      {done ? "✓ הועתק" : label}
    </button>
  );
}
