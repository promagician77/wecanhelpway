import { cn } from "@/lib/utils";

/**
 * Twelve-blade activity indicator — the system spinner people already read as
 * "working", rather than a decorative ring.
 */
export function Spinner({
  size = 20,
  tone = "accent",
  className,
}: {
  size?: number;
  tone?: "light" | "dark" | "accent";
  className?: string;
}) {
  const color = { light: "#ffffff", dark: "#2b2a27", accent: "var(--color-brand-500)" }[tone];

  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn("relative inline-block shrink-0", className)}
      style={{ width: size, height: size }}
    >
      {Array.from({ length: 12 }).map((_, i) => (
        <span
          key={i}
          className="absolute left-1/2 top-0 origin-[50%_100%]"
          style={{
            width: Math.max(1.5, size * 0.09),
            height: size / 2,
            marginLeft: -Math.max(1.5, size * 0.09) / 2,
            transform: `rotate(${i * 30}deg)`,
          }}
        >
          <span
            className="block rounded-full"
            style={{
              height: "52%",
              background: color,
              animation: "spinner-blade 1.3s linear infinite",
              animationDelay: `${((i - 12) / 12) * 1.3}s`,
            }}
          />
        </span>
      ))}
    </span>
  );
}
