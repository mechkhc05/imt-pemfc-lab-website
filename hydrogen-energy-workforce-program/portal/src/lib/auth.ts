import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export type Role = "ADMIN" | "REVIEWER";

export type SessionPayload = {
  sub: string;
  username: string;
  name: string;
  role: Role;
};

export const COOKIE_NAME = "session";
const SESSION_DURATION = "7d";

function getSecretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set. Copy .env.example to .env and fill it in.");
  return new TextEncoder().encode(secret);
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(SESSION_DURATION)
    .sign(getSecretKey());
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

/** Server Components / Route Handlers only (reads the incoming request's cookies). */
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}
