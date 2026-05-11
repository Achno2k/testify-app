import { headers } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getEndpoint } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import RequestLog from "./RequestLog";
import CopyButton from "./CopyButton";
import DeleteButton from "./DeleteButton";
import ThemeToggle from "../../ThemeToggle";
import UserMenu from "../../UserMenu";

export const dynamic = "force-dynamic";

export default async function EndpointPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const endpoint = getEndpoint(id);
  if (!endpoint) notFound();
  const user = await getCurrentUser();

  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto =
    h.get("x-forwarded-proto") ??
    (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
  const url = `${proto}://${host}/api/m/${endpoint.id}`;

  const exampleMethod = endpoint.method === "ANY" ? "GET" : endpoint.method;
  const curl = buildCurl(url, exampleMethod, endpoint.response_body);

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
            href={endpoint.project_id ? `/p/${endpoint.project_id}` : "/"}
            className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.2em] text-[color:var(--color-ink-faint)] hover:text-[color:var(--color-ink)]"
          >
            {endpoint.project_id ? "← back to project" : "← new endpoint"}
          </Link>
          <ThemeToggle />
          {user && <UserMenu user={user} />}
        </div>
      </header>

      <section className="mt-16">
        <p className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.22em] text-[color:var(--color-accent)]">
          ● live · accepting requests
        </p>
        <h1 className="mt-3 text-[2.5rem] font-medium leading-[1.05] tracking-[-0.03em] sm:text-[2.75rem]">
          {endpoint.name ?? (
            <span className="text-[color:var(--color-ink-muted)]">
              untitled endpoint
            </span>
          )}
        </h1>

        <div className="mt-8 rounded-[4px] border border-[color:var(--color-line)] bg-[color:var(--color-surface)] p-1.5">
          <div className="flex items-center gap-2">
            <code className="font-[family-name:var(--font-mono)] flex-1 truncate px-3 py-2.5 text-[14px] tabular-nums text-[color:var(--color-ink)]">
              {url}
            </code>
            <CopyButton text={url} />
          </div>
        </div>

        <dl className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-ink-muted)]">
          <Meta k="method" v={endpoint.method.toLowerCase()} />
          <Meta k="status" v={String(endpoint.status_code)} />
          <Meta k="delay" v={`${endpoint.delay_ms}ms`} />
          <Meta k="content-type" v={endpoint.content_type} />
          <Meta k="hits" v={String(endpoint.hit_count)} />
        </dl>
      </section>

      <section className="mt-16">
        <SectionHeading index="01" label="try it" />
        <pre className="font-[family-name:var(--font-mono)] mt-4 overflow-x-auto rounded-[4px] border border-[color:var(--color-line)] bg-[color:var(--color-surface)] px-5 py-4 text-[12.5px] leading-[1.7]">
          {curl}
        </pre>
      </section>

      <section className="mt-16">
        <SectionHeading index="02" label="response body" />
        <pre className="font-[family-name:var(--font-mono)] mt-4 overflow-x-auto rounded-[4px] border border-[color:var(--color-line)] bg-[color:var(--color-surface)] px-5 py-4 text-[12.5px] leading-[1.7]">
          {endpoint.response_body || "(empty)"}
        </pre>
      </section>

      <section className="mt-16">
        <div className="flex items-baseline justify-between">
          <SectionHeading index="03" label="incoming requests" />
          <span className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-ink-faint)]">
            live · polls every 2s
          </span>
        </div>
        <div className="mt-4">
          <RequestLog endpointId={endpoint.id} />
        </div>
      </section>

      <section className="mt-20 flex items-center justify-between border-t border-[color:var(--color-line-soft)] pt-6">
        <p className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-ink-faint)]">
          created {relativeTime(endpoint.created_at)}
        </p>
        <DeleteButton id={endpoint.id} />
      </section>
    </main>
  );
}

function SectionHeading({ index, label }: { index: string; label: string }) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.22em] text-[color:var(--color-ink-faint)]">
        {index}
      </span>
      <span className="text-[16px] font-medium tracking-[-0.005em] text-[color:var(--color-ink)]">
        {label}
      </span>
    </div>
  );
}

function Meta({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-[color:var(--color-ink-faint)]">{k}</span>
      <span className="text-[color:var(--color-ink)] normal-case tracking-normal">
        {v}
      </span>
    </div>
  );
}

function buildCurl(url: string, method: string, body: string) {
  if (method === "GET" || method === "HEAD" || method === "DELETE") {
    return `curl -X ${method} ${url}`;
  }
  const trimmed = body.trim();
  let payload = '{"hello":"world"}';
  if (trimmed) {
    try {
      JSON.parse(trimmed);
      payload = trimmed.replace(/\n\s*/g, " ");
    } catch {
      payload = trimmed;
    }
  }
  return `curl -X ${method} ${url} \\\n  -H "content-type: application/json" \\\n  -d '${payload}'`;
}

function relativeTime(ts: number) {
  const diff = Date.now() - ts;
  const s = Math.round(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
}
