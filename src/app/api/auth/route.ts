import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE, expectedToken, panelPassword } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({ password: "" }));
  const password = String(body?.password ?? "");

  if (password !== panelPassword()) {
    return NextResponse.json({ error: "סיסמה שגויה" }, { status: 401 });
  }

  const token = await expectedToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365 * 10, // 10 שנים — כניסה פעם אחת לכל מכשיר, ואז לתמיד
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
