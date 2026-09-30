"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  Compass,
  EyeOff,
  HandHeart,
  Heart,
  Lock,
  MessageCircleHeart,
  PenLine,
  Search,
  ShieldCheck,
  Sprout,
  UserCheck,
  Users,
} from "lucide-react";
import { Reveal } from "@/components/ui/feedback";
import { Avatar } from "@/components/ui/misc";
import { PhotoBackdrop } from "@/components/ui/backdrop";
import { Button } from "@/components/ui/button";
import { FACES, IMAGES } from "@/lib/constants";
import { cn } from "@/lib/utils";

/* ========================================================================== */
/* Shared                                                                     */
/* ========================================================================== */

function Eyebrow({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <p className="inline-flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.12em] text-brand-600">
      {icon && <span className="[&>svg]:size-4">{icon}</span>}
      {children}
    </p>
  );
}

function Heading({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h2
      className={cn(
        "mt-4 text-[2.2rem] font-semibold leading-[1.1] tracking-[-0.03em] text-ink sm:text-[2.9rem]",
        className,
      )}
    >
      {children}
    </h2>
  );
}

function Soft({ children }: { children: React.ReactNode }) {
  return <span className="font-display font-normal italic text-brand-600">{children}</span>;
}

/* ========================================================================== */
/* How it works                                                               */
/* ========================================================================== */

const STEPS = [
  { icon: PenLine, title: "Tell us what's going on", body: "In your own words, at your own pace. “I'm not sure what I need” is a perfectly good answer." },
  { icon: UserCheck, title: "A real person reads it", body: "Someone on our team reads every request with care, and asks a kind question if something's unclear." },
  { icon: Search, title: "We look for the right person", body: "We quietly search our community for someone whose experience fits what you're going through." },
  { icon: Users, title: "You both say yes", body: "We introduce you, and explain why. Either of you can say no — privately, with no hard feelings." },
  { icon: MessageCircleHeart, title: "You start talking", body: "A private one-to-one conversation opens. Take it at whatever pace feels right." },
];

