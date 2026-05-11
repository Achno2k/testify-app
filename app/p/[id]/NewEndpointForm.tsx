"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const METHODS = ["ANY", "GET", "POST", "PUT", "PATCH", "DELETE"] as const;
type Method = (typeof METHODS)[number];

const DEFAULT_BODY = `{
  "ok": true,
  "message": "hello from testify"
}`;

export default function NewEndpointForm({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [method, setMethod] = useState<Method>("ANY");
  const [statusCode, setStatusCode] = useState("200");
  const [delayMs, setDelayMs] = useState("0");
  const [body, setBody] = useState(DEFAULT_BODY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/endpoints", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || null,
          method,
          status_code: Number(statusCode),
          delay_ms: Number(delayMs),
          response_body: body,
          project_id: projectId,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "could not create endpoint");
      }
      const j = (await res.json()) as { id: string };
      router.push(`/e/${j.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="endpoint name (optional)"
        maxLength={80}
        className="w-full rounded-[3px] border border-[color:var(--color-line)] bg-[color:var(--color-surface-2)] px-3.5 py-2.5 text-[14px] placeholder:text-[color:var(--color-ink-faint)] transition-colors focus:border-[color:var(--color-ink)] focus:bg-[color:var(--color-surface)]"
      />

      <div className="flex flex-wrap gap-1.5">
        {METHODS.map((m) => {
          const active = method === m;
          return (
            <button
              type="button"
              key={m}
              onClick={() => setMethod(m)}
              className={
                "font-[family-name:var(--font-mono)] rounded-[3px] border px-3 py-1.5 text-[12px] uppercase tracking-[0.12em] transition-colors " +
                (active
                  ? "border-[color:var(--color-ink)] bg-[color:var(--color-ink)] text-[color:var(--color-bg)]"
                  : "border-[color:var(--color-line)] bg-[color:var(--color-surface-2)] text-[color:var(--color-ink-muted)] hover:border-[color:var(--color-ink)] hover:text-[color:var(--color-ink)]")
              }
            >
              {m.toLowerCase()}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <label className="block">
          <span className="font-[family-name:var(--font-mono)] mb-1.5 block text-[10px] uppercase tracking-[0.2em] text-[color:var(--color-ink-faint)]">
            status
          </span>
          <input
            type="number"
            min={100}
            max={599}
            value={statusCode}
            onChange={(e) => setStatusCode(e.target.value)}
            className="font-[family-name:var(--font-mono)] w-full rounded-[3px] border border-[color:var(--color-line)] bg-[color:var(--color-surface-2)] px-3.5 py-2.5 text-[14px] tabular-nums transition-colors focus:border-[color:var(--color-ink)] focus:bg-[color:var(--color-surface)]"
          />
        </label>
        <label className="block">
          <span className="font-[family-name:var(--font-mono)] mb-1.5 block text-[10px] uppercase tracking-[0.2em] text-[color:var(--color-ink-faint)]">
            delay (ms)
          </span>
          <input
            type="number"
            min={0}
            max={10000}
            value={delayMs}
            onChange={(e) => setDelayMs(e.target.value)}
            className="font-[family-name:var(--font-mono)] w-full rounded-[3px] border border-[color:var(--color-line)] bg-[color:var(--color-surface-2)] px-3.5 py-2.5 text-[14px] tabular-nums transition-colors focus:border-[color:var(--color-ink)] focus:bg-[color:var(--color-surface)]"
          />
        </label>
      </div>

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={10}
        spellCheck={false}
        className="font-[family-name:var(--font-mono)] w-full resize-none rounded-[3px] border border-[color:var(--color-line)] bg-[color:var(--color-surface-2)] px-4 py-3.5 text-[13px] leading-[1.7] transition-colors focus:border-[color:var(--color-ink)] focus:bg-[color:var(--color-surface)]"
      />

      {error && (
        <p className="font-[family-name:var(--font-mono)] text-[12px] text-[color:var(--color-accent)]">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex items-center gap-2 whitespace-nowrap rounded-[3px] bg-[color:var(--color-ink)] px-5 py-3 text-[14px] text-[color:var(--color-bg)] transition-transform hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "spinning up…" : "spin up endpoint →"}
      </button>
    </form>
  );
}
