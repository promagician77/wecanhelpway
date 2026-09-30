import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, HandHeart, LifeBuoy, UserRound } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { PageShell } from "@/components/app/page-header";
import { AuroraCard, Reveal } from "@/components/ui/feedback";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Welcome" };

export default async function WelcomePage() {
  const { profile } = await requireUser();
  const firstName = profile.full_name?.split(" ")[0] ?? "there";

  const paths = [
    {
      href: "/needs/new",
      icon: LifeBuoy,
      title: "I need help",
      body: "Describe what's going on — even if you can't name it yet. A real person reads it and finds someone who can help.",
      cta: "Tell us what you need",
      primary: true,
    },
    {
      href: "/offers/new",
      icon: HandHeart,
      title: "I want to help",
      body: "Tell us what you'd gladly give an hour to. We'll bring you someone who needs exactly that.",
      cta: "Offer to help",
    },
    {
      href: "/profile",
      icon: UserRound,
      title: "Finish my profile",
      body: "A fuller profile means a better match. It takes about two minutes, and nothing is public.",
      cta: "Complete profile",
    },
  ];

  return (
    <PageShell className="max-w-4xl">
      <Reveal>
        <p className="text-[11.5px] font-semibold uppercase tracking-[0.16em] text-brand-700/80">
          You&apos;re in
        </p>
        <h1 className="mt-3 text-[2.2rem] font-semibold leading-[1.1] tracking-[-0.04em] text-ink sm:text-[2.8rem]">
          Welcome, <span className="text-gradient">{firstName}</span>.
        </h1>
        <p className="mt-4 max-w-xl text-[16px] leading-relaxed text-ink/62">
          There&apos;s no feed to scroll and no directory to browse. Just tell us what you need or
          what you can give, and we do the finding.
        </p>
      </Reveal>

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {paths.map((path, i) => (
          <Reveal key={path.href} delay={i * 0.1}>
            <Link href={path.href} className="block h-full">
              <AuroraCard className="h-full" speed={path.primary ? 6 : 14}>
                <div className="flex h-full flex-col p-6">
                  <span className="grid size-11 place-items-center rounded-sm border border-ink/[0.09] bg-ink/[0.04] text-brand-700">
                    <path.icon className="size-5" />
                  </span>
                  <h2 className="mt-5 text-[17px] font-semibold tracking-[-0.02em] text-ink">
                    {path.title}
                  </h2>
                  <p className="mt-2.5 flex-1 text-[13.5px] leading-relaxed text-ink/58">
                    {path.body}
                  </p>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-medium text-brand-700 transition-transform group-hover:translate-x-0.5">
                    {path.cta}
                    <ArrowRight className="size-3.5" />
                  </span>
                </div>
              </AuroraCard>
            </Link>
          </Reveal>
        ))}
      </div>

      <Reveal delay={0.3} className="mt-10">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-md glass p-6">
          <div>
            <h3 className="text-[15px] font-semibold text-ink/90">How this works, briefly</h3>
            <p className="mt-1.5 max-w-xl text-[13.5px] leading-relaxed text-ink/58">
              You submit. Our team reviews it personally and looks for someone. We propose a
              specific person to both of you. Only if you both say yes does a private conversation
              open. Nobody can contact you before that.
            </p>
          </div>
          <Link href="/dashboard">
            <Button size="md" variant="glass" iconRight={<ArrowRight />} magnetic={false}>
              Go to dashboard
            </Button>
          </Link>
        </div>
      </Reveal>
    </PageShell>
  );
}
