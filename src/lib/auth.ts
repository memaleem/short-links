/**
 * שער סיסמה פשוט ומשותף. אין חשבונות פר-משתמש.
 * הכניסה מפיקה עוגייה חתומה (HMAC) שהמידלוור מאמת. חסר-מצב, עובד גם ב-edge.
 */

export const AUTH_COOKIE = "il_auth";
const MAGIC = "short-links-auth-v1";

function secret(): string {
  return (
    process.env.AUTH_SECRET ||
    process.env.PANEL_PASSWORD ||
    "short-links-dev-secret"
  );
}

/** הסיסמה להתחברות (ברירת מחדל 1234). */
export function panelPassword(): string {
  return process.env.PANEL_PASSWORD || "1234";
}

/** הטוקן החתום שמצופה בעוגייה. מחושב זהה בשרת וב-edge. */
export async function expectedToken(): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(MAGIC));
  return [...new Uint8Array(sig)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
