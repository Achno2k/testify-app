import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { adminAuth } from "./firebase-admin";
import { getUserByFirebaseUid, upsertUser, type User } from "./db";
import { newId } from "./id";

export const SESSION_COOKIE = "testify_session";
export const SESSION_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

export async function createSession(idToken: string): Promise<void> {
  const cookie = await adminAuth().createSessionCookie(idToken, {
    expiresIn: SESSION_MAX_AGE_MS,
  });
  // Ensure the user row exists locally.
  const decoded = await adminAuth().verifyIdToken(idToken);
  ensureLocalUser(decoded);

  const jar = await cookies();
  jar.set(SESSION_COOKIE, cookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_MS / 1000,
  });
}

export async function clearSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export const getCurrentUser = cache(async (): Promise<User | null> => {
  const jar = await cookies();
  const cookie = jar.get(SESSION_COOKIE)?.value;
  if (!cookie) return null;
  try {
    const decoded = await adminAuth().verifySessionCookie(cookie, true);
    const user = getUserByFirebaseUid(decoded.uid);
    if (user) return user;
    // First-time visit on this machine after sign-in elsewhere: backfill row.
    return ensureLocalUser(decoded);
  } catch {
    return null;
  }
});

type DecodedClaims = {
  uid: string;
  email?: string;
  name?: string;
  picture?: string;
};

function ensureLocalUser(decoded: DecodedClaims): User {
  return upsertUser({
    id: newId(),
    firebase_uid: decoded.uid,
    email: decoded.email ?? "",
    name: decoded.name ?? null,
    image: decoded.picture ?? null,
  });
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
