"use client";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { useSidebar } from "@/context/SidebarContext";
import ThemeToggle from "@/components/ThemeToggle";

export default function AppHeader() {
  const { user, isAuthenticated, logout } = useAuth();
  const { toggleDesktop, toggleMobile } = useSidebar();

  // Sur mobile (< xl) on ouvre/ferme la sidebar en slide.
  // Sur desktop (>= xl) on réduit/étend la sidebar (w-90px <-> w-290px).
  const handleBurgerClick = () => {
    if (typeof window !== "undefined" && window.innerWidth < 1280) {
      toggleMobile();
    } else {
      toggleDesktop();
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/80 dark:bg-gray-900/70 backdrop-blur border-b border-gray-200 dark:border-gray-800">
      <div className="px-4 py-3 flex items-center gap-3">
        {/* Burger (style TailAdmin) */}
        <button
          onClick={handleBurgerClick}
          aria-label="Open sidebar"
          className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-gray-200/60 dark:border-white/10
                     text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10"
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path
              d="M4 6h16M4 12h16M4 18h16"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>

        {/* Search (lisible clair/sombre) */}
        <div className="flex-1">
          <div
            className="relative max-w-xl flex items-center rounded-xl
                       bg-gray-100 text-gray-900 dark:bg-white/10 dark:text-white
                       border border-gray-200/60 dark:border-white/10
                       focus-within:ring-1 focus-within:ring-brand-500/40"
          >
            <span className="absolute left-3 text-gray-500 dark:text-gray-400">
              <svg width="16" height="16" viewBox="0 0 24 24">
                <circle
                  cx="11"
                  cy="11"
                  r="7"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                />
                <path
                  d="M20 20l-3.5-3.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </span>

            <input
              className="w-full pl-9 pr-14 py-2 bg-transparent outline-none
                         placeholder-gray-500 dark:placeholder-gray-400"
              placeholder="Search or type command…"
            />

            <span
              className="absolute right-2 text-[12px] leading-none px-2 py-1 rounded-md
                         border border-gray-200/60 dark:border-white/10
                         text-gray-600 dark:text-gray-300"
            >
              ⌘K
            </span>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <ThemeToggle />

          {!isAuthenticated ? (
            <Link
              href="/signin"
              className="px-4 py-2 rounded-lg bg-brand-500 text-white hover:bg-brand-600"
            >
              Se connecter
            </Link>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Image
                  src={user?.avatar || "/images/user/user-01.png"}
                  alt="avatar"
                  width={32}
                  height={32}
                  className="rounded-full"
                />
                <span className="text-sm text-gray-700 dark:text-gray-200">
                  {user?.name}
                </span>
              </div>
              <button
                onClick={logout}
                className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20"
              >
                Déconnexion
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
