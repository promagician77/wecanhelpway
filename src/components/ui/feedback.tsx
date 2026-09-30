"use client";

import * as React from "react";
import { AnimatePresence, motion, useMotionValue, useSpring } from "framer-motion";
import { cn } from "@/lib/utils";
import type { StatusMeta } from "@/lib/constants";
import { Spinner } from "./spinner";

export { Spinner };

/* ------------------------------ Progress bar ------------------------------ */

const FILL: Record<string, string> = {
  brand: "var(--color-brand-500)",
  success: "var(--color-positive)",
  warn: "var(--color-caution)",
  danger: "var(--color-critical)",
};

/** A soft rounded track that fills slowly — progress, not pressure. */
export function ProgressBar({
  value,
  max = 100,
  label,
  showValue = true,
  size = "md",
  tone = "brand",
  className,
}: {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  size?: "sm" | "md" | "lg";
  tone?: "brand" | "success" | "warn" | "danger";
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const height = { sm: "h-1.5", md: "h-2", lg: "h-3" }[size];

  return (
    <div className={cn("w-full", className)}>
      {(label || showValue) && (
        <div className="mb-2 flex items-baseline justify-between gap-3">
          {label && <span className="text-[13px] font-medium text-ink/70">{label}</span>}
          {showValue && <span className="text-[12px] tabular-nums text-ink/58">{Math.round(pct)}%</span>}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        className={cn("relative w-full overflow-hidden rounded-full bg-ink/[0.07]", height)}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          className="h-full rounded-full"
          style={{ background: FILL[tone] }}
        />
      </div>
    </div>
  );
}

/* --------------------------- Segmented progress --------------------------- */

export function StepProgress({
  steps,
  current,
  onStepClick,
}: {
  steps: string[];
  current: number;
  onStepClick?: (i: number) => void;
}) {
  return (
    <ol className="flex items-start gap-2">
      {steps.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={s} className="flex-1">
            <button
              type="button"
              disabled={!onStepClick || i > current}
              onClick={() => onStepClick?.(i)}
              className="group w-full text-left disabled:cursor-default"
            >
              <div className="h-1.5 overflow-hidden rounded-full bg-ink/[0.07]">
                <motion.div
                  initial={false}
                  animate={{ width: done ? "100%" : active ? "50%" : "0%" }}
                  transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                  className="h-full rounded-full bg-brand-500"
                />
              </div>
              <span className="mt-2.5 hidden items-center gap-2 sm:flex">
                <span
                  className={cn(
                    "grid size-5 shrink-0 place-items-center rounded-full text-[10.5px] font-semibold transition-colors",
                    done && "bg-brand-500 text-snow",
                    active && "bg-brand-100 text-brand-700",
                    !done && !active && "bg-ink/[0.06] text-ink/50",
                  )}
                >
                  {i + 1}
                </span>
                <span
                  className={cn(
                    "truncate text-[12.5px] font-medium transition-colors",
                    active ? "text-ink" : done ? "text-ink/55" : "text-ink/50",
                  )}
                >
                  {s}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

/* --------------------------------- Loaders -------------------------------- */

/** A slow "breathing" loader — calm to wait with. */
export function OrbitLoader({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-5">
      <div className="relative grid size-16 place-items-center">
        <span className="absolute inset-0 animate-breathe rounded-full bg-brand-200/70" />
        <span className="absolute inset-3 animate-breathe rounded-full bg-brand-300/70 [animation-delay:0.4s]" />
        <span className="relative size-4 rounded-full bg-brand-500" />
      </div>
      {label && <p className="text-[14px] text-ink/62">{label}</p>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <span
      className={cn("block animate-shimmer rounded-xs bg-ink/[0.05]", className)}
      style={{
        backgroundImage:
          "linear-gradient(90deg, rgb(43 42 39/0.0) 0px, rgb(255 255 255/0.6) 120px, rgb(43 42 39/0.0) 240px)",
        backgroundSize: "800px 100%",
      }}
    />
  );
}

export function TypingDots({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-[3px]", className)}>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.22, ease: "easeInOut" }}
          className="block size-[6px] rounded-full bg-ink/50"
        />
      ))}
    </span>
  );
}

/* --------------------------------- Badges --------------------------------- */

const TONE: Record<StatusMeta["tone"], { chip: string; dot: string }> = {
  neutral: { chip: "bg-ink/[0.05] text-ink/65", dot: "bg-ink/35" },
  info: { chip: "bg-aqua-300/60 text-aqua-600", dot: "bg-aqua-500" },
  progress: { chip: "bg-brand-100 text-brand-700", dot: "bg-brand-500" },
  success: { chip: "bg-brand-100 text-positive", dot: "bg-positive" },
  warn: { chip: "bg-[#f7ecd6] text-caution", dot: "bg-caution" },
  danger: { chip: "bg-[#f5e3dd] text-critical", dot: "bg-critical" },
};

/** A soft pastel pill. The dot breathes (never blinks) when something is in motion. */
export function Badge({
  children,
  tone = "neutral",
  pulse,
  className,
  icon,
}: {
  children: React.ReactNode;
  tone?: StatusMeta["tone"];
  pulse?: boolean;
  className?: string;
  icon?: React.ReactNode;
}) {
  const t = TONE[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[12px] font-medium leading-none",
        t.chip,
        className,
      )}
    >
      {icon ? (
        <span className="[&>svg]:size-3.5">{icon}</span>
      ) : (
        <span className={cn("size-1.5 rounded-full", t.dot, pulse && "animate-breathe")} />
      )}
      {children}
    </span>
  );
}

/** Kept for compatibility: a gentle "active" marker (no broadcast red). */
export function LiveTag({ label = "Active", className }: { label?: string; className?: string }) {
  return (
    <Badge tone="progress" pulse className={className}>
      {label}
    </Badge>
  );
}

/* ---------------------------------- Card ---------------------------------- */

/** A white card on paper, lifting slightly on hover. */
export function SpotlightCard({
  children,
  className,
  as: As = "div",
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  glow,
  ...rest
}: {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
  glow?: boolean;
} & React.HTMLAttributes<HTMLElement>) {
  return (
    <As
      className={cn(
        "group relative overflow-hidden rounded-md material transition-shadow duration-500",
        "hover:shadow-[0_1px_2px_rgb(43_42_39/0.04),0_18px_40px_-18px_rgb(43_42_39/0.18)]",
        className,
      )}
      {...rest}
    >
      <div className="relative">{children}</div>
    </As>
  );
}

/** A featured card: white with a soft sage edge — for the thing that needs your attention. */
export function AuroraCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
  speed?: number;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border border-brand-200 bg-snow shadow-[0_0_0_4px_rgb(226_237_229/0.7),0_14px_36px_-18px_rgb(73_116_88/0.35)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

/* --------------------------------- CountUp -------------------------------- */

export function CountUp({
  to,
  suffix = "",
  duration = 1.8,
  className,
}: {
  to: number;
  suffix?: string;
  duration?: number;
  className?: string;
}) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const seen = React.useRef(false);
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { duration: duration * 1000, bounce: 0 });
  const [display, setDisplay] = React.useState(0);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !seen.current) {
          seen.current = true;
          mv.set(to);
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [mv, to]);

  React.useEffect(() => spring.on("change", (v) => setDisplay(Math.round(v))), [spring]);

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {display.toLocaleString()}
      {suffix}
    </span>
  );
}

