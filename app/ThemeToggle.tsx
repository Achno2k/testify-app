"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "dark" : "light");
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    if (next === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    try {
      localStorage.setItem("testify-theme", next);
    } catch {
      // ignore
    }
  }

  // Render a placeholder until hydrated to avoid mismatch flicker.
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="toggle theme"
      className="font-[family-name:var(--font-mono)] inline-flex items-center gap-1.5 rounded-[3px] border border-[color:var(--color-line)] bg-[color:var(--color-surface)] px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-[color:var(--color-ink-muted)] transition-colors hover:border-[color:var(--color-ink)] hover:text-[color:var(--color-ink)]"
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{
          background:
            theme === "dark" ? "var(--color-accent)" : "var(--color-ink)",
        }}
      />
      {theme ?? "···"}
    </button>
  );
}
