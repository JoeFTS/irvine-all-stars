import { NextRequest, NextResponse } from "next/server";

// Protected route prefixes
const protectedPrefixes = ["/admin", "/portal", "/evaluate"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if this is a protected route
  const isProtected = protectedPrefixes.some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  // Look for any Supabase auth cookie
  // Supabase stores auth tokens in cookies prefixed with "sb-"
  const cookies = request.cookies.getAll();
  const hasAuthCookie = cookies.some(
    (cookie) =>
      cookie.name.includes("sb-") && cookie.name.includes("auth-token")
  );

  if (!hasAuthCookie) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/portal/:path*", "/evaluate/:path*"],
};
