import Link from "next/link";
import { listProjectsForUser } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { createProjectAction } from "./actions";
import ThemeToggle from "../ThemeToggle";
import UserMenu from "../UserMenu";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const user = await requireUser();
  const projects = listProjectsForUser(user.id);

  return (
    <main className="mx-auto max-w-3xl px-6 pt-12 pb-24 sm:px-8 sm:pt-16">
      <header className="flex items-center justify-between">
        <Link
          href="/"
          className="font-[family-name:var(--font-mono)] text-[15px] tracking-[-0.02em] text-[color:var(--color-ink)]"
        >
          testify<span className="text-[color:var(--color-accent)]">/</span>
        </Link>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <UserMenu user={user} />
        </div>
      </header>

      <section className="mt-16">
        <p className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.22em] text-[color:var(--color-ink-faint)]">
          [ your workspaces ]
        </p>
        <h1 className="mt-3 text-[2.5rem] font-medium leading-[1.05] tracking-[-0.03em] sm:text-[2.75rem]">
          projects
          <span className="text-[color:var(--color-accent)]">.</span>
        </h1>
        <p className="mt-4 max-w-md text-[14px] leading-relaxed text-[color:var(--color-ink-muted)]">
          group related endpoints together. each project is a little
          collection of mocks you can come back to.
        </p>
      </section>

      <section className="mt-12">
        <form
          action={createProjectAction}
          className="flex items-center gap-2 rounded-[4px] border border-[color:var(--color-line)] bg-[color:var(--color-surface)] p-1.5"
        >
          <input
            name="name"
            required
            maxLength={80}
            placeholder="new project name…"
            className="flex-1 bg-transparent px-3 py-2 text-[14px] placeholder:text-[color:var(--color-ink-faint)] focus:outline-none"
          />
          <button
            type="submit"
            className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-[3px] bg-[color:var(--color-ink)] px-4 py-2 text-[13px] text-[color:var(--color-bg)] transition-transform hover:-translate-y-px"
          >
            create →
          </button>
        </form>
      </section>

      <section className="mt-12">
        {projects.length === 0 ? (
          <div className="rounded-[4px] border border-dashed border-[color:var(--color-line)] bg-transparent px-5 py-10 text-center">
            <p className="text-[16px] text-[color:var(--color-ink-muted)]">
              no projects yet
            </p>
            <p className="font-[family-name:var(--font-mono)] mt-2 text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-ink-faint)]">
              create one above to get started
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-[color:var(--color-line-soft)] overflow-hidden rounded-[4px] border border-[color:var(--color-line)] bg-[color:var(--color-surface)]">
            {projects.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/p/${p.id}`}
                  className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-[color:var(--color-surface-2)]"
                >
                  <div className="min-w-0">
                    <div className="truncate text-[15px] font-medium text-[color:var(--color-ink)]">
                      {p.name}
                    </div>
                    <div className="font-[family-name:var(--font-mono)] mt-0.5 text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-ink-faint)]">
                      {p.id}
                    </div>
                  </div>
                  <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-ink-faint)]">
                    open →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
