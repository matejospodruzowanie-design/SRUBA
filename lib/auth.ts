import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "sruba-token";
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// Lazy on first use — the module must not throw during `next build` page-data
// collection on hosts that don't inject service env vars into the build
// (e.g. `railway up`). At runtime the variable IS present, so the guard still
// protects production.
let cachedSecret: Uint8Array | null = null;

function getAuthSecret(): Uint8Array {
  if (cachedSecret) return cachedSecret;
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("AUTH_SECRET environment variable is required in production");
    }
    console.warn("⚠ AUTH_SECRET not set — using default for development only. Set it in .env for production.");
    cachedSecret = new TextEncoder().encode("dev-secret-change-in-production");
  } else {
    cachedSecret = new TextEncoder().encode(secret);
  }
  return cachedSecret;
}

export interface SessionUser {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
}

export async function createToken(user: SessionUser): Promise<string> {
  return new SignJWT({ id: user.id, email: user.email, name: user.name, image: user.image })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getAuthSecret());
}

export async function verifyToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getAuthSecret());
    if (!payload.id || !payload.email) return null;
    return {
      id: payload.id as string,
      email: payload.email as string,
      name: (payload.name as string) ?? null,
      image: (payload.image as string) ?? null,
    };
  } catch {
    return null;
  }
}

export async function setSessionCookie(user: SessionUser) {
  const token = await createToken(user);
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE_MS / 1000,
    path: "/",
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}