export function HowItWorks() {
  return (
    <section id="how" className="relative scroll-mt-24 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-5 sm:px-7">
        <Reveal className="mx-auto max-w-2xl text-center">
          <Eyebrow icon={<Compass />}>How it works</Eyebrow>
          <Heading>
            Five gentle steps. <Soft>No rush.</Soft>
          </Heading>
          <p className="mt-5 text-[17px] leading-[1.7] text-ink/65">
            There are no forms to get &ldquo;right&rdquo; and nothing to compete for. You share what&apos;s
            happening, and we take it from there — with you, not for you.
          </p>
        </Reveal>

        <ol className="relative mt-16 grid gap-10 md:grid-cols-5 md:gap-5">
          {/* The dotted path that joins the steps. */}
          <span
            aria-hidden
            className="absolute left-[10%] right-[10%] top-8 hidden border-t-2 border-dashed border-brand-200 md:block"
          />
          {STEPS.map((step, i) => (
            <li key={step.title} className="relative">
              <Reveal delay={i * 0.12} className="flex h-full flex-col items-center text-center">
                <span className="relative grid size-16 place-items-center rounded-full bg-snow text-brand-600 shadow-[0_0_0_6px_var(--color-paper),0_6px_20px_-8px_rgb(73_116_88/0.4)]">
                  <step.icon className="size-6" strokeWidth={1.8} />
                  <span className="absolute -right-1 -top-1 grid size-6 place-items-center rounded-full bg-brand-500 text-[11.5px] font-semibold text-snow">
                    {i + 1}
                  </span>
                </span>
                <h3 className="mt-5 text-[16px] font-semibold text-ink">{step.title}</h3>
                <p className="mt-2 max-w-[15rem] text-[14px] leading-relaxed text-ink/60">{step.body}</p>
              </Reveal>
            </li>
          ))}
        </ol>

        <Reveal delay={0.3}>
          <div className="mx-auto mt-16 flex max-w-3xl flex-col items-center gap-4 rounded-[26px] bg-brand-50 px-7 py-6 text-center sm:flex-row sm:text-left">
            <span className="grid size-12 shrink-0 place-items-center rounded-full bg-snow text-brand-600">
              <Heart className="size-5" />
            </span>
            <p className="text-[15.5px] leading-relaxed text-ink/75">
              <span className="font-semibold text-ink">Not sure where to begin?</span> That&apos;s where
              most people start. Tell us a little about your situation and we&apos;ll help you work out
              the rest.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ========================================================================== */
/* Two paths                                                                  */
/* ========================================================================== */

export function TwoDoors() {
  return (
    <section className="relative py-12 sm:py-16">
      <div className="mx-auto grid max-w-6xl gap-6 px-5 sm:px-7 lg:grid-cols-2">
        <Reveal className="h-full">
          <PathCard
            id="need"
            image={IMAGES.journaling}
            imageAlt="Someone writing in a notebook beside a cup of coffee, in soft daylight"
            kicker="If you need help"
            icon={<Sprout className="size-4" />}
            title={
              <>
                Start with a few honest words. <Soft>We&apos;ll listen.</Soft>
              </>
            }
            body="Looking for work, trying to make ends meet, stuck on what comes next — whatever it is, it's welcome here. You don't need the right words."
            examples={["Finding a job or changing careers", "Getting through a difficult month", "Learning a skill to move forward"]}
            cta={{ href: "/sign-up", label: "Ask for help" }}
            primary
          />
        </Reveal>
        <Reveal delay={0.12} className="h-full">
          <PathCard
            id="offer"
            image={IMAGES.helpingGroup}
            imageAlt="A small group gathered around a laptop, helping one another"
            kicker="If you'd like to help"
            icon={<HandHeart className="size-4" />}
            title={
              <>
                An hour of what you know <Soft>can change someone&apos;s year.</Soft>
              </>
            }
            body="You don't need to be an expert — just a step ahead. We'll introduce you to one person at a time, and you always decide."
            examples={["Reviewing a CV or practising an interview", "Mentoring someone learning your trade", "Simply listening and encouraging"]}
            cta={{ href: "/sign-up?intent=help", label: "Offer your help" }}
          />
        </Reveal>
      </div>
    </section>
  );
}

function PathCard({
  id,
  image,
  imageAlt,
  kicker,
  icon,
  title,
  body,
  examples,
  cta,
  primary,
}: {
  id: string;
  image: string;
  imageAlt: string;
  kicker: string;
  icon: React.ReactNode;
  title: React.ReactNode;
  body: string;
  examples: string[];
  cta: { href: string; label: string };
  primary?: boolean;
}) {
  return (
    <article id={id} className="group flex h-full scroll-mt-28 flex-col overflow-hidden rounded-[30px] material">
      <div className="relative m-2.5 mb-0 h-64 overflow-hidden rounded-[22px] sm:h-72">
        <Image
          src={image}
          alt={imageAlt}
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover transition-transform duration-[3s] ease-out group-hover:scale-[1.03]"
        />
      </div>

      <div className="flex flex-1 flex-col p-7 sm:p-9">
        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-brand-50 px-3 py-1.5 text-[13px] font-medium text-brand-700">
          {icon}
          {kicker}
        </span>
        <h3 className="mt-5 text-[1.7rem] font-semibold leading-[1.2] tracking-[-0.025em] text-ink sm:text-[1.9rem]">
          {title}
        </h3>
        <p className="mt-4 text-[16px] leading-[1.7] text-ink/65">{body}</p>

        <ul className="mt-6 space-y-2.5">
          {examples.map((e) => (
            <li key={e} className="flex items-center gap-3 text-[15px] text-ink/75">
              <span className="grid size-5 shrink-0 place-items-center rounded-full bg-brand-100 text-brand-600">
                <Check className="size-3" strokeWidth={3} />
              </span>
              {e}
            </li>
          ))}
        </ul>

        <Link href={cta.href} className="mt-auto inline-block pt-8">
          <Button size="lg" variant={primary ? "primary" : "aurora"} iconRight={<ArrowRight />}>
            {cta.label}
          </Button>
        </Link>
      </div>
    </article>
  );
}

/* ========================================================================== */
/* Peace of mind — you always know where things stand                        */
/* ========================================================================== */

const JOURNEY = [
  { label: "Received", body: "We have your request. Nothing more is needed from you." },
  { label: "Being read", body: "Someone on our team is reading it carefully." },
  { label: "Looking for the right person", body: "We're searching our community for a good fit." },
  { label: "Introduction suggested", body: "We found someone. You can take your time to decide." },
  { label: "Connected", body: "You both said yes. Your private conversation is open." },
];

export function StatusTransparency() {
  const [active, setActive] = React.useState(2);

  React.useEffect(() => {
    const t = setInterval(() => setActive((a) => (a + 1) % JOURNEY.length), 4200);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="relative isolate overflow-hidden py-28 sm:py-36">
      <PhotoBackdrop
        src={IMAGES.lakeCalm}
        alt="A person sitting quietly at the end of a wooden dock on a still mountain lake"
        shade={0.12}
        position="center 55%"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgb(247_245_240/0.9)_0%,rgb(247_245_240/0.7)_40%,rgb(247_245_240/0.1)_75%)]"
      />

      <div className="mx-auto max-w-6xl px-5 sm:px-7">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <Eyebrow icon={<ShieldCheck />}>Peace of mind</Eyebrow>
            <Heading>
              You&apos;ll always know <Soft>where things stand.</Soft>
            </Heading>
            <p className="mt-6 max-w-md text-[17px] leading-[1.7] text-ink/70">
              Waiting is hard enough. Every request shows you, in plain words, what&apos;s happening and
              what comes next — and we&apos;ll send you a gentle note whenever something changes.
            </p>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="rounded-[28px] glass-strong p-7">
              <p className="text-[13px] font-medium text-ink/62">Your request</p>
              <p className="mt-1 text-[16px] font-semibold text-ink">&ldquo;I&apos;d like help finding steady work.&rdquo;</p>

              <ol className="mt-7 space-y-1">
                {JOURNEY.map((step, i) => {
                  const done = i < active;
                  const isActive = i === active;
                  return (
                    <li
                      key={step.label}
                      className={cn(
                        "flex gap-4 rounded-2xl px-3 py-2.5 transition-colors duration-700",
                        isActive && "bg-brand-50",
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 grid size-6 shrink-0 place-items-center rounded-full transition-colors duration-700",
                          done && "bg-brand-500 text-snow",
                          isActive && "bg-snow text-brand-600 shadow-[0_0_0_2px_var(--color-brand-400)]",
                          !done && !isActive && "bg-ink/[0.07] text-transparent",
                        )}
                      >
                        {isActive ? (
                          <span className="size-2 animate-breathe rounded-full bg-brand-500" />
                        ) : (
                          <Check className="size-3.5" strokeWidth={3} />
                        )}
                      </span>
                      <div className="min-w-0">
                        <p
                          className={cn(
                            "text-[15px] transition-colors duration-700",
                            isActive ? "font-semibold text-ink" : done ? "text-ink/70" : "text-ink/58",
                          )}
                        >
                          {step.label}
                        </p>
                        <AnimatePresence initial={false}>
                          {isActive && (
                            <motion.p
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                              className="overflow-hidden pt-0.5 text-[14px] leading-relaxed text-ink/60"
                            >
                              {step.body}
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ========================================================================== */
/* Small steps — for people working hard toward something                     */
/* ========================================================================== */

export function SmallSteps() {
  return (
    <section className="relative py-24 sm:py-32">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 sm:px-7 lg:grid-cols-2">
        <Reveal>
          <div className="relative aspect-[5/4] overflow-hidden rounded-[30px] shadow-[0_30px_60px_-30px_rgb(43_42_39/0.35)]">
            <Image
              src={IMAGES.seedlings}
              alt="Rows of young seedlings growing in small pots"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </Reveal>

        <Reveal delay={0.12}>
          <Eyebrow icon={<Sprout />}>For the ones working hard</Eyebrow>
          <Heading>
            Small steps still count. <Soft>Especially now.</Soft>
          </Heading>
          <p className="mt-6 text-[17px] leading-[1.7] text-ink/70">
            If you&apos;re putting in the work — applying, studying, building, starting over — you
            deserve someone in your corner. We connect you with people who&apos;ve walked a similar
            road and are glad to share what they learned.
          </p>

          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {[
              { t: "Encouragement", d: "Someone who believes you can get there." },
              { t: "Practical guidance", d: "CVs, interviews, plans and next steps." },
              { t: "Skills, shared", d: "Learn from people who do it every day." },
              { t: "At your pace", d: "No deadlines. No one keeping score." },
            ].map((item) => (
              <li key={item.t} className="rounded-2xl material p-4">
                <p className="text-[15px] font-semibold text-ink">{item.t}</p>
                <p className="mt-1 text-[14px] leading-relaxed text-ink/60">{item.d}</p>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}

/* ========================================================================== */
/* Stories                                                                    */
/* ========================================================================== */

const STORIES = [
  { face: FACES.amara, name: "Amara", role: "Looking for work after a layoff", quote: "I'd been applying for months and felt invisible. One conversation about my CV changed how I saw myself." },
  { face: FACES.marco, name: "Marco", role: "New to the country", quote: "I didn't know which office, which form, which queue. Someone kindly walked me through it in an hour." },
  { face: FACES.priya, name: "Priya", role: "Learning to code in the evenings", quote: "I didn't need another course. I needed one patient person who'd answer my questions." },
  { face: FACES.omar, name: "Omar", role: "Wasn't sure what he needed", quote: "I ticked 'I'm not sure'. Two gentle questions later, I could finally see the shape of it." },
  { face: FACES.elena, name: "Elena", role: "Mentors on weekends", quote: "I nearly didn't sign up — I thought I wasn't experienced enough. I was exactly one step ahead." },
  { face: FACES.sarah, name: "Sarah", role: "Starting a small business", quote: "It felt like having a friend who'd done it before. I stopped feeling like I was guessing." },
];

export function Stories() {
  return (
    <section id="stories" className="relative scroll-mt-24 bg-sand/70 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-5 sm:px-7">
        <Reveal className="mx-auto max-w-2xl text-center">
          <Eyebrow icon={<Heart />}>Stories</Eyebrow>
          <Heading>
            One person, <Soft>helping another.</Soft>
          </Heading>
          <p className="mt-5 text-[16px] leading-[1.7] text-ink/60">
            Illustrative stories of the kinds of connection WeCanHelpWay is here for.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {STORIES.map((s, i) => (
            <Reveal key={s.name} delay={(i % 3) * 0.1}>
              <figure className="flex h-full flex-col rounded-[26px] bg-snow p-7 shadow-[0_1px_2px_rgb(43_42_39/0.04),0_14px_34px_-20px_rgb(43_42_39/0.2)]">
                <span aria-hidden className="font-display text-[48px] leading-none text-brand-300">
                  &ldquo;
                </span>
                <blockquote className="-mt-3 flex-1 text-[16px] leading-[1.7] text-ink/80">{s.quote}</blockquote>
                <figcaption className="mt-6 flex items-center gap-3">
                  <Avatar src={s.face} name={s.name} size={42} />
                  <div>
                    <p className="text-[14.5px] font-semibold text-ink">{s.name}</p>
                    <p className="text-[13px] text-ink/55">{s.role}</p>
                  </div>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ========================================================================== */
/* A safe place                                                               */
/* ========================================================================== */

const PROMISES = [
  { icon: Lock, title: "Private by default", body: "There's no public profile and nothing anyone can browse. Your story stays yours." },
  { icon: ShieldCheck, title: "Nobody contacts you out of the blue", body: "A conversation only opens when you've both agreed to it." },
  { icon: UserCheck, title: "Real people, not algorithms", body: "Someone on our team chooses every introduction, and tells you why." },
  { icon: EyeOff, title: "No feed, no pressure", body: "No likes, no followers, no one keeping score. Just help, when you want it." },
];

export function Principles() {
  return (
    <section className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-5 sm:px-7">
        <Reveal className="mx-auto max-w-2xl text-center">
          <Eyebrow icon={<ShieldCheck />}>A safe place</Eyebrow>
          <Heading>
            Asking for help should never <Soft>feel exposing.</Soft>
          </Heading>
        </Reveal>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PROMISES.map((p, i) => (
            <Reveal key={p.title} delay={i * 0.1}>
              <div className="h-full rounded-[26px] material p-7">
                <span className="grid size-12 place-items-center rounded-full bg-brand-50 text-brand-600">
                  <p.icon className="size-5" strokeWidth={1.8} />
                </span>
                <h3 className="mt-5 text-[16px] font-semibold text-ink">{p.title}</h3>
                <p className="mt-2 text-[14.5px] leading-relaxed text-ink/60">{p.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ========================================================================== */
/* Closing invitation                                                         */
/* ========================================================================== */

export function FinalCta() {
  return (
    <section className="relative isolate overflow-hidden px-5 py-28 sm:px-7 sm:py-36">
      <PhotoBackdrop
        src={IMAGES.poppies}
        alt="Golden poppies in sunlight against a clear blue sky"
        shade={0.14}
        position="center 60%"
      />

      <Reveal className="mx-auto max-w-2xl">
        <div className="rounded-[34px] glass-strong px-7 py-12 text-center sm:px-12">
          <h2 className="text-[2.2rem] font-semibold leading-[1.12] tracking-[-0.03em] text-ink sm:text-[2.8rem]">
            Take the first small step.
            <br />
            <Soft>We&apos;ll walk the rest with you.</Soft>
          </h2>
          <p className="mx-auto mt-5 max-w-md text-[16.5px] leading-[1.7] text-ink/65">
            It only takes a few honest sentences to begin. And if you have something to give, someone
            is hoping to meet you.
          </p>

          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link href="/sign-up">
              <Button size="xl" iconRight={<ArrowRight />}>
                Ask for help
              </Button>
            </Link>
            <Link href="/sign-up?intent=help">
              <Button size="xl" variant="aurora" icon={<HandHeart />}>
                Offer your help
              </Button>
            </Link>
          </div>

          <p className="mt-7 text-[14px] text-ink/55">Free to join · Private · Leave any time</p>
        </div>
      </Reveal>
    </section>
  );
}
