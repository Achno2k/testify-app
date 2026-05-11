"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const METHODS = ["ANY", "GET", "POST", "PUT", "PATCH", "DELETE"] as const;
type Method = (typeof METHODS)[number];

const DEFAULT_BODY = `{
  "ok": true,
  "message": "hello from testify"
}`;

export default function QuickEndpointForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [method, setMethod] = useState<Method>("ANY");
  const [statusCode, setStatusCode] = useState("200");
  const [delayMs, setDelayMs] = useState("0");
  const [body, setBody] = useState(DEFAULT_BODY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bodyKind = useMemo(() => {
    const trimmed = body.trim();
    if (!trimmed) return "empty" as const;
    try {
      JSON.parse(trimmed);
      return "json" as const;
    } catch {
      return "text" as const;
    }
  }, [body]);

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
    <form onSubmit={submit} className="mt-20 space-y-12">
      <Field
        index="01"
        label="name"
        hint="optional. just for your own reference."
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. user-signup mock"
          maxLength={80}
          className="w-full rounded-[3px] border border-[color:var(--color-line)] bg-[color:var(--color-surface-2)] px-3.5 py-2.5 text-[15px] placeholder:text-[color:var(--color-ink-faint)] transition-colors focus:border-[color:var(--color-ink)] focus:bg-[color:var(--color-surface)]"
        />
      </Field>

      <Field
        index="02"
        label="method"
        hint="leave on any to accept everything."
      >
        <div className="-mx-0.5 flex flex-wrap gap-1.5">
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
      </Field>

      <Field index="03" label="timing">
        <div className="grid grid-cols-2 gap-4">
          <SmallNumberField
            label="status"
            suffix=""
            value={statusCode}
            onChange={setStatusCode}
            min={100}
            max={599}
          />
          <SmallNumberField
            label="delay"
            suffix="ms"
            value={delayMs}
            onChange={setDelayMs}
            min={0}
            max={10000}
          />
        </div>
      </Field>

      <Field
        index="04"
        label="response body"
        hint={
          bodyKind === "json"
            ? "valid json · application/json"
            : bodyKind === "text"
              ? "not json · text/plain"
              : "empty · application/json"
        }
      >
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={12}
          spellCheck={false}
          className="font-[family-name:var(--font-mono)] w-full resize-none rounded-[3px] border border-[color:var(--color-line)] bg-[color:var(--color-surface-2)] px-4 py-3.5 text-[13px] leading-[1.7] transition-colors focus:border-[color:var(--color-ink)] focus:bg-[color:var(--color-surface)]"
        />
      </Field>

      {error && (
        <p className="font-[family-name:var(--font-mono)] text-[12px] text-[color:var(--color-accent)]">
          {error}
        </p>
      )}

      <div className="flex items-center justify-between gap-4">
        <p className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-ink-faint)]">
          no signup. lives on this machine.
        </p>
        <button
          type="submit"
          disabled={submitting}
          className="group inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-[3px] bg-[color:var(--color-ink)] px-5 py-3 text-[14px] text-[color:var(--color-bg)] transition-transform hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "spinning up…" : "spin up endpoint"}
          <span className="transition-transform group-hover:translate-x-0.5">
            →
          </span>
        </button>
      </div>
    </form>
  );
}

function Field({
  index,
  label,
  hint,
  children,
}: {
  index: string;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
        <div className="flex items-baseline gap-3">
          <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.22em] text-[color:var(--color-ink-faint)]">
            {index}
          </span>
          <span className="text-[16px] font-medium tracking-[-0.005em] text-[color:var(--color-ink)]">
            {label}
          </span>
        </div>
        {hint && (
          <span className="font-[family-name:var(--font-mono)] text-[11px] text-[color:var(--color-ink-muted)] sm:text-right">
            {hint}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function SmallNumberField({
  label,
  suffix,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  suffix: string;
  value: string;
  onChange: (v: string) => void;
  min: number;
  max: number;
}) {
  return (
    <label className="block">
      <span className="font-[family-name:var(--font-mono)] mb-1.5 block text-[10px] uppercase tracking-[0.2em] text-[color:var(--color-ink-faint)]">
        {label}
      </span>
      <div className="flex items-center rounded-[3px] border border-[color:var(--color-line)] bg-[color:var(--color-surface-2)] focus-within:border-[color:var(--color-ink)] focus-within:bg-[color:var(--color-surface)]">
        <input
          type="number"
          inputMode="numeric"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          min={min}
          max={max}
          className="font-[family-name:var(--font-mono)] w-full bg-transparent px-3.5 py-2.5 text-[14px] tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        {suffix && (
          <span className="font-[family-name:var(--font-mono)] pr-3.5 text-[12px] text-[color:var(--color-ink-faint)]">
            {suffix}
          </span>
        )}
      </div>
    </label>
  );
}
