import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-5", className)}>
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-2 text-[11.5px] font-semibold uppercase tracking-[0.16em] text-brand-700/80">
            {eyebrow}
          </p>
        )}
        <h1 className="text-[1.75rem] font-semibold leading-tight tracking-[-0.035em] text-ink sm:text-[2.1rem]">
          {title}
        </h1>
        {description && (
          <p className="mt-2.5 max-w-2xl text-[15px] leading-relaxed text-ink/58">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2.5">{actions}</div>}
    </div>
  );
}

/** Standard content well — keeps every page on the same rhythm. */
export function PageShell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("mx-auto w-full max-w-6xl px-5 py-8 sm:px-7 sm:py-10", className)}>{children}</div>
  );
}
