"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Check, ChevronDown, Eye, EyeOff, X } from "lucide-react";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------------------
 * The shared shell every field sits inside: a soft white field with a gentle
 * that draws itself on focus, a floating label, and an error state that
 * nudges rather than shouts.
 * ------------------------------------------------------------------------- */

interface ShellProps {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  focused: boolean;
  filled: boolean;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
  /** Textareas need the label pinned to the top, not vertically centred. */
  alignTop?: boolean;
  trailing?: React.ReactNode;
  id?: string;
}

function FieldShell({
  label,
  error,
  hint,
  icon,
  focused,
  filled,
  disabled,
  className,
  children,
  alignTop,
  trailing,
  id,
}: ShellProps) {
  const lifted = focused || filled;

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "group relative flex rounded-[14px] well transition-[border-color,box-shadow,background-color] duration-300",
          "hover:border-ink/[0.16]",
          focused &&
            "border-brand-400 shadow-[0_0_0_4px_rgb(91_139_108/0.14)] hover:border-brand-400",
          error &&
            "border-critical/60 shadow-[0_0_0_4px_rgb(184_90_68/0.1)] hover:border-critical/60",
          disabled && "opacity-50",
          alignTop ? "items-start" : "items-center",
        )}
      >
        {icon && (
          <span
            className={cn(
              "pointer-events-none flex w-11 shrink-0 justify-center text-ink/50 transition-colors duration-200",
              alignTop ? "h-12 items-center pt-1" : "items-center self-stretch",
              focused && "text-brand-700",
              error && "text-critical",
            )}
          >
            <span className="flex [&>svg]:size-[17px]">{icon}</span>
          </span>
        )}

        <div className={cn("relative min-w-0 flex-1", !icon && "pl-4")}>
          {label && (
            <motion.label
              htmlFor={id}
              initial={false}
              animate={{
                y: lifted ? (alignTop ? 6 : -9) : alignTop ? 16 : 0,
                scale: lifted ? 0.8 : 1,
              }}
              transition={{ type: "spring", stiffness: 500, damping: 36 }}
              className={cn(
                "pointer-events-none absolute left-0 top-1/2 origin-left -translate-y-1/2 text-[14.5px] tracking-[-0.01em] transition-colors",
                lifted ? "font-medium text-ink/58" : "text-ink/58",
                alignTop && "top-0 translate-y-0",
                focused && "text-brand-700",
                error && "text-critical",
              )}
            >
              {label}
            </motion.label>
          )}
          {children}
        </div>

        {trailing && <div className="flex shrink-0 items-center pr-2">{trailing}</div>}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {(error || hint) && (
          <motion.p
            key={error ? `e-${error}` : "hint"}
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -4, height: 0 }}
            transition={{ duration: 0.18 }}
            className={cn(
              "mt-1.5 flex items-start gap-1.5 overflow-hidden pl-1 text-[12px] leading-relaxed",
              error ? "text-critical" : "text-ink/58",
            )}
          >
            {error && <AlertCircle className="mt-px size-3.5 shrink-0" />}
            <span>{error ?? hint}</span>
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

/* --------------------------------- Input --------------------------------- */

export interface InputProps extends Omit<React.ComponentProps<"input">, "size"> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  wrapperClassName?: string;
  trailing?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, icon, className, wrapperClassName, trailing, onFocus, onBlur, ...props },
  ref,
) {
  const [focused, setFocused] = React.useState(false);
  const [filled, setFilled] = React.useState(
    Boolean(props.value ?? props.defaultValue ?? props.placeholder),
  );
  const autoId = React.useId();
  const id = props.id ?? autoId;

  React.useEffect(() => {
    if (props.value !== undefined) setFilled(Boolean(props.value) || Boolean(props.placeholder));
  }, [props.value, props.placeholder]);

  return (
    <FieldShell
      id={id}
      label={label}
      error={error}
      hint={hint}
      icon={icon}
      focused={focused}
      filled={filled}
      disabled={props.disabled}
      className={wrapperClassName}
      trailing={trailing}
    >
      <input
        ref={ref}
        id={id}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          setFilled(Boolean(e.target.value) || Boolean(props.placeholder));
          onBlur?.(e);
        }}
        onChange={(e) => {
          setFilled(Boolean(e.target.value) || Boolean(props.placeholder));
          props.onChange?.(e);
        }}
        className={cn(
          "peer w-full bg-transparent pr-4 text-[15px] text-ink/95 outline-none",
          "placeholder:text-ink/40 disabled:cursor-not-allowed",
          label ? "h-14 pt-5 pb-1.5" : "h-12",
          className,
        )}
        {...props}
      />
    </FieldShell>
  );
});

/* ------------------------------- Password -------------------------------- */

