/**
 * src/middleware.ts
 *
 * Route protection based on Supabase Auth session + DB role.
 *
 * Public routes  — no auth needed:  /login, /register, /api/auth/…
 * Admin routes   — require ADMIN role: /admin/…, /api/admin/…
 * Protected routes — require any authenticated user: everything else
 *
 * Flow:
 *  1. Refresh Supabase session cookie (must run on every request)
 *  2. If no user → redirect to /login (except public routes)
 *  3. If user exists → check DB role for admin routes
 */

import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { db } from "@/lib/db";

export const runtime = "nodejs";

// Routes accessible without any auth
const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/api/auth",
];

// Paths that require ADMIN role
const ADMIN_PATHS = [
  "/admin",
  "/api/admin",
];

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some((p) => pathname.startsWith(p));
}

function isAdmin(pathname: string) {
  return ADMIN_PATHS.some((p) => pathname.startsWith(p));
}

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  // Always allow public routes
  if (isPublic(pathname)) return supabaseResponse;

  // No session → redirect to login
  if (!user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // For admin routes, verify ADMIN role in DB
  if (isAdmin(pathname)) {
    try {
      const dbUser = await db.user.findUnique({
        where: { authId: user.id },
        select: { role: true },
      });

      if (!dbUser || dbUser.role !== "ADMIN") {
        // Authenticated but not admin → 403
        const homeUrl = request.nextUrl.clone();
        homeUrl.pathname = "/home";
        homeUrl.searchParams.set("error", "forbidden");
        return NextResponse.redirect(homeUrl);
      }
    } catch {
      // DB error — deny access
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      return NextResponse.redirect(loginUrl);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static, _next/image (Next.js internals)
     * - favicon.ico
     * - Files with extensions (e.g. .png .svg)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
