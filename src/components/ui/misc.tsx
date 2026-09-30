"use client";

import * as React from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { cn, hueFrom, initials } from "@/lib/utils";

/* --------------------------------- Avatar --------------------------------- */

export function Avatar({
  src,
  name,
  size = 40,
  online,
  ring,
  className,
}: {
  src?: string | null;
  name?: string | null;
  size?: number;
  online?: boolean;
  ring?: boolean;
  className?: string;
}) {
  const [broken, setBroken] = React.useState(false);
  const hue = hueFrom(name ?? "anon");
  const showImage = src && !broken;

  return (
    <span
      className={cn("relative inline-block shrink-0 align-middle", className)}
      style={{ width: size, height: size }}
    >
      {ring && (
        <span
          aria-hidden
          className="absolute -inset-[3px] rounded-full bg-snow shadow-[0_0_0_1px_rgb(159_192_170/0.8),0_2px_8px_rgb(43_42_39/0.08)]"
        />
      )}
      <span
        className="relative block size-full overflow-hidden rounded-full"
        style={
          showImage
            ? undefined
            : {
                background: `hsl(${hue} 38% 88%)`,
              }
        }
      >
        {showImage ? (
          <Image
            src={src}
            alt={name ?? "Profile photo"}
            width={size * 2}
            height={size * 2}
            onError={() => setBroken(true)}
            className="size-full object-cover"
            unoptimized={src.startsWith("blob:") || src.startsWith("data:")}
          />
        ) : (
          <span
            className="grid size-full place-items-center font-semibold text-ink/70"
            style={{ fontSize: Math.max(10, size * 0.38) }}
          >
            {initials(name)}
          </span>
        )}
      </span>
      {online !== undefined && (
        <span
          className={cn(
            "absolute bottom-0 right-0 block rounded-full border-2 border-snow",
            online ? "bg-positive" : "bg-ink/25",
          )}
          style={{ width: Math.max(9, size * 0.26), height: Math.max(9, size * 0.26) }}
        >
        </span>
      )}
    </span>
  );
}

