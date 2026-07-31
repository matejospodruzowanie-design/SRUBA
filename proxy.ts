import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

const protectedRoutes = ["/dashboard", "/workout", "/plans", "/history", "/progress", "/recovery", "/challenges", "/coach", "/profile", "/measurements", "/exercises", "/app"];
const publicRoutes = ["/login", "/register"];

export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.some((r) => path.startsWith(r));
  const isPublicRoute = publicRoutes.some((r) => path.startsWith(r));
  const isRoot = path === "/";

  const session = await auth();

  if (isProtectedRoute && !session?.user) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  if ((isPublicRoute || isRoot) && session?.user) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  if (isRoot && !session?.user) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg$).*)"],
};
