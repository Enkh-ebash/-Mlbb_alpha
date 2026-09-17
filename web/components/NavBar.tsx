"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/matchmaking", label: "Matchmaking" },
  { href: "/tournaments", label: "Tournaments" },
  { href: "/clans", label: "Clans" },
  { href: "/heroes", label: "Heroes" },
  { href: "/profile", label: "Profile" },
];

export function NavBar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <header className="border-b border-white/10 bg-surface">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/dashboard" className="font-display text-lg font-bold text-text-primary">
          MLBB Play
        </Link>

        <nav className="hidden gap-1 md:flex">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-surface-variant text-text-primary"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-text-secondary sm:inline">{user?.username}</span>
          <button
            onClick={logout}
            className="rounded-lg border border-white/15 px-3 py-1.5 text-sm text-text-primary hover:border-coral hover:text-coral"
          >
            Гарах
          </button>
        </div>
      </div>
    </header>
  );
}
