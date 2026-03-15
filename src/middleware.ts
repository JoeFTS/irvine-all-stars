import { NextResponse } from "next/server";

// Auth protection handled client-side via useAuth() context.
// Supabase JS client stores tokens in localStorage, not cookies,
// so server-side cookie checks don't work.
export function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
