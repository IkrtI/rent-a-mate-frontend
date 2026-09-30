import { NextResponse, type NextRequest } from "next/server";

import { sessionCookieNames } from "./src/modules/session/cookie-names";

/**
 * This is only an optimistic routing guard. Every private API route still
 * resolves and authorizes the session with the backend before returning data.
 */
export function proxy(request: NextRequest) {
  const hasAccess = request.cookies.has(sessionCookieNames.access);
  const hasRefresh = request.cookies.has(sessionCookieNames.refresh);
  if (hasAccess || hasRefresh) return NextResponse.next();

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("returnTo", `${request.nextUrl.pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/dashboard/:path*", "/bookings/:path*", "/messages/:path*"],
};