/* ---------------------------------- Empty --------------------------------- */

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-ink/12 bg-snow/60 px-6 py-16 text-center">
      {icon && (
        <div className="mb-5 grid size-14 place-items-center rounded-full bg-brand-100 text-brand-600">
          <span className="[&>svg]:size-6">{icon}</span>
        </div>
      )}
      <h3 className="text-[16px] font-semibold text-ink">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-[14px] leading-relaxed text-ink/55">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

/* --------------------------------- Reveal --------------------------------- */

/** Slow, soft fade-in as content scrolls into view. */
export function Reveal({
  children,
  delay = 0,
  y = 16,
  className,
  once = true,
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  once?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, amount: 0.2 }}
      transition={{ duration: 1.1, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* --------------------------------- Toasts --------------------------------- */

type Toast = { id: string; title: string; description?: string; tone: StatusMeta["tone"] };
const ToastCtx = React.createContext<{ push: (t: Omit<Toast, "id">) => void } | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const push = React.useCallback((t: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { ...t, id }]);
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 5600);
  }, []);

  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[90] flex w-[min(23rem,calc(100vw-2.5rem))] flex-col gap-2">
        <AnimatePresence initial={false}>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, transition: { duration: 0.3 } }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="pointer-events-auto flex items-start gap-3 rounded-[18px] material px-4 py-3.5"
            >
              <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", TONE[t.tone].dot)} />
              <div className="min-w-0">
                <p className="text-[14px] font-semibold text-ink">{t.title}</p>
                {t.description && <p className="mt-0.5 text-[13px] leading-relaxed text-ink/60">{t.description}</p>}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = React.useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
