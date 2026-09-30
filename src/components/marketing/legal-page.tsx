import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "./logo";
import { AuroraBackdrop } from "@/components/ui/backdrop";

export interface LegalSection {
  heading: string;
  paragraphs: string[];
}

/** Shared chrome for the plain-language legal pages. */
export function LegalPage({
  title,
  updated,
  intro,
  sections,
}: {
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
}) {
  return (
    <div className="relative min-h-dvh">
      <AuroraBackdrop intensity={0.4} className="fixed" />

      <div className="mx-auto max-w-3xl px-5 py-12 sm:px-7 sm:py-16">
        <div className="flex items-center justify-between gap-4">
          <Link href="/">
            <Logo />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-full border border-ink/10 bg-ink/[0.03] px-3.5 py-2 text-[12.5px] font-medium text-ink/62 transition-all hover:border-ink/20 hover:text-ink"
          >
            <ArrowLeft className="size-3.5" />
            Back
          </Link>
        </div>

        <header className="mt-12">
          <h1 className="text-[2.3rem] font-semibold leading-tight tracking-[-0.04em] text-ink">
            {title}
          </h1>
          <p className="mt-3 font-mono text-[12px] text-ink/50">Last updated {updated}</p>
          <p className="mt-6 text-[16px] leading-relaxed text-ink/55">{intro}</p>
        </header>

        <div className="mt-12 space-y-10">
          {sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-[17px] font-semibold tracking-[-0.02em] text-ink">
                {section.heading}
              </h2>
              <div className="mt-3 space-y-3.5">
                {section.paragraphs.map((p, i) => (
                  <p key={i} className="text-[14.5px] leading-relaxed text-ink/62">
                    {p}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <p className="mt-16 border-t border-ink/[0.07] pt-8 text-[13px] leading-relaxed text-ink/50">
          This is a plain-language summary written for a Stage 1 product. Before you launch
          publicly, have a lawyer review it against the jurisdictions you operate in.
        </p>
      </div>
    </div>
  );
}