export const PasswordInput = React.forwardRef<HTMLInputElement, InputProps & { showMeter?: boolean }>(
  function PasswordInput({ showMeter, onChange, ...props }, ref) {
    const [visible, setVisible] = React.useState(false);
    const [value, setValue] = React.useState(String(props.defaultValue ?? ""));
    const score = passwordScore(value);

    return (
      <div className="w-full">
        <Input
          ref={ref}
          {...props}
          type={visible ? "text" : "password"}
          onChange={(e) => {
            setValue(e.target.value);
            onChange?.(e);
          }}
          trailing={
            <button
              type="button"
              tabIndex={-1}
              aria-label={visible ? "Hide password" : "Show password"}
              onClick={() => setVisible((v) => !v)}
              className="grid size-9 place-items-center rounded-2xs text-ink/58 transition-colors hover:bg-ink/[0.07] hover:text-ink/80"
            >
              {visible ? <EyeOff className="size-[17px]" /> : <Eye className="size-[17px]" />}
            </button>
          }
        />
        {showMeter && (
          <AnimatePresence initial={false}>
            {value.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-2.5 flex items-center gap-2 pl-1">
                  <div className="flex flex-1 gap-1">
                    {[0, 1, 2, 3].map((i) => (
                      <motion.span
                        key={i}
                        initial={false}
                        animate={{
                          backgroundColor:
                            i < score.level
                              ? ["#ff453a", "#ffd60a", "#5c9bff", "#30d158"][score.level - 1]
                              : "rgba(255,255,255,0.09)",
                        }}
                        transition={{ duration: 0.3 }}
                        className="h-1 flex-1 rounded-full"
                      />
                    ))}
                  </div>
                  <span className="w-20 text-right text-[11px] font-medium text-ink/58">
                    {score.label}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    );
  },
);

export function passwordScore(pw: string) {
  let level = 0;
  if (pw.length >= 8) level++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) level++;
  if (/\d/.test(pw)) level++;
  if (/[^A-Za-z0-9]/.test(pw) && pw.length >= 12) level++;
  const labels = ["Too short", "Weak", "Fair", "Good", "Strong"];
  return { level, label: labels[level] };
}

/* ------------------------------- Textarea -------------------------------- */

export interface TextareaProps extends React.ComponentProps<"textarea"> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  maxChars?: number;
  wrapperClassName?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, hint, icon, className, maxChars, wrapperClassName, onFocus, onBlur, onChange, ...props },
  ref,
) {
  const [focused, setFocused] = React.useState(false);
  const [count, setCount] = React.useState(String(props.defaultValue ?? props.value ?? "").length);
  const autoId = React.useId();
  const id = props.id ?? autoId;

  return (
    <FieldShell
      id={id}
      label={label}
      error={error}
      hint={hint}
      icon={icon}
      focused={focused}
      filled={count > 0 || Boolean(props.placeholder)}
      disabled={props.disabled}
      className={wrapperClassName}
      alignTop
    >
      <textarea
        ref={ref}
        id={id}
        rows={props.rows ?? 4}
        maxLength={maxChars}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        onChange={(e) => {
          setCount(e.target.value.length);
          onChange?.(e);
        }}
        className={cn(
          "w-full resize-y bg-transparent pr-4 text-[15px] leading-relaxed text-ink/95 outline-none",
          "placeholder:text-ink/40",
          label ? "pt-7 pb-3" : "py-3.5",
          className,
        )}
        {...props}
      />
      {maxChars && (
        <span
          className={cn(
            "pointer-events-none absolute bottom-2 right-3 font-mono text-[10px] tabular-nums transition-colors",
            count > maxChars * 0.9 ? "text-caution" : "text-ink/50",
          )}
        >
          {count}/{maxChars}
        </span>
      )}
    </FieldShell>
  );
});

/* -------------------------------- Select --------------------------------- */

export interface SelectProps extends React.ComponentProps<"select"> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  placeholder?: string;
  wrapperClassName?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, hint, icon, className, children, placeholder, wrapperClassName, onFocus, onBlur, onChange, ...props },
  ref,
) {
  const [focused, setFocused] = React.useState(false);
  const [filled, setFilled] = React.useState(Boolean(props.value ?? props.defaultValue));
  const autoId = React.useId();
  const id = props.id ?? autoId;

  React.useEffect(() => {
    if (props.value !== undefined) setFilled(Boolean(props.value));
  }, [props.value]);

  return (
    <FieldShell
      id={id}
      label={label}
      error={error}
      hint={hint}
      icon={icon}
      focused={focused}
      filled={filled}
      disabled={props.disabled}
      className={wrapperClassName}
      trailing={
        <ChevronDown
          className={cn(
            "mr-1 size-4 text-ink/50 transition-transform duration-300",
            focused && "rotate-180 text-brand-700",
          )}
        />
      }
    >
      <select
        ref={ref}
        id={id}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        onChange={(e) => {
          setFilled(Boolean(e.target.value));
          onChange?.(e);
        }}
        className={cn(
          "w-full cursor-pointer appearance-none bg-transparent pr-2 text-[15px] text-ink/95 outline-none",
          "[&>option]:bg-slate-deep [&>option]:text-ink",
          label ? "h-14 pt-5 pb-1.5" : "h-12",
          className,
        )}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {children}
      </select>
    </FieldShell>
  );
});

