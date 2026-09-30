import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";
import { AuroraBackdrop, ParticleField } from "@/components/ui/backdrop";
import { Logo } from "@/components/marketing/logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="relative grid min-h-dvh place-items-center overflow-hidden px-5">
      <AuroraBackdrop />
      <ParticleField count={26} />

      <div className="relative max-w-md text-center">
        <Link href="/" className="inline-block">
          <Logo />
        </Link>

        <p className="mt-12 font-mono text-[6rem] font-semibold leading-none tracking-tighter text-gradient-brand">
          404
        </p>

        <h1 className="mt-4 text-[1.6rem] font-semibold tracking-[-0.03em] text-ink">
          This page isn&apos;t here
        </h1>
        <p className="mt-3 text-[14.5px] leading-relaxed text-ink/58">
          The link may be old, or the thing you&apos;re looking for might belong to someone else.
          Either way, nothing is broken on your side.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-2.5">
          <Link href="/">
            <Button size="md" icon={<ArrowLeft />}>
              Back to the homepage
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button size="md" variant="glass" magnetic={false} icon={<Compass />}>
              Go to my dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
