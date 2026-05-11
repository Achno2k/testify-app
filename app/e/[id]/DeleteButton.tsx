"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteButton({ id }: { id: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [working, setWorking] = useState(false);

  async function doDelete() {
    setWorking(true);
    try {
      await fetch(`/api/endpoints/${id}`, { method: "DELETE" });
      router.push("/");
    } catch {
      setWorking(false);
    }
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-ink-faint)] hover:text-[color:var(--color-accent)]"
      >
        delete endpoint
      </button>
    );
  }

  return (
    <div className="font-[family-name:var(--font-mono)] flex items-center gap-3 text-[11px] uppercase tracking-[0.18em]">
      <span className="text-[color:var(--color-ink-muted)]">sure?</span>
      <button
        onClick={doDelete}
        disabled={working}
        className="text-[color:var(--color-accent)] hover:underline"
      >
        {working ? "deleting…" : "yes, delete"}
      </button>
      <button
        onClick={() => setConfirming(false)}
        className="text-[color:var(--color-ink-faint)] hover:text-[color:var(--color-ink)]"
      >
        cancel
      </button>
    </div>
  );
}
