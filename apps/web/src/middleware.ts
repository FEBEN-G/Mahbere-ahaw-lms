import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { PORTAL_ROLE_COOKIE } from "@/lib/auth/portal-role";

function homeForRole(role: string) {
  if (role === "STUDENT") return "/student";
  if (role === "INSTRUCTOR") return "/instructor";
  if (role === "SUPER_ADMIN") return "/admin";
  return "/login";
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const role = request.cookies.get(PORTAL_ROLE_COOKIE)?.value;

  // Existing localStorage-only sessions keep working until they re-authenticate.
  if (!role) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin") && role !== "SUPER_ADMIN") {
    return NextResponse.redirect(new URL(homeForRole(role), request.url));
  }

  if (pathname.startsWith("/instructor") && role !== "INSTRUCTOR") {
    return NextResponse.redirect(new URL(homeForRole(role), request.url));
  }

  if (pathname.startsWith("/student") && role !== "STUDENT") {
    return NextResponse.redirect(new URL(homeForRole(role), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/instructor/:path*", "/student/:path*"],
};
