import { UAParser } from "ua-parser-js";

/** פענוח User-Agent לסוג מכשיר, דפדפן ומערכת הפעלה. */
export function parseUA(ua: string): {
  device: string;
  browser: string | null;
  os: string | null;
} {
  const r = new UAParser(ua || "").getResult();
  const type = r.device.type; // "mobile" | "tablet" | undefined(=desktop)
  const device =
    type === "mobile" ? "mobile" : type === "tablet" ? "tablet" : "desktop";
  return {
    device,
    browser: r.browser.name || null,
    os: r.os.name || null,
  };
}

export const DEVICE_LABEL: Record<string, string> = {
  mobile: "נייד",
  tablet: "טאבלט",
  desktop: "מחשב",
};