/* --------------------------------- Modal ---------------------------------- */

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  const width = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-3xl" }[size];

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80] grid place-items-center overflow-y-auto p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-ink/20 backdrop-blur-[3px]"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className={cn("relative w-full rounded-lg bg-snow shadow-[0_30px_80px_-30px_rgb(43_42_39/0.35)]", width)}
          >
            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute right-4 top-4 grid size-8 place-items-center rounded-full text-ink/58 transition-colors hover:bg-ink/[0.08] hover:text-ink"
            >
              <X className="size-4" />
            </button>
            {(title || description) && (
              <div className="px-6 pt-6 sm:px-8 sm:pt-7">
                {title && (
                  <h2 className="pr-8 text-lg font-semibold tracking-[-0.02em] text-ink">{title}</h2>
                )}
                {description && (
                  <p className="mt-2 text-[14.5px] leading-relaxed text-ink/60">{description}</p>
                )}
              </div>
            )}
            {children && <div className="px-6 py-5 sm:px-8">{children}</div>}
            {footer && (
              <div className="flex flex-wrap justify-end gap-2.5 rounded-b-lg bg-paper/70 px-6 py-4 sm:px-8">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/* ---------------------------------- Tabs ---------------------------------- */

export function Tabs({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: { value: string; label: string; count?: number }[];
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  const layoutId = React.useId();
  return (
    <div
      className={cn(
        "no-scrollbar inline-flex max-w-full gap-0.5 overflow-x-auto rounded-full bg-ink/[0.05] p-1",
        className,
      )}
    >
      {tabs.map((t) => {
        const active = t.value === value;
        return (
          <button
            key={t.value}
            onClick={() => onChange(t.value)}
            className={cn(
              "relative shrink-0 rounded-full px-4 py-1.5 text-[13.5px] font-medium transition-colors duration-300",
              active ? "text-ink" : "text-ink/62 hover:text-ink/80",
            )}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                transition={{ type: "spring", stiffness: 300, damping: 32 }}
                className="absolute inset-0 rounded-full bg-snow shadow-[0_1px_3px_rgb(43_42_39/0.1)]"
              />
            )}
            <span className="relative flex items-center gap-1.5 whitespace-nowrap">
              {t.label}
              {t.count !== undefined && t.count > 0 && (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[11px] tabular-nums",
                    active ? "bg-brand-100 text-brand-700" : "bg-ink/[0.06] text-ink/58",
                  )}
                >
                  {t.count}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* -------------------------------- Tooltip --------------------------------- */

export function Tooltip({
  content,
  children,
  side = "top",
}: {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "bottom" | "right";
}) {
  const [open, setOpen] = React.useState(false);
  const pos = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  }[side];

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      <AnimatePresence>
        {open && (
          <motion.span
            initial={{ opacity: 0, scale: 0.92, y: side === "top" ? 4 : -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "pointer-events-none absolute z-50 whitespace-nowrap rounded-xs bg-ink px-2.5 py-1.5 text-[12px] font-medium text-snow",
              pos,
            )}
          >
            {content}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

/* -------------------------------- OTP input ------------------------------- */

export function OtpInput({
  length = 6,
  value,
  onChange,
  disabled,
}: {
  length?: number;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const refs = React.useRef<(HTMLInputElement | null)[]>([]);

  function setAt(i: number, char: string) {
    const next = value.split("");
    next[i] = char;
    onChange(next.join("").slice(0, length));
  }

  return (
    <div className="flex justify-center gap-2 sm:gap-2.5">
      {Array.from({ length }).map((_, i) => {
        const filled = Boolean(value[i]);
        return (
          <div key={i} className="relative">
            <input
              ref={(el) => {
                refs.current[i] = el;
              }}
              inputMode="numeric"
              autoComplete={i === 0 ? "one-time-code" : "off"}
              maxLength={1}
              disabled={disabled}
              value={value[i] ?? ""}
              onChange={(e) => {
                const char = e.target.value.replace(/\D/g, "").slice(-1);
                if (!char) return setAt(i, "");
                setAt(i, char);
                refs.current[i + 1]?.focus();
              }}
              onKeyDown={(e) => {
                if (e.key === "Backspace" && !value[i] && i > 0) {
                  refs.current[i - 1]?.focus();
                  setAt(i - 1, "");
                }
                if (e.key === "ArrowLeft") refs.current[i - 1]?.focus();
                if (e.key === "ArrowRight") refs.current[i + 1]?.focus();
              }}
              onPaste={(e) => {
                e.preventDefault();
                const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
                onChange(text);
                refs.current[Math.min(text.length, length - 1)]?.focus();
              }}
              className={cn(
                "relative size-12 rounded-sm well text-center font-mono text-xl text-ink outline-none transition-all duration-200 sm:size-14",
                filled && "border-brand-300 bg-brand-50",
                "focus:border-brand-400 focus:shadow-[0_0_0_4px_rgb(91_139_108/0.15)]",
              )}
            />
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------- Marquee ---------------------------------- */

export function Marquee({
  children,
  className,
  reverse,
}: {
  children: React.ReactNode;
  className?: string;
  reverse?: boolean;
}) {
  return (
    <div
      className={cn(
        "group relative flex overflow-hidden",
        "[mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]",
        className,
      )}
    >
      <div
        className="flex shrink-0 animate-marquee gap-4 pr-4 group-hover:[animation-play-state:paused]"
        style={reverse ? { animationDirection: "reverse" } : undefined}
      >
        {children}
        {children}
      </div>
    </div>
  );
}

/* ---------------------------- Rotating phrase ----------------------------- */

/**
 * The hero's changing phrase. It fades softly from one to the next — slow
 * enough to read, with no blinking cursor or typing noise.
 */
export function TypeCycle({
  phrases,
  className,
  holdMs = 3800,
}: {
  phrases: string[];
  className?: string;
  typeSpeed?: number;
  holdMs?: number;
}) {
  const [index, setIndex] = React.useState(0);

  React.useEffect(() => {
    const t = setInterval(() => setIndex((i) => (i + 1) % phrases.length), holdMs);
    return () => clearInterval(t);
  }, [phrases.length, holdMs]);

  return (
    <span className={cn("relative inline-grid", className)}>
      <AnimatePresence initial={false}>
        <motion.span
          key={index}
          initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          className="col-start-1 row-start-1 whitespace-nowrap"
        >
          {phrases[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
