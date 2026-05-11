"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signOut } from "firebase/auth";
import { getClientAuth } from "@/lib/firebase-client";
import type { User } from "@/lib/db";

export default function UserMenu({ user }: { user: User }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function onSignOut() {
    setSigningOut(true);
    try {
      await signOut(getClientAuth());
      await fetch("/api/auth/session", { method: "DELETE" });
      router.push("/");
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  }

  const initials =
    (user.name?.trim()?.[0] ?? user.email?.[0] ?? "?").toUpperCase();

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border border-[color:var(--color-line)] bg-[color:var(--color-surface)] text-[11px] text-[color:var(--color-ink)] transition-colors hover:border-[color:var(--color-ink)]"
      >
        {user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.image} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="font-[family-name:var(--font-mono)]">{initials}</span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-20 mt-2 w-56 overflow-hidden rounded-[4px] border border-[color:var(--color-line)] bg-[color:var(--color-surface)] shadow-lg"
        >
          <div className="border-b border-[color:var(--color-line-soft)] px-3.5 py-3">
            {user.name && (
              <div className="truncate text-[13px] text-[color:var(--color-ink)]">
                {user.name}
              </div>
            )}
            <div className="font-[family-name:var(--font-mono)] truncate text-[11px] text-[color:var(--color-ink-muted)]">
              {user.email}
            </div>
          </div>
          <Link
            href="/p"
            onClick={() => setOpen(false)}
            className="font-[family-name:var(--font-mono)] block px-3.5 py-2.5 text-[12px] uppercase tracking-[0.16em] text-[color:var(--color-ink)] transition-colors hover:bg-[color:var(--color-surface-2)]"
          >
            projects
          </Link>
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="font-[family-name:var(--font-mono)] block px-3.5 py-2.5 text-[12px] uppercase tracking-[0.16em] text-[color:var(--color-ink)] transition-colors hover:bg-[color:var(--color-surface-2)]"
          >
            quick endpoint
          </Link>
          <button
            type="button"
            onClick={onSignOut}
            disabled={signingOut}
            className="font-[family-name:var(--font-mono)] block w-full border-t border-[color:var(--color-line-soft)] px-3.5 py-2.5 text-left text-[12px] uppercase tracking-[0.16em] text-[color:var(--color-ink-muted)] transition-colors hover:bg-[color:var(--color-surface-2)] hover:text-[color:var(--color-ink)] disabled:opacity-60"
          >
            {signingOut ? "signing out…" : "sign out"}
          </button>
        </div>
      )}
    </div>
  );
}
