import { NextRequest, NextResponse } from "next/server";
import { verifySession, COOKIE_NAME } from "@/lib/auth";

const PROTECTED_PATHS = ["/dashboard", "/matches", "/reports"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  const isProtectedApi =
    pathname.startsWith("/api/") && !pathname.startsWith("/api/login") && !pathname.startsWith("/api/public");

  if (!isProtected && !isProtectedApi) {
    return NextResponse.next();
  }

  const token = req.cookies.get(COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;

  if (!session) {
    if (isProtectedApi) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/matches/:path*", "/reports/:path*", "/api/:path*"],
};
