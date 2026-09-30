"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/needs", label: "Requests" },
  { href: "/admin/offers", label: "Offers" },
  { href: "/admin/connections", label: "Connections" },
  { href: "/admin/users", label: "People" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="no-scrollbar -mx-1 flex min-w-0 flex-1 gap-1 overflow-x-auto px-1">
      {LINKS.map((link) => {
        const active =
          link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "relative shrink-0 rounded-xs px-3.5 py-2 text-[13px] font-medium transition-colors",
              active ? "text-ink" : "text-ink/58 hover:text-ink/75",
            )}
          >
            {active && (
              <motion.span
                layoutId="admin-nav"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
                className="absolute inset-0 rounded-xs border border-ink/[0.1] bg-[linear-gradient(180deg,#f1eee8,#f1eee8)] shadow-[inset_0_1px_0_rgb(255_255_255/0.1),0_1px_3px_rgb(43_42_39/0.108)]"
              />
            )}
            <span className="relative whitespace-nowrap">{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
