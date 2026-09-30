"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Check, CircleDashed, MessageCircle, Sparkles } from "lucide-react";
import { NEED_JOURNEY, NEED_STATUS_META } from "@/lib/constants";
import { cn, relativeTime } from "@/lib/utils";
import type { NeedStatus, StatusEvent } from "@/lib/types";

/** Where a status sits on the journey rail. Off-rail states return -1. */
function journeyIndex(status: NeedStatus) {
  if (status === "needs_clarification") return NEED_JOURNEY.indexOf("under_review");
  if (status === "match_suggested") return NEED_JOURNEY.indexOf("looking_for_match");
  if (status === "conversation_active") return NEED_JOURNEY.indexOf("conversation_active");
  return NEED_JOURNEY.indexOf(status);
}

/**
 * The horizontal journey rail. Deliberately shows every stage up front — the
 * point is that someone waiting can see the whole road, not just their step.
 */
export function JourneyRail({ status }: { status: NeedStatus }) {
  const current = journeyIndex(status);
  const closed = status === "rejected" || status === "archived";
  const pct = closed ? 100 : ((current + 0.5) / NEED_JOURNEY.length) * 100;

  return (
    <div className="w-full">
      <div className="relative">
        {/* Rail */}
        <div className="absolute left-0 right-0 top-[15px] h-[2px] rounded-full bg-ink/[0.07]" />
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 90, damping: 22, delay: 0.15 }}
          className="absolute left-0 top-[15px] h-[2px] rounded-full"
          style={{
            background: closed
              ? "linear-gradient(90deg,#71717a,#a1a1aa)"
              : "var(--color-brand-500)",
            boxShadow: undefined,
          }}
        />

        <ol className="relative flex justify-between">
          {NEED_JOURNEY.map((step, i) => {
            const done = !closed && i < current;
            const active = !closed && i === current;
            const meta = NEED_STATUS_META[step];

            return (
              <li key={step} className="flex min-w-0 flex-1 flex-col items-center text-center">
                <motion.span
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1 + i * 0.07, type: "spring", stiffness: 380, damping: 24 }}
                  className={cn(
                    "relative z-10 grid size-8 place-items-center rounded-full border-2 bg-void transition-colors duration-500",
                    done && "border-ink/40 bg-[#f1eee8] text-ink",
                    active && "border-transparent text-snow",
                    !done && !active && "border-ink/12 text-ink/50",
                  )}
                >
                  {active && (
                    <>
                      <span
                        className="absolute inset-0 rounded-full"
                        style={{
                          background: "var(--color-brand-500)",
                        }}
                      />
                      <span className="absolute -inset-1 animate-breathe rounded-full bg-brand-200" />
                    </>
                  )}
                  <span className="relative">
                    {done ? (
                      <Check className="size-4" strokeWidth={3} />
                    ) : active ? (
                      <Sparkles className="size-3.5" />
                    ) : (
                      <CircleDashed className="size-3.5" />
                    )}
                  </span>
                </motion.span>

                <span
                  className={cn(
                    "mt-2.5 hidden px-1 text-[11px] font-medium leading-tight tracking-tight sm:block",
                    active ? "text-ink" : done ? "text-ink/55" : "text-ink/50",
                  )}
                >
                  {meta.label}
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Current-state explanation — the "you always know what's happening" line */}
      <motion.div
        key={status}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-6 flex items-start gap-3 rounded-sm well px-4 py-3.5"
      >
        <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-brand-500/15 text-brand-700">
          <MessageCircle className="size-3.5" />
        </span>
        <p className="text-[13.5px] leading-relaxed text-ink/60">
          <span className="font-semibold text-ink/90">{NEED_STATUS_META[status].label}.</span>{" "}
          {NEED_STATUS_META[status].blurb}
        </p>
      </motion.div>
    </div>
  );
}

/**
 * Vertical event log under the rail. Every status change the team makes gets a
 * line here, so nothing happens to someone's request invisibly.
 */
export function EventLog({ events }: { events: StatusEvent[] }) {
  if (!events.length) return null;

  return (
    <ol className="relative space-y-0">
      <span
        aria-hidden
        className="absolute bottom-3 left-[13px] top-3 w-px bg-gradient-to-b from-ink/40 via-ink/10 to-transparent"
      />
      {[...events].reverse().map((event, i) => (
        <motion.li
          key={event.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          className="relative flex gap-4 pb-6 last:pb-0"
        >
          <span
            className={cn(
              "relative z-10 mt-0.5 grid size-[27px] shrink-0 place-items-center rounded-full border",
              i === 0
                ? "border-ink bg-snow text-ink"
                : "border-ink/10 bg-slate-deep text-ink/50",
            )}
          >
            
            <Check className="relative size-3" strokeWidth={3} />
          </span>

          <div className="min-w-0 flex-1 pb-1">
            <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
              <span className="text-[13.5px] font-semibold text-ink/85">
                {NEED_STATUS_META[event.status as NeedStatus]?.label ?? event.status.replace(/_/g, " ")}
              </span>
              <span className="font-mono text-[10.5px] text-ink/50">{relativeTime(event.created_at)}</span>
            </div>
            {event.message && (
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink/62">{event.message}</p>
            )}
          </div>
        </motion.li>
      ))}
    </ol>
  );
}
