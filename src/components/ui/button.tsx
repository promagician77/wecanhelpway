"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Spinner } from "./spinner";

type Variant = "primary" | "accent" | "aurora" | "glass" | "outline" | "ghost" | "danger" | "success";
type Size = "sm" | "md" | "lg" | "xl" | "icon";

/*
 * Calm, tactile buttons. Soft colour, gentle lift on hover, a small press on
 * click — nothing that flashes or chases the cursor.
 *   primary  — sage, the one thing we'd like you to do
 *   aurora   — white with a soft outline (the quiet second choice)
 */
const VARIANT: Record<Variant, string> = {
  primary: "skin-chrome hover:bg-brand-700 hover:border-brand-700",
  accent: "skin-accent hover:bg-brand-600 hover:border-brand-600",
  aurora:
    "bg-snow text-ink border border-ink/12 shadow-[0_1px_2px_rgb(43_42_39/0.05)] hover:border-brand-400 hover:text-brand-700",
  glass: "glass text-ink/85 hover:text-ink hover:bg-snow",
  outline: "bg-transparent text-ink/80 border border-ink/15 hover:border-brand-400 hover:text-brand-700 hover:bg-brand-50",
  ghost: "text-ink/65 hover:text-ink hover:bg-ink/[0.05]",
  danger: "skin-danger hover:brightness-95",
  success: "skin-success hover:brightness-95",
};

const SIZE: Record<Size, string> = {
  sm: "h-9 px-4 text-[13.5px] rounded-full",
  md: "h-11 px-5 text-[14.5px] rounded-full",
  lg: "h-12 px-6 text-[15px] rounded-full",
  xl: "h-14 px-8 text-[16px] rounded-full",
  icon: "h-10 w-10 rounded-full",
};

export interface ButtonProps extends Omit<React.ComponentProps<"button">, "ref"> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  /** Retained for API compatibility; unused in the calm style. */
  magnetic?: boolean;
  /** Retained for API compatibility; unused in the calm style. */
  sheen?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className,
    variant = "primary",
    size = "md",
    loading = false,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    magnetic,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    sheen,
    icon,
    iconRight,
    fullWidth,
    children,
    disabled,
    ...props
  },
  ref,
) {
  const isDisabled = disabled || loading;
  const onColour = variant === "primary" || variant === "accent" || variant === "danger" || variant === "success";

  return (
    <motion.button
      ref={ref}
      whileHover={isDisabled ? undefined : { y: -1 }}
      whileTap={isDisabled ? undefined : { scale: 0.98, y: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      disabled={isDisabled}
      className={cn(
        "group relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap",
        "font-medium tracking-[-0.005em] transition-colors duration-300",
        "disabled:pointer-events-none disabled:opacity-45",
        VARIANT[variant],
        SIZE[size],
        fullWidth && "w-full",
        className,
      )}
      {...(props as React.ComponentProps<typeof motion.button>)}
    >
      <span className={cn("inline-flex items-center gap-2", loading && "opacity-0")}>
        {icon && <span className="inline-flex shrink-0 [&>svg]:size-[1.05em]">{icon}</span>}
        {children}
        {iconRight && (
          <span className="inline-flex shrink-0 transition-transform duration-300 group-hover:translate-x-0.5 [&>svg]:size-[1.05em]">
            {iconRight}
          </span>
        )}
      </span>

      {loading && (
        <span className="absolute inset-0 grid place-items-center">
          <Spinner size={18} tone={onColour ? "light" : "dark"} />
        </span>
      )}
    </motion.button>
  );
});