/* ------------------------------ Tag input -------------------------------- */

export function TagInput({
  label,
  value,
  onChange,
  suggestions = [],
  placeholder = "Type and press Enter",
  icon,
  max = 20,
  hint,
  name,
}: {
  label?: string;
  value: string[];
  onChange: (next: string[]) => void;
  suggestions?: readonly string[];
  placeholder?: string;
  icon?: React.ReactNode;
  max?: number;
  hint?: string;
  name?: string;
}) {
  const [draft, setDraft] = React.useState("");
  const [focused, setFocused] = React.useState(false);

  const available = React.useMemo(() => {
    const q = draft.trim().toLowerCase();
    return suggestions
      .filter((s) => !value.includes(s) && (!q || s.toLowerCase().includes(q)))
      .slice(0, 6);
  }, [draft, suggestions, value]);

  function add(tag: string) {
    const t = tag.trim();
    if (!t || value.includes(t) || value.length >= max) return;
    onChange([...value, t]);
    setDraft("");
  }

  return (
    <div className="w-full">
      {name && <input type="hidden" name={name} value={value.join(",")} />}
      <FieldShell
        label={label}
        icon={icon}
        focused={focused}
        filled={value.length > 0 || draft.length > 0}
        hint={hint}
        alignTop
      >
        <div className={cn("flex flex-wrap items-center gap-1.5 pr-3", label ? "pt-7 pb-3" : "py-3")}>
          <AnimatePresence initial={false}>
            {value.map((tag) => (
              <motion.span
                key={tag}
                layout
                initial={{ opacity: 0, scale: 0.7, y: 4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.7 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="inline-flex items-center gap-1 rounded-full border border-ink/12 bg-brand-50 py-1 pl-2.5 pr-1 text-[12.5px] font-medium text-ink/85 shadow-[inset_0_1px_0_rgb(255_255_255/0.08)]"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => onChange(value.filter((t) => t !== tag))}
                  className="grid size-4 place-items-center rounded-full text-ink/58 transition-colors hover:bg-ink/15 hover:text-ink"
                  aria-label={`Remove ${tag}`}
                >
                  <X className="size-3" />
                </button>
              </motion.span>
            ))}
          </AnimatePresence>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => {
              // Delay so a suggestion click still registers.
              setTimeout(() => setFocused(false), 140);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                add(draft);
              } else if (e.key === "Backspace" && !draft && value.length) {
                onChange(value.slice(0, -1));
              }
            }}
            placeholder={value.length ? "" : placeholder}
            className="min-w-[8ch] flex-1 bg-transparent text-[15px] text-ink/95 outline-none placeholder:text-ink/40"
          />
        </div>
      </FieldShell>

      <AnimatePresence>
        {focused && available.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="mt-2 flex flex-wrap gap-1.5"
          >
            {available.map((s) => (
              <button
                key={s}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => add(s)}
                className="rounded-full border border-ink/10 bg-ink/[0.03] px-2.5 py-1 text-[12px] text-ink/62 transition-all hover:border-ink/25 hover:bg-ink/[0.08] hover:text-ink"
              >
                + {s}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------- Checkbox -------------------------------- */

export function Checkbox({
  checked,
  onChange,
  label,
  description,
  name,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: React.ReactNode;
  description?: string;
  name?: string;
}) {
  return (
    <label className="group flex cursor-pointer items-start gap-3">
      {name && <input type="hidden" name={name} value={checked ? "on" : ""} />}
      <span
        onClick={(e) => {
          e.preventDefault();
          onChange(!checked);
        }}
        className={cn(
          "relative mt-0.5 grid size-5 shrink-0 place-items-center rounded-[7px] border transition-all duration-300",
          checked
            ? "skin-accent"
            : "well group-hover:border-brand-400",
        )}
      >
        <motion.span
          initial={false}
          animate={{ scale: checked ? 1 : 0, opacity: checked ? 1 : 0 }}
          transition={{ type: "spring", stiffness: 600, damping: 26 }}
        >
          <Check className="size-3.5 text-snow" strokeWidth={3} />
        </motion.span>
      </span>
      <span className="min-w-0">
        <span className="block text-sm leading-snug text-ink/80 transition-colors group-hover:text-ink">
          {label}
        </span>
        {description && <span className="mt-0.5 block text-xs text-ink/58">{description}</span>}
      </span>
    </label>
  );
}

/* --------------------------------- Switch -------------------------------- */

export function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-11 rounded-full border transition-all duration-300",
          checked
            ? "border-transparent bg-brand-500"
            : "border-transparent bg-ink/[0.12]",
        )}
      >
        <motion.span
          layout
          transition={{ type: "spring", stiffness: 640, damping: 36 }}
          className={cn(
            "absolute top-0.5 size-5 rounded-full bg-snow shadow-[0_1px_3px_rgb(43_42_39/0.2)]",
            checked ? "left-[22px]" : "left-0.5",
          )}
        />
      </button>
      {label && <span className="text-sm text-ink/70">{label}</span>}
    </label>
  );
}
