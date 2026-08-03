import type { PixelConfig } from "./types";

export function hasPixel(p: PixelConfig | null | undefined): boolean {
  return !!(p && (p.fb || p.gtag));
}

function esc(s: string): string {
  return String(s).replace(/[<>"'`]/g, "");
}

/**
 * דף ביניים זעיר לקישורים עם פיקסל. טוען את הפיקסל (מטא/גוגל), נותן לו שבריר
 * שנייה לירות, ואז מפנה ליעד. קישור בלי פיקסל לא עובר דרך כאן — הוא 302 מיידי.
 */
export function interstitialHtml(target: string, pixel: PixelConfig): string {
  const fb = pixel.fb ? esc(pixel.fb) : "";
  const gtag = pixel.gtag ? esc(pixel.gtag) : "";
  const targetJson = JSON.stringify(target);
  const targetAttr = target.replace(/"/g, "&quot;");

  const fbScript = fb
    ? `<script>!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${fb}');fbq('track','PageView');</script>`
    : "";

  const gScript = gtag
    ? `<script async src="https://www.googletagmanager.com/gtag/js?id=${gtag}"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${gtag}');</script>`
    : "";

  return `<!doctype html>
<html lang="he" dir="rtl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<meta http-equiv="refresh" content="1;url=${targetAttr}">
<title>מעביר אותך…</title>
<style>html,body{height:100%;margin:0}body{background:#0e0f13;color:#9aa0ac;font-family:system-ui,-apple-system,'Rubik',sans-serif;display:flex;align-items:center;justify-content:center}.d{width:34px;height:34px;border-radius:50%;border:3px solid #21252f;border-top-color:#c7f24e;animation:s .7s linear infinite}@keyframes s{to{transform:rotate(360deg)}}</style>
${fbScript}${gScript}
</head><body><div class="d"></div>
<script>setTimeout(function(){location.replace(${targetJson})},350)</script>
</body></html>`;
}
