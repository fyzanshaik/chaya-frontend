import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  console.log("Hitting middleware for path:", pathname);
  console.log("Middleware triggered for:", request.nextUrl.pathname);
  const token = request.cookies.get("token")?.value;
  console.log("Token from (token) cookie:", token ? "Present" : "Absent");

  const isProtectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/farmers") ||
    pathname.startsWith("/staff");

  const isAuthRoute = pathname === "/login";

  if (isProtectedRoute && !token) {
    console.log(
      "Middleware: No token, redirecting to /login from protected route"
    );
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAuthRoute && token) {
    console.log(
      "Middleware: token present, redirecting to /dashboard from auth route"
    );
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/farmers/:path*", "/staff/:path*", "/login"],
};
