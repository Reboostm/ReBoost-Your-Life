"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Plus, Trophy, TrendingUp, Settings } from "lucide-react";
import clsx from "clsx";

const NAV_ITEMS = [
  { href: "/dashboard", icon: Home, label: "Feed" },
  { href: "/leaderboard", icon: Trophy, label: "Rank" },
  { href: "/log", icon: Plus, label: "Log", primary: true },
  { href: "/analytics", icon: TrendingUp, label: "Stats" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-border">
      <div className="flex items-center justify-around px-2 py-2 max-w-lg mx-auto">
        {NAV_ITEMS.map(({ href, icon: Icon, label, primary }) => {
          const active = pathname === href;
          if (primary) {
            return (
              <Link key={href} href={href}>
                <div
                  className={clsx(
                    "w-14 h-14 rounded-2xl flex flex-col items-center justify-center -mt-5 glow-green",
                    "bg-primary shadow-lg shadow-primary/30",
                    active && "scale-95"
                  )}
                >
                  <Icon className="w-6 h-6 text-bg" strokeWidth={2.5} />
                </div>
              </Link>
            );
          }
          return (
            <Link key={href} href={href}>
              <div className="flex flex-col items-center gap-1 px-3 py-1">
                <Icon
                  className={clsx(
                    "w-5 h-5 transition-colors",
                    active ? "text-primary" : "text-muted"
                  )}
                  strokeWidth={active ? 2.5 : 2}
                />
                <span
                  className={clsx(
                    "text-[10px] font-semibold transition-colors",
                    active ? "text-primary" : "text-muted"
                  )}
                >
                  {label}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
