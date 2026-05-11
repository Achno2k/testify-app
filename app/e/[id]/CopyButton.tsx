"use client";

import { useState } from "react";

export default function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignored
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="font-[family-name:var(--font-mono)] shrink-0 rounded-[3px] bg-[color:var(--color-ink)] px-3.5 py-2 text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-bg)] transition-opacity hover:opacity-90"
    >
      {copied ? "copied" : "copy"}
    </button>
  );
}
