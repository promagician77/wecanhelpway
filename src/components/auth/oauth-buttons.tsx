"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { signInWithProvider } from "@/actions/auth";
import { Spinner } from "@/components/ui/feedback";
import { cn } from "@/lib/utils";

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-[18px]" aria-hidden>
      <path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.45a5.5 5.5 0 0 1-2.39 3.62v3h3.86c2.26-2.08 3.58-5.15 3.58-8.81Z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.08 7.94-2.92l-3.86-3c-1.08.72-2.45 1.15-4.08 1.15-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.27 14.27a7.2 7.2 0 0 1 0-4.54V6.64H1.29a12 12 0 0 0 0 10.72l3.98-3.09Z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.29 6.64l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75Z" />
    </svg>
  );
}

function AppleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-[19px]" fill="currentColor" aria-hidden>
      <path d="M17.05 12.53c-.02-2.2 1.79-3.25 1.87-3.3-1.02-1.49-2.6-1.7-3.17-1.72-1.35-.14-2.63.79-3.32.79-.68 0-1.74-.77-2.86-.75-1.47.02-2.83.85-3.59 2.17-1.53 2.65-.39 6.58 1.1 8.73.73 1.05 1.6 2.23 2.74 2.19 1.1-.04 1.52-.71 2.85-.71 1.33 0 1.71.71 2.87.69 1.19-.02 1.94-1.07 2.66-2.13.84-1.22 1.19-2.4 1.21-2.46-.03-.01-2.32-.89-2.34-3.5ZM14.88 5.2c.6-.74 1.01-1.75.9-2.77-.87.04-1.93.58-2.56 1.31-.56.65-1.05 1.69-.92 2.68.97.08 1.96-.49 2.58-1.22Z" />
    </svg>
  );
}

/**
 * OAuth entry points. Each starts a server action that redirects to the
 * provider, so there is no client-side Supabase call to race with the
 * session cookie.
 */
export function OAuthButtons({ next, disabled }: { next?: string; disabled?: boolean }) {
  const [pending, setPending] = React.useState<"google" | "apple" | null>(null);

  const providers = [
    { id: "google" as const, label: "Google", mark: <GoogleMark /> },
    { id: "apple" as const, label: "Apple", mark: <AppleMark /> },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {providers.map((p) => (
        <motion.button
          key={p.id}
          type="button"
          whileTap={{ scale: 0.975 }}
          disabled={disabled || pending !== null}
          onClick={() => {
            setPending(p.id);
            void signInWithProvider(p.id, next);
          }}
          className={cn(
            "group relative flex h-12 items-center justify-center gap-2.5 overflow-hidden rounded-sm material",
            "text-[14px] font-medium text-ink/90",
            "transition-all duration-200 hover:border-ink/20 hover:brightness-125 active:translate-y-px",
            "disabled:pointer-events-none disabled:opacity-50",
          )}
        >
          <span className="relative flex items-center gap-2.5">
            {pending === p.id ? <Spinner size={18} /> : p.mark}
            {p.label}
          </span>
        </motion.button>
      ))}
    </div>
  );
}

export function AuthDivider({ label = "or use your email" }: { label?: string }) {
  return (
    <div className="flex items-center gap-3.5">
      <span className="h-px flex-1 bg-ink/[0.08]" />
      <span className="text-[13px] text-ink/55">{label}</span>
      <span className="h-px flex-1 bg-ink/[0.08]" />
    </div>
  );
}
