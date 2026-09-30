import Link from "next/link";
import { ArrowLeft, Heart, Lock } from "lucide-react";
import { PhotoBackdrop } from "@/components/ui/backdrop";
import { Avatar } from "@/components/ui/misc";
import { Logo } from "@/components/marketing/logo";
import { FACES, IMAGES } from "@/lib/constants";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative grid min-h-dvh lg:grid-cols-[minmax(0,40rem)_1fr]">
      {/* ---------------------------------------------------------------- */}
      {/* Form half                                                         */}
      {/* ---------------------------------------------------------------- */}
      <main className="relative flex flex-col bg-paper">
        <header className="flex items-center justify-between p-5 sm:p-8">
          <Link href="/">
            <Logo />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[14px] font-medium text-ink/60 transition-colors hover:bg-ink/[0.05] hover:text-ink"
          >
            <ArrowLeft className="size-4" />
            Back
          </Link>
        </header>

        <div className="flex flex-1 items-center justify-center px-5 pb-16 sm:px-8">
          <div className="w-full max-w-[26.5rem]">{children}</div>
        </div>

        <p className="flex items-center justify-center gap-2 px-5 pb-8 text-[13.5px] text-ink/58">
          <Lock className="size-3.5 text-brand-600" />
          Private by default. Nobody can contact you without your consent.
        </p>
      </main>

      {/* ---------------------------------------------------------------- */}
      {/* Calm image half                                                   */}
      {/* ---------------------------------------------------------------- */}
      <aside className="relative isolate hidden overflow-hidden p-4 lg:block">
        <div className="relative isolate flex h-full flex-col justify-end overflow-hidden rounded-[32px] p-10 xl:p-14">
          <PhotoBackdrop
            src={IMAGES.forestPath}
            alt="A wooden footbridge leading into a quiet green forest"
            priority
            shade={0}
            tone="none"
          />
          <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/45 via-ink/5 to-transparent" />

          <figure className="max-w-md rounded-[26px] glass p-7">
            <Heart className="size-5 text-brand-600" />
            <blockquote className="mt-4 font-display text-[24px] italic leading-[1.4] text-ink/90">
              &ldquo;I wasn&apos;t sure what I needed. That turned out to be fine — they helped me figure it
              out.&rdquo;
            </blockquote>
            <figcaption className="mt-5 flex items-center gap-3">
              <Avatar src={FACES.omar} name="Omar" size={38} />
              <div>
                <p className="text-[14px] font-semibold text-ink">Omar</p>
                <p className="text-[13px] text-ink/60">Found his next step</p>
              </div>
            </figcaption>
          </figure>
        </div>
      </aside>
    </div>
  );
}
