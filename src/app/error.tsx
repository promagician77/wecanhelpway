"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { AuroraBackdrop } from "@/components/ui/backdrop";
import { Logo } from "@/components/marketing/logo";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("[app:error]", error);
  }, [error]);

  return (
    <div className="relative grid min-h-dvh place-items-center overflow-hidden px-5">
      <AuroraBackdrop intensity={0.6} />

      <div className="relative max-w-md text-center">
        <Link href="/" className="inline-block">
          <Logo />
        </Link>

        <span className="mx-auto mt-12 grid size-16 place-items-center rounded-lg border border-critical/25 bg-critical/10 text-critical">
          <AlertTriangle className="size-7" />
        </span>

        <h1 className="mt-6 text-[1.6rem] font-semibold tracking-[-0.03em] text-ink">
          Something went wrong on our end
        </h1>
        <p className="mt-3 text-[14.5px] leading-relaxed text-ink/58">
          This is our fault, not yours. Try again — and if it keeps happening, tell us and
          we&apos;ll dig into it.
        </p>

        {error.digest && (
          <p className="mt-4 font-mono text-[11px] text-ink/50">Reference: {error.digest}</p>
        )}

        <div className="mt-8 flex flex-wrap justify-center gap-2.5">
          <Button size="md" icon={<RotateCcw />} onClick={reset}>
            Try again
          </Button>
          <Link href="/">
            <Button size="md" variant="glass" magnetic={false}>
              Back to the homepage
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
