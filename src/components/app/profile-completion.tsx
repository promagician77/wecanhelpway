"use client";

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, X } from "lucide-react";
import { ProgressBar } from "@/components/ui/feedback";
import type { Profile } from "@/lib/types";

/**
 * A nudge, not a wall. We never block someone from asking for help because
 * their profile is thin — but a fuller profile genuinely helps us match them.
 */
export function ProfileCompletion({ profile }: { profile: Profile }) {
  const [dismissed, setDismissed] = React.useState(false);

  const checks: { label: string; done: boolean }[] = [
    { label: "Photo", done: Boolean(profile.avatar_url) },
    { label: "Short bio", done: Boolean(profile.bio) },
    { label: "Country", done: Boolean(profile.country) },
    { label: "Languages", done: profile.languages.length > 0 },
    { label: "Skills", done: profile.skills.length > 0 },
    { label: "Phone verified", done: profile.phone_verified },
  ];

  const done = checks.filter((c) => c.done).length;
  const pct = Math.round((done / checks.length) * 100);

  if (pct === 100 || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, height: 0 }}
        className="relative mt-7 overflow-hidden rounded-md glass p-5 sm:p-6"
      >
        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="absolute right-3.5 top-3.5 grid size-7 place-items-center rounded-xs text-ink/50 transition-colors hover:bg-ink/[0.08] hover:text-ink/70"
        >
          <X className="size-3.5" />
        </button>

        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="min-w-0 flex-1">
            <h2 className="text-[15px] font-semibold text-ink/90">
              Your profile is {pct}% complete
            </h2>
            <p className="mt-1.5 max-w-lg text-[13.5px] leading-relaxed text-ink/58">
              The more we know, the better the person we find for you. None of it is public — only
              someone you&apos;ve agreed to connect with ever sees it.
            </p>

            <div className="mt-4 max-w-md">
              <ProgressBar value={pct} showValue={false} size="sm" />
            </div>

            <ul className="mt-4 flex flex-wrap gap-1.5">
              {checks.map((c) => (
                <li
                  key={c.label}
                  className={
                    c.done
                      ? "rounded-full border border-positive/25 bg-positive/10 px-2.5 py-1 text-[11.5px] font-medium text-positive"
                      : "rounded-full border border-ink/10 bg-ink/[0.03] px-2.5 py-1 text-[11.5px] text-ink/50"
                  }
                >
                  {c.label}
                </li>
              ))}
            </ul>
          </div>

          <Link
            href="/profile"
            className="group inline-flex shrink-0 items-center gap-1.5 rounded-sm border border-ink/12 bg-ink/[0.04] px-4 py-2.5 text-[13px] font-medium text-ink/80 transition-all hover:border-brand-400/40 hover:bg-brand-500/12 hover:text-snow"
          >
            Finish profile
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </motion.section>
    </AnimatePresence>
  );
}
