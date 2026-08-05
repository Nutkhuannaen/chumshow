import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

// Edge-safe: uses the provider-less authConfig so this file never pulls in
// Prisma/pg (see auth.config.ts for why).
const { auth } = NextAuth(authConfig);

const OWNER_ONLY_PREFIXES = ["/dashboard", "/finance", "/settings"];

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;

  if (nextUrl.pathname === "/login") {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/pos", nextUrl));
    }
    return NextResponse.next();
  }

  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  if (OWNER_ONLY_PREFIXES.some((prefix) => nextUrl.pathname.startsWith(prefix)) && role !== "OWNER") {
    return NextResponse.redirect(new URL("/pos", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
