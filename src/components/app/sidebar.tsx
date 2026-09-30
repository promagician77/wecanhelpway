"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, LogOut, Menu, Plus, Sparkles, X } from "lucide-react";
import { Logo } from "@/components/marketing/logo";
import { Avatar } from "@/components/ui/misc";
import { ADMIN_NAV_ITEM, MAIN_NAV, type NavItem } from "./nav-items";
import { signOut } from "@/actions/auth";
import { cn } from "@/lib/utils";
import type { Profile } from "@/lib/types";

export interface Counters {
  messages: number;
  notifications: number;
  connections: number;
}

export function Sidebar({ profile, counters }: { profile: Profile; counters: Counters }) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const pathname = usePathname();

  React.useEffect(() => setMobileOpen(false), [pathname]);

  const items = profile.role === "admin" ? [...MAIN_NAV, ADMIN_NAV_ITEM] : MAIN_NAV;

  return (
    <>
      {/* Mobile trigger --------------------------------------------------- */}
      <button
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation"
        className="fixed left-4 top-4 z-50 grid size-11 place-items-center rounded-sm glass-strong text-ink/70 transition-colors hover:text-ink lg:hidden"
      >
        <Menu className="size-5" />
      </button>

      {/* Mobile drawer ---------------------------------------------------- */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-[60] bg-ink/21 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 38 }}
              className="fixed inset-y-0 left-0 z-[61] w-[19rem] glass-strong lg:hidden"
            >
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Close navigation"
                className="absolute right-4 top-4 grid size-9 place-items-center rounded-xs text-ink/62 hover:bg-ink/[0.08] hover:text-ink"
              >
                <X className="size-4.5" />
              </button>
              <SidebarBody profile={profile} counters={counters} items={items} pathname={pathname} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop rail ----------------------------------------------------- */}
      <aside className="sticky top-0 hidden h-dvh w-[17.5rem] shrink-0 border-r border-ink/[0.06] bg-[#ffffff] shadow-[inset_-1px_0_0_rgb(43_42_39/0.03)] lg:block">
        <SidebarBody profile={profile} counters={counters} items={items} pathname={pathname} />
      </aside>
    </>
  );
}

function SidebarBody({
  profile,
  counters,
  items,
  pathname,
}: {
  profile: Profile;
  counters: Counters;
  items: NavItem[];
  pathname: string;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pb-5 pt-6">
        <Link href="/dashboard">
          <Logo />
        </Link>
      </div>

      {/* Primary actions */}
      <div className="space-y-2 px-4 pb-5">
        <Link href="/needs/new" className="block">
          <span className="group relative flex h-11 w-full items-center justify-center gap-2 overflow-hidden rounded-sm skin-chrome text-sm font-medium transition-[filter] hover:brightness-105">
            <span
              aria-hidden
              className="pointer-events-none absolute inset-y-0 left-0 w-1/3 -translate-x-[120%] opacity-0 bg-[linear-gradient(90deg,transparent,#fff,transparent)] group-hover:animate-sheen"
            />
            <Plus className="size-4" />
            Ask for help
          </span>
        </Link>
        <Link href="/offers/new" className="block">
          <span className="flex h-11 w-full items-center justify-center gap-2 rounded-sm glass text-sm font-medium text-ink/85 transition-all hover:bg-ink/[0.09] hover:text-ink">
            <Sparkles className="size-4" />
            Offer to help
          </span>
        </Link>
      </div>

      <nav className="no-scrollbar flex-1 overflow-y-auto px-3 pb-4">
        <ul className="space-y-0.5">
          {items.map((item) => {
            const active =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            const count = item.badge ? counters[item.badge] : 0;
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-sm px-3 py-2.5 text-[14px] font-medium transition-colors duration-200",
                    active ? "text-ink" : "text-ink/62 hover:text-ink/90",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="sidebar-active"
                      transition={{ type: "spring", stiffness: 420, damping: 36 }}
                      className="absolute inset-0 rounded-sm border border-ink/[0.1] bg-[linear-gradient(180deg,#f1eee8,#f1eee8)] shadow-[inset_0_1px_0_rgb(255_255_255/0.1),0_1px_3px_rgb(43_42_39/0.108)]"
                    />
                  )}
                  {active && (
                    <span
                      aria-hidden
                      className="absolute -left-3 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-brand-500"
                    />
                  )}
                  <Icon
                    className={cn(
                      "relative size-[18px] shrink-0 transition-colors",
                      active ? "text-ink" : "text-ink/50 group-hover:text-ink/60",
                    )}
                  />
                  <span className="relative flex-1 truncate">{item.label}</span>
                  {count > 0 && (
                    <span className="relative grid min-w-5 place-items-center rounded-full bg-brand-500 px-1.5 py-0.5 text-[10.5px] font-semibold tabular-nums text-snow">
                      {count > 99 ? "99+" : count}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Account */}
      <div className="border-t border-ink/[0.06] p-3">
        <Link
          href="/profile"
          className="group flex items-center gap-3 rounded-sm px-2 py-2.5 transition-colors hover:bg-ink/[0.05]"
        >
          <Avatar src={profile.avatar_url} name={profile.full_name} size={38} ring={profile.role === "admin"} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13.5px] font-medium text-ink/90">
              {profile.full_name ?? "Your profile"}
            </span>
            <span className="block truncate text-[11.5px] text-ink/50">
              {profile.role === "admin" ? "WeCanHelpWay team" : profile.email}
            </span>
          </span>
          <ChevronRight className="size-4 shrink-0 text-ink/50 transition-transform group-hover:translate-x-0.5 group-hover:text-ink/62" />
        </Link>

        <form action={signOut}>
          <button
            type="submit"
            className="mt-1 flex w-full items-center gap-3 rounded-sm px-2 py-2.5 text-[13.5px] font-medium text-ink/58 transition-colors hover:bg-critical/10 hover:text-critical"
          >
            <LogOut className="size-[17px]" />
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
