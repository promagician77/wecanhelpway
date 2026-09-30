import { cn } from "@/lib/utils";

/**
 * Wordmark. The mark is two linked rings with a small point of warmth where
 * they overlap — one person needing, one offering, the moment they meet.
 */
export function Logo({ compact, className }: { compact?: boolean; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="relative grid size-9 place-items-center rounded-full bg-brand-100">
        <svg viewBox="0 0 24 24" fill="none" className="size-[20px]" aria-hidden>
          <circle cx="9" cy="12" r="5.2" stroke="var(--color-brand-600)" strokeWidth="1.9" />
          <circle cx="15" cy="12" r="5.2" stroke="var(--color-brand-600)" strokeWidth="1.9" />
          <circle cx="12" cy="12" r="1.7" fill="var(--color-magenta-500)" />
        </svg>
      </span>
      {!compact && (
        <span className="text-[17px] font-semibold tracking-[-0.025em] text-ink">
          WeCanHelp<span className="text-brand-600">Way</span>
        </span>
      )}
    </span>
  );
}
