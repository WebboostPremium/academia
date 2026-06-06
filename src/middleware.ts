import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, getSessionCookieName } from "@/lib/auth/session";
import { canAccessRoute } from "@/lib/auth/permissions";
import { AUTH_ROUTES, getRoleHomePath, PUBLIC_ROUTES } from "@/lib/constants/routes";

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some((route) => pathname === route);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(getSessionCookieName())?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (isAuthRoute(pathname) && session) {
    return NextResponse.redirect(new URL(getRoleHomePath(session.role), request.url));
  }

  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (session.status === "blocked") {
    return NextResponse.redirect(new URL("/login?error=blocked", request.url));
  }

  if (!canAccessRoute(session.role, pathname)) {
    return NextResponse.redirect(new URL(getRoleHomePath(session.role), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
