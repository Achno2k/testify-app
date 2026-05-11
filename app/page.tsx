import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import ThemeToggle from "./ThemeToggle";
import UserMenu from "./UserMenu";
import QuickEndpointForm from "./QuickEndpointForm";

export const dynamic = "force-dynamic";

export default async function Page() {
  const user = await getCurrentUser();

  return (
    <main className="mx-auto max-w-2xl px-6 pt-12 pb-24 sm:px-8 sm:pt-16">
      <header className="flex items-center justify-between">
        <span className="font-[family-name:var(--font-mono)] text-[15px] tracking-[-0.02em] text-[color:var(--color-ink)]">
          testify<span className="text-[color:var(--color-accent)]">/</span>
        </span>
        <div className="flex items-center gap-3">
          {user ? (
            <Link
              href="/p"
              className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.2em] text-[color:var(--color-ink-faint)] hover:text-[color:var(--color-ink)]"
            >
              projects →
            </Link>
          ) : (
            <Link
              href="/login"
              className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.2em] text-[color:var(--color-ink-faint)] hover:text-[color:var(--color-ink)]"
            >
              sign in
            </Link>
          )}
          <ThemeToggle />
          {user && <UserMenu user={user} />}
        </div>
      </header>

      <section className="mt-20 sm:mt-28">
        <p className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.24em] text-[color:var(--color-ink-faint)]">
          [ instant mock endpoints ]
        </p>
        <h1 className="mt-5 text-[3.25rem] font-medium leading-[0.95] tracking-[-0.035em] sm:text-[4.5rem]">
          endpoints,
          <br />
          on tap
          <span className="text-[color:var(--color-accent)]">.</span>
        </h1>
        <p className="mt-7 max-w-md text-[15px] leading-relaxed text-[color:var(--color-ink-muted)]">
          Describe a response. Get a public URL. Sketch API contracts before the
          backend exists — and watch every incoming request as it lands.
        </p>
      </section>

      <QuickEndpointForm />

      <footer className="font-[family-name:var(--font-mono)] mt-28 text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-ink-faint)]">
        made for the moments before the backend exists.
      </footer>
    </main>
  );
}
