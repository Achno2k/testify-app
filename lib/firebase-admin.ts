import "server-only";
import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";

declare global {
  // eslint-disable-next-line no-var
  var __testify_fb_admin: App | undefined;
}

function decodeServiceAccount(): object {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY env var is not set");
  }
  // Accept either raw JSON or base64-encoded JSON.
  const text = raw.trim().startsWith("{")
    ? raw
    : Buffer.from(raw, "base64").toString("utf8");
  return JSON.parse(text);
}

function admin(): App {
  if (!globalThis.__testify_fb_admin) {
    const existing = getApps()[0];
    globalThis.__testify_fb_admin =
      existing ??
      initializeApp({
        credential: cert(
          decodeServiceAccount() as Parameters<typeof cert>[0],
        ),
      });
  }
  return globalThis.__testify_fb_admin;
}

export function adminAuth(): Auth {
  return getAuth(admin());
}
