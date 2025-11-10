"use client";
import { useEffect, useState } from "react";

type Mode = "light" | "dark";

function getInitialTheme(): Mode {
  if (typeof window === "undefined") return "dark";
  const ls = localStorage.getItem("theme") as Mode | null;
  if (ls === "light" || ls === "dark") return ls;
  return window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(t: Mode) {
  const root = document.documentElement;
  root.classList.toggle("dark", t === "dark");
  localStorage.setItem("theme", t);
}

export default function ThemeToggle({
  className = "",
}: {
  className?: string;
}) {
  const [theme, setTheme] = useState<Mode>("dark");

  useEffect(() => {
    const initial = getInitialTheme();
    setTheme(initial);
    applyTheme(initial);
  }, []);

  const toggle = () => {
    const next: Mode = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
  };

  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10
                  text-gray-900 dark:text-white ${className}`}
      title={theme === "dark" ? "Passer en clair" : "Passer en sombre"}
    >
      {theme === "dark" ? (
        // Soleil (pour proposer de passer en clair)
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
          <path
            d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l-1.5-1.5M20.5 20.5L19 19M5 19l-1.5 1.5M20.5 3.5L19 5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      ) : (
        // Lune (pour proposer de passer en sombre)
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path
            d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
          />
        </svg>
      )}
    </button>
  );
}
