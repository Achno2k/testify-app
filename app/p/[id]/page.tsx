import Link from "next/link";
import { notFound } from "next/navigation";
import { getProject, listEndpointsInProject } from "@/lib/db";
import { requireUser } from "@/lib/session";
import ThemeToggle from "../../ThemeToggle";
import UserMenu from "../../UserMenu";
import NewEndpointForm from "./NewEndpointForm";

export const dynamic = "force-dynamic";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const project = getProject(id);
  if (!project || project.owner_id !== user.id) notFound();
  const endpoints = listEndpointsInProject(project.id);

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
          <Link
            href="/p"
            className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.2em] text-[color:var(--color-ink-faint)] hover:text-[color:var(--color-ink)]"
          >
            ← all projects
          </Link>
          <ThemeToggle />
          <UserMenu user={user} />
        </div>
      </header>

      <section className="mt-16">
        <p className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.22em] text-[color:var(--color-ink-faint)]">
          [ project ]
        </p>
        <h1 className="mt-3 text-[2.5rem] font-medium leading-[1.05] tracking-[-0.03em] sm:text-[2.75rem]">
          {project.name}
        </h1>
      </section>

      <section className="mt-16">
        <div className="flex items-baseline gap-3">
          <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.22em] text-[color:var(--color-ink-faint)]">
            01
          </span>
          <span className="text-[16px] font-medium tracking-[-0.005em] text-[color:var(--color-ink)]">
            endpoints
          </span>
        </div>
        <div className="mt-4">
          {endpoints.length === 0 ? (
            <div className="rounded-[4px] border border-dashed border-[color:var(--color-line)] bg-transparent px-5 py-10 text-center">
              <p className="text-[16px] text-[color:var(--color-ink-muted)]">
                no endpoints yet
              </p>
              <p className="font-[family-name:var(--font-mono)] mt-2 text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-ink-faint)]">
                spin one up below
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-[color:var(--color-line-soft)] overflow-hidden rounded-[4px] border border-[color:var(--color-line)] bg-[color:var(--color-surface)]">
              {endpoints.map((e) => (
                <li key={e.id}>
                  <Link
                    href={`/e/${e.id}`}
                    className="flex items-center gap-4 px-5 py-3 transition-colors hover:bg-[color:var(--color-surface-2)]"
                  >
                    <span className="font-[family-name:var(--font-mono)] w-12 shrink-0 text-[11px] uppercase tracking-[0.12em] text-[color:var(--color-ink)]">
                      {e.method.toLowerCase()}
                    </span>
                    <span className="flex-1 truncate text-[14px] text-[color:var(--color-ink)]">
                      {e.name ?? (
                        <span className="text-[color:var(--color-ink-muted)]">
                          untitled
                        </span>
                      )}
                    </span>
                    <span className="font-[family-name:var(--font-mono)] shrink-0 text-[11px] tabular-nums text-[color:var(--color-ink-faint)]">
                      {e.hit_count} hits
                    </span>
                    <span className="font-[family-name:var(--font-mono)] shrink-0 text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-ink-faint)]">
                      open →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="mt-16">
        <div className="flex items-baseline gap-3">
          <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.22em] text-[color:var(--color-ink-faint)]">
            02
          </span>
          <span className="text-[16px] font-medium tracking-[-0.005em] text-[color:var(--color-ink)]">
            new endpoint
          </span>
        </div>
        <div className="mt-4">
          <NewEndpointForm projectId={project.id} />
        </div>
      </section>
    </main>
  );
}
