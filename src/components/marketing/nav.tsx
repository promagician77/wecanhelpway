"use client";

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Logo } from "./logo";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/#how", label: "How it works" },
  { href: "/#need", label: "Get help" },
  { href: "/#offer", label: "Give help" },
  { href: "/#stories", label: "Stories" },
];

export function MarketingNav({ signedIn }: { signedIn: boolean }) {
  const [scrolled, setScrolled] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 24));

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6">
        <nav
          className={cn(
            "mx-auto flex max-w-6xl items-center gap-6 rounded-full px-3 py-2 transition-all duration-500 sm:px-4",
            scrolled ? "glass-strong" : "glass",
          )}
        >
          <Link href="/" className="shrink-0 pl-1">
            <Logo />
          </Link>

          <ul className="ml-2 hidden items-center gap-1 lg:flex">
            {LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="rounded-full px-4 py-2 text-[14px] font-medium text-ink/65 transition-colors duration-300 hover:bg-ink/[0.05] hover:text-ink"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="ml-auto flex items-center gap-2">
            {signedIn ? (
              <Link
                href="/dashboard"
                className="inline-flex h-10 items-center rounded-full skin-chrome px-5 text-[14px] font-medium transition-colors hover:bg-brand-700"
              >
                My dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="hidden h-10 items-center rounded-full px-4 text-[14px] font-medium text-ink/70 transition-colors hover:bg-ink/[0.05] hover:text-ink sm:inline-flex"
                >
                  Sign in
                </Link>
                <Link
                  href="/sign-up"
                  className="inline-flex h-10 items-center rounded-full skin-chrome px-5 text-[14px] font-medium transition-colors hover:bg-brand-700"
                >
                  Join free
                </Link>
              </>
            )}

            <button
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              className="grid size-10 place-items-center rounded-full text-ink/60 transition-colors hover:bg-ink/[0.05] hover:text-ink lg:hidden"
            >
              <Menu className="size-5" />
            </button>
          </div>
        </nav>
      </header>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-[60] bg-ink/20 backdrop-blur-[3px] lg:hidden"
            />
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-x-4 top-4 z-[61] rounded-[28px] bg-snow p-6 shadow-[0_30px_80px_-30px_rgb(43_42_39/0.35)] lg:hidden"
            >
              <div className="flex items-center justify-between">
                <Logo />
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close menu"
                  className="grid size-10 place-items-center rounded-full text-ink/62 hover:bg-ink/[0.05] hover:text-ink"
                >
                  <X className="size-5" />
                </button>
              </div>

              <ul className="mt-6 space-y-1">
                {LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className="block rounded-2xl px-4 py-3.5 text-[17px] font-medium text-ink/80 transition-colors hover:bg-brand-50 hover:text-ink"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>

              {!signedIn && (
                <div className="mt-5 grid gap-2.5 border-t border-ink/[0.07] pt-5">
                  <Link
                    href="/sign-up"
                    onClick={() => setOpen(false)}
                    className="flex h-12 items-center justify-center rounded-full skin-chrome text-[15px] font-medium"
                  >
                    Join free
                  </Link>
                  <Link
                    href="/sign-in"
                    onClick={() => setOpen(false)}
                    className="flex h-12 items-center justify-center rounded-full border border-ink/12 text-[15px] font-medium text-ink/75"
                  >
                    Sign in
                  </Link>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
