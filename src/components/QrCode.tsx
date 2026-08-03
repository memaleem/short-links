"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

export default function QrCode({
  value,
  filename = "qr",
  size = 190,
}: {
  value: string;
  filename?: string;
  size?: number;
}) {
  const [dataUrl, setDataUrl] = useState("");

  useEffect(() => {
    let alive = true;
    QRCode.toDataURL(value, {
      width: size * 2,
      margin: 1,
      color: { dark: "#0e0f13", light: "#ffffff" },
      errorCorrectionLevel: "M",
    })
      .then((url) => {
        if (alive) setDataUrl(url);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [value, size]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      <div
        style={{
          background: "#fff",
          padding: 12,
          borderRadius: 14,
          width: size,
          height: size,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {dataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={dataUrl} alt="קוד QR" width={size - 24} height={size - 24} />
        ) : (
          <span style={{ color: "#9aa0ac", fontSize: 13 }}>מכין…</span>
        )}
      </div>
      {dataUrl && (
        <a className="btn btn-ghost" href={dataUrl} download={`${filename}.png`} style={{ fontSize: 14 }}>
          הורדת קוד QR
        </a>
      )}
    </div>
  );
}
