import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

const protectedRoutes = ["/dashboard", "/workout", "/plans", "/history", "/progress", "/challenges", "/coach", "/profile", "/exercises", "/app"];
const publicRoutes = ["/login", "/register"];

export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.some((r) => path.startsWith(r));
  const isPublicRoute = publicRoutes.some((r) => path.startsWith(r));
  const isRoot = path === "/";

  // Read session cookie
  const token = req.cookies.get("sruba-token")?.value;
  const session = token ? await verifyToken(token) : null;

  if (isProtectedRoute && !session) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  if ((isPublicRoute || isRoot) && session) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  if (isRoot && !session) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg$).*)"],
};
