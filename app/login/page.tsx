"use client";

import { Suspense, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { getClientAuth } from "@/lib/firebase-client";
import ThemeToggle from "../ThemeToggle";

type Mode = "signin" | "signup";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/p";
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);

  async function exchangeForSession(idToken: string) {
    const res = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ idToken }),
    });
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(j.error || "could not start session");
    }
  }

  async function onGoogle() {
    setError(null);
    setBusy(true);
    try {
      const auth = getClientAuth();
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      const idToken = await cred.user.getIdToken();
      await exchangeForSession(idToken);
      startTransition(() => {
        router.push(next);
        router.refresh();
      });
    } catch (e) {
      setError(prettyError(e));
      setBusy(false);
    }
  }

  async function onEmail(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const auth = getClientAuth();
      const cred =
        mode === "signin"
          ? await signInWithEmailAndPassword(auth, email, password)
          : await createUserWithEmailAndPassword(auth, email, password);
      const idToken = await cred.user.getIdToken();
      await exchangeForSession(idToken);
      startTransition(() => {
        router.push(next);
        router.refresh();
      });
    } catch (e) {
      setError(prettyError(e));
      setBusy(false);
    }
  }

  const submitting = busy || pending;

  return (
    <main className="mx-auto max-w-md px-6 pt-12 pb-24 sm:px-8 sm:pt-16">
      <header className="flex items-center justify-between">
        <Link
          href="/"
          className="font-[family-name:var(--font-mono)] text-[15px] tracking-[-0.02em] text-[color:var(--color-ink)]"
        >
          testify<span className="text-[color:var(--color-accent)]">/</span>
        </Link>
        <ThemeToggle />
      </header>

      <section className="mt-20">
        <p className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.22em] text-[color:var(--color-ink-faint)]">
          [ {mode === "signin" ? "sign in" : "create account"} ]
        </p>
        <h1 className="mt-3 text-[2.5rem] font-medium leading-[1.05] tracking-[-0.03em]">
          {mode === "signin" ? "welcome back" : "start a project"}
          <span className="text-[color:var(--color-accent)]">.</span>
        </h1>
        <p className="mt-4 text-[14px] leading-relaxed text-[color:var(--color-ink-muted)]">
          {mode === "signin"
            ? "sign in to organize endpoints into projects."
            : "create an account to group endpoints into projects."}
        </p>
      </section>

      <button
        type="button"
        onClick={onGoogle}
        disabled={submitting}
        className="mt-12 flex w-full items-center justify-center gap-3 rounded-[3px] border border-[color:var(--color-line)] bg-[color:var(--color-surface)] px-4 py-3 text-[14px] transition-colors hover:border-[color:var(--color-ink)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <GoogleMark />
        <span>continue with google</span>
      </button>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-[color:var(--color-line-soft)]" />
        <span className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-ink-faint)]">
          or
        </span>
        <div className="h-px flex-1 bg-[color:var(--color-line-soft)]" />
      </div>

      <form onSubmit={onEmail} className="space-y-4">
        <label className="block">
          <span className="font-[family-name:var(--font-mono)] mb-1.5 block text-[10px] uppercase tracking-[0.2em] text-[color:var(--color-ink-faint)]">
            email
          </span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className="w-full rounded-[3px] border border-[color:var(--color-line)] bg-[color:var(--color-surface-2)] px-3.5 py-2.5 text-[14px] placeholder:text-[color:var(--color-ink-faint)] transition-colors focus:border-[color:var(--color-ink)] focus:bg-[color:var(--color-surface)]"
          />
        </label>
        <label className="block">
          <span className="font-[family-name:var(--font-mono)] mb-1.5 block text-[10px] uppercase tracking-[0.2em] text-[color:var(--color-ink-faint)]">
            password
          </span>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            className="w-full rounded-[3px] border border-[color:var(--color-line)] bg-[color:var(--color-surface-2)] px-3.5 py-2.5 text-[14px] placeholder:text-[color:var(--color-ink-faint)] transition-colors focus:border-[color:var(--color-ink)] focus:bg-[color:var(--color-surface)]"
          />
        </label>

        {error && (
          <p className="font-[family-name:var(--font-mono)] text-[12px] text-[color:var(--color-accent)]">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-[3px] bg-[color:var(--color-ink)] px-5 py-3 text-[14px] text-[color:var(--color-bg)] transition-transform hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting
            ? "…"
            : mode === "signin"
              ? "sign in"
              : "create account"}
        </button>
      </form>

      <p className="font-[family-name:var(--font-mono)] mt-8 text-center text-[12px] text-[color:var(--color-ink-muted)]">
        {mode === "signin" ? "new here? " : "have an account? "}
        <button
          type="button"
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setError(null);
          }}
          className="text-[color:var(--color-ink)] underline decoration-dotted underline-offset-4"
        >
          {mode === "signin" ? "create an account" : "sign in"}
        </button>
      </p>

      <p className="font-[family-name:var(--font-mono)] mt-12 text-center text-[10px] uppercase tracking-[0.2em] text-[color:var(--color-ink-faint)]">
        no account needed for quick endpoints —{" "}
        <Link href="/" className="underline decoration-dotted underline-offset-4">
          back home
        </Link>
      </p>
    </main>
  );
}

function GoogleMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

function prettyError(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  const code = /\(auth\/([^)]+)\)/.exec(msg)?.[1];
  switch (code) {
    case "invalid-credential":
    case "wrong-password":
      return "wrong email or password.";
    case "user-not-found":
      return "no account with that email.";
    case "email-already-in-use":
      return "that email is already registered. try signing in.";
    case "weak-password":
      return "password must be at least 6 characters.";
    case "invalid-email":
      return "that doesn't look like a valid email.";
    case "popup-closed-by-user":
      return "sign-in cancelled.";
    default:
      return msg.toLowerCase().replace(/^firebase: /, "");
  }
}
