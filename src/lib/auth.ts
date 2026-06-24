import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import type { Role } from "@prisma/client";

const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET ?? "dev-only-change-me-in-production-please-32chars"
);
const COOKIE = "uon_hub_session";
const ALG = "HS256";
const MAX_AGE = 60 * 60 * 24 * 7;

export type SessionPayload = {
  userId: string;
  email: string;
  role: Role;
  name: string;
};

export async function hashPassword(plain: string) {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}

export async function createSessionToken(payload: SessionPayload) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(SECRET);
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string) {
  cookies().set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearSessionCookie() {
  cookies().delete(COOKIE);
}

export async function getSession(): Promise<SessionPayload | null> {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;
  return prisma.user.findUnique({ where: { id: session.userId } });
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}

export const SESSION_COOKIE_NAME = COOKIE;

/* ── TOTP challenge cookie ──────────────────────────────────────────────── */
const TOTP_COOKIE = "uon_hub_totp_pending";
const TOTP_TTL_SECONDS = 5 * 60;

type TotpChallenge = { userId: string; email: string };

export async function createTotpChallengeCookie(payload: TotpChallenge) {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime(`${TOTP_TTL_SECONDS}s`)
    .sign(SECRET);
  cookies().set(TOTP_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TOTP_TTL_SECONDS,
  });
}

export async function readTotpChallengeCookie(): Promise<TotpChallenge | null> {
  const token = cookies().get(TOTP_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as TotpChallenge;
  } catch {
    return null;
  }
}

export async function clearTotpChallengeCookie() {
  cookies().delete(TOTP_COOKIE);
}
