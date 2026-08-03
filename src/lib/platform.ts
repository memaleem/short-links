/** תיוג פלטפורמה: לאן הקישור מפנה. זיהוי אוטומטי מכתובת היעד, ניתן לעריכה. */

export type PlatformMeta = { label: string; color: string; emoji: string };

export const PLATFORMS: Record<string, PlatformMeta> = {
  whatsapp: { label: "וואטסאפ", color: "#25D366", emoji: "🟢" },
  instagram: { label: "אינסטגרם", color: "#E1306C", emoji: "📸" },
  facebook: { label: "פייסבוק", color: "#1877F2", emoji: "👍" },
  youtube: { label: "יוטיוב", color: "#FF3B30", emoji: "▶️" },
  telegram: { label: "טלגרם", color: "#29A9EB", emoji: "✈️" },
  tiktok: { label: "טיקטוק", color: "#69C9D0", emoji: "🎵" },
  email: { label: "מייל", color: "#EAB308", emoji: "✉️" },
  sms: { label: "מסרון", color: "#7CC7FF", emoji: "💬" },
  landing: { label: "דף נחיתה", color: "#C7F24E", emoji: "🎯" },
  store: { label: "חנות / תשלום", color: "#F59E0B", emoji: "🛒" },
  other: { label: "אחר", color: "#9AA0AC", emoji: "🔗" },
};

export const PLATFORM_KEYS = Object.keys(PLATFORMS);

export function platformMeta(key: string | null | undefined): PlatformMeta {
  return (key && PLATFORMS[key]) || PLATFORMS.other;
}

export function detectPlatform(rawUrl: string): string {
  const url = (rawUrl || "").trim();
  if (/^mailto:/i.test(url)) return "email";
  if (/^sms:/i.test(url)) return "sms";
  let host = "";
  try {
    host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "other";
  }
  if (/wa\.me|whatsapp\.com|api\.whatsapp/.test(url)) return "whatsapp";
  if (/instagram\.com|instagr\.am/.test(host)) return "instagram";
  if (/facebook\.com|fb\.com|fb\.me|fb\.watch/.test(host)) return "facebook";
  if (/youtube\.com|youtu\.be/.test(host)) return "youtube";
  if (/t\.me|telegram\.(me|org)/.test(host)) return "telegram";
  if (/tiktok\.com/.test(host)) return "tiktok";
  if (/cardcom|payme|meshulam|tranzila|grow|paypal|stripe|checkout/.test(host))
    return "store";
  return "landing";
}
