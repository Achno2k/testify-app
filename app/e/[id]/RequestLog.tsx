"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type IncomingRequest = {
  id: number;
  method: string;
  headers: Record<string, string>;
  body: string | null;
  query: string | null;
  received_at: number;
};

export default function RequestLog({ endpointId }: { endpointId: string }) {
  const router = useRouter();
  const [requests, setRequests] = useState<IncomingRequest[] | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);
  const seenIds = useRef<Set<number>>(new Set());
  const [flashIds, setFlashIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    let cancelled = false;
    async function fetchRequests() {
      try {
        const res = await fetch(`/api/endpoints/${endpointId}/requests`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const j = (await res.json()) as { requests: IncomingRequest[] };
        if (cancelled) return;
        const newOnes = j.requests.filter((r) => !seenIds.current.has(r.id));
        if (newOnes.length > 0 && seenIds.current.size > 0) {
          const ids = new Set(newOnes.map((r) => r.id));
          setFlashIds(ids);
          setTimeout(() => setFlashIds(new Set()), 900);
          // Refresh server component to update hit counter.
          router.refresh();
        }
        j.requests.forEach((r) => seenIds.current.add(r.id));
        setRequests(j.requests);
      } catch {
        // ignore
      }
    }
    fetchRequests();
    const interval = setInterval(fetchRequests, 2000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [endpointId, router]);

  if (requests === null) {
    return (
      <div className="rounded-[4px] border border-dashed border-[color:var(--color-line)] bg-transparent px-5 py-6 font-[family-name:var(--font-mono)] text-[12px] text-[color:var(--color-ink-faint)]">
        loading…
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="rounded-[4px] border border-dashed border-[color:var(--color-line)] bg-transparent px-5 py-10 text-center">
        <p className="text-[16px] text-[color:var(--color-ink-muted)]">
          waiting for the first request…
        </p>
        <p className="font-[family-name:var(--font-mono)] mt-2 text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-ink-faint)]">
          fire one off and watch it appear
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-[color:var(--color-line-soft)] overflow-hidden rounded-[4px] border border-[color:var(--color-line)] bg-[color:var(--color-surface)]">
      {requests.map((r) => {
        const isOpen = expanded === r.id;
        const isNew = flashIds.has(r.id);
        return (
          <li
            key={r.id}
            className={
              "transition-colors " +
              (isNew ? "bg-[color:var(--color-surface-2)]" : "bg-transparent")
            }
          >
            <button
              type="button"
              onClick={() => setExpanded(isOpen ? null : r.id)}
              className="flex w-full items-center gap-4 px-5 py-3 text-left transition-colors hover:bg-[color:var(--color-surface-2)]"
            >
              <span className="font-[family-name:var(--font-mono)] w-12 shrink-0 text-[11px] uppercase tracking-[0.12em] text-[color:var(--color-ink)]">
                {r.method.toLowerCase()}
              </span>
              <span className="font-[family-name:var(--font-mono)] flex-1 truncate text-[12px] text-[color:var(--color-ink-muted)]">
                {summarize(r)}
              </span>
              <span className="font-[family-name:var(--font-mono)] shrink-0 text-[11px] tabular-nums text-[color:var(--color-ink-faint)]">
                {formatTime(r.received_at)}
              </span>
            </button>
            {isOpen && (
              <div className="border-t border-[color:var(--color-line-soft)] bg-[color:var(--color-surface-2)] px-5 py-4">
                <RequestDetail r={r} />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function RequestDetail({ r }: { r: IncomingRequest }) {
  return (
    <div className="space-y-4 font-[family-name:var(--font-mono)] text-[12px]">
      {r.query && (
        <Block label="query">
          <pre className="whitespace-pre-wrap break-all">
            {JSON.stringify(JSON.parse(r.query), null, 2)}
          </pre>
        </Block>
      )}
      <Block label="headers">
        <pre className="whitespace-pre-wrap break-all">
          {Object.entries(r.headers)
            .map(([k, v]) => `${k}: ${v}`)
            .join("\n")}
        </pre>
      </Block>
      {r.body && (
        <Block label="body">
          <pre className="whitespace-pre-wrap break-all">
            {tryPrettyJson(r.body)}
          </pre>
        </Block>
      )}
    </div>
  );
}

function Block({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1 text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-ink-faint)]">
        {label}
      </div>
      <div className="text-[color:var(--color-ink)]">{children}</div>
    </div>
  );
}

function summarize(r: IncomingRequest) {
  if (r.body) {
    const single = r.body.replace(/\s+/g, " ").trim();
    return single.length > 80 ? single.slice(0, 80) + "…" : single;
  }
  if (r.query) return r.query;
  return "no body";
}

function formatTime(ts: number) {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

function tryPrettyJson(s: string) {
  try {
    return JSON.stringify(JSON.parse(s), null, 2);
  } catch {
    return s;
  }
}
