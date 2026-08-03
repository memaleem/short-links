import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE, expectedToken } from "@/lib/auth";

/**
 * מגן רק על לוח הבקרה וה-API שלו. הקישורים הקצרים (/[slug]) ציבוריים לגמרי
 * ולא עוברים כאן בכלל (ה-matcher לא תופס אותם) — כדי שההפניה תישאר מהירה.
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const token = req.cookies.get(AUTH_COOKIE)?.value;
  const expected = await expectedToken();
  if (token && token === expected) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "לא מחובר" }, { status: 401 });
  }
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/", "/link/:path*", "/api/links/:path*", "/api/analytics/:path*", "/api/hub/:path*", "/api/hub"],
};
