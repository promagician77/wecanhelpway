"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Check, HandHeart, Leaf } from "lucide-react";
import { PhotoBackdrop } from "@/components/ui/backdrop";
import { Avatar, TypeCycle } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { FACES, HERO_VIDEO, IMAGES } from "@/lib/constants";

const PHRASES = [
  "find steady work.",
  "get back on your feet.",
  "learn a new skill.",
  "plan your next step.",
  "start something of your own.",
];

const ease = [0.22, 1, 0.36, 1] as const;

export function Hero() {
  return (
    <section className="relative isolate flex min-h-[100svh] flex-col overflow-hidden">
      <PhotoBackdrop
        src={IMAGES.heroBackdrop}
        video={HERO_VIDEO}
        alt="A single tree standing in a green meadow under a wide, open sky"
        priority
        position="70% 55%"
        shade={0.08}
      />
      {/* A soft paper wash on the left so the words sit somewhere quiet. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgb(247_245_240/0.94)_0%,rgb(247_245_240/0.78)_38%,rgb(247_245_240/0.1)_68%,transparent_100%)]"
      />
      <div aria-hidden className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-b from-transparent to-paper" />

      <div className="mx-auto flex w-full max-w-6xl flex-1 items-center px-5 pb-20 pt-36 sm:px-7">
        <div className="grid w-full items-end gap-12 lg:grid-cols-[1.35fr_0.65fr]">
          <div className="max-w-2xl">
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease }}
              className="inline-flex items-center gap-2 rounded-full bg-snow/80 px-3.5 py-1.5 text-[13px] font-medium text-brand-700 shadow-[0_1px_2px_rgb(43_42_39/0.06)] backdrop-blur"
            >
              <Leaf className="size-3.5" />
              Free, private, and at your own pace
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, delay: 0.1, ease }}
              className="mt-7 text-[2.6rem] font-semibold leading-[1.08] tracking-[-0.035em] text-ink sm:text-[3.3rem] lg:text-[3.55rem]"
            >
              Whatever you&apos;re facing,
              <br />
              <span className="font-display text-[1.06em] font-normal italic tracking-[-0.01em] text-brand-600">
                you don&apos;t have to face it alone.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, delay: 0.25, ease }}
              className="mt-7 max-w-xl text-[17.5px] leading-[1.7] text-ink/70"
            >
              Tell us what&apos;s going on, in your own words — even if you&apos;re not sure what you
              need yet. A real person reads it and gently connects you with someone who can help.
            </motion.p>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.2, delay: 0.4 }}
              className="mt-5 text-[17px] text-ink/60"
            >
              Someone here can help you{" "}
              <TypeCycle phrases={PHRASES} className="font-medium text-brand-700" />
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, delay: 0.5, ease }}
              className="mt-9 flex flex-wrap items-center gap-3"
            >
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
            </motion.div>

            <motion.ul
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.2, delay: 0.7 }}
              className="mt-8 flex flex-wrap gap-x-6 gap-y-2"
            >
              {["Always free", "No public profile", "No pressure, no deadlines"].map((t) => (
                <li key={t} className="inline-flex items-center gap-2 text-[14px] text-ink/65">
                  <span className="grid size-5 place-items-center rounded-full bg-brand-100 text-brand-600">
                    <Check className="size-3" strokeWidth={3} />
                  </span>
                  {t}
                </li>
              ))}
            </motion.ul>
          </div>

          {/* A personal note, not a dashboard. */}
          <motion.figure
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.4, delay: 0.8, ease }}
            className="hidden max-w-sm justify-self-end rounded-[26px] glass p-6 lg:block"
            style={{ animation: "float 9s ease-in-out 2s infinite" }}
          >
            <blockquote className="font-display text-[21px] italic leading-[1.45] text-ink/85">
              &ldquo;Every message is read by a real person. There&apos;s no wrong way to ask, and no
              problem too small.&rdquo;
            </blockquote>
            <figcaption className="mt-5 flex items-center gap-3 border-t border-ink/[0.08] pt-4">
              <Avatar src={FACES.nadia} name="Nadia" size={40} />
              <div>
                <p className="text-[14px] font-semibold text-ink">Nadia</p>
                <p className="text-[12.5px] text-ink/55">From the WeCanHelpWay team</p>
              </div>
            </figcaption>
          </motion.figure>
        </div>
      </div>
    </section>
  );
}
