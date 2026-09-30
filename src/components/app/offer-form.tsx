"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  CalendarClock,
  Clock4,
  HandHeart,
  Globe2,
  MapPin,
  Send,
  Type,
  Wrench,
} from "lucide-react";
import { createOffer, updateOffer } from "@/actions/offers";
import { CategoryPicker } from "./category-picker";
import { Button } from "@/components/ui/button";
import { Input, Select, TagInput, Textarea } from "@/components/ui/field";
import { StepProgress } from "@/components/ui/feedback";
import { AuthAlert } from "@/components/auth/auth-alert";
import {
  AVAILABILITY_OPTIONS,
  EXPERIENCE_LEVELS,
  HELP_TYPES,
  OFFER_CATEGORIES,
} from "@/lib/constants";
import type { Offer } from "@/lib/types";

const STEPS = ["How you can help", "What you bring", "When and where"];

const SKILL_SUGGESTIONS = [
  "React", "React Native", "TypeScript", "Python", "Node.js", "Design", "UX", "Product",
  "Marketing", "Sales", "Fundraising", "Data", "Machine Learning", "Teaching", "Writing",
  "Public speaking", "Mentoring", "Career coaching", "English", "Spanish", "Accounting",
];

export function OfferForm({ offer }: { offer?: Offer }) {
  const editing = Boolean(offer);
  const [state, action, pending] = useActionState(editing ? updateOffer : createOffer, null);
  const [step, setStep] = React.useState(0);

  const [category, setCategory] = React.useState(offer?.category ?? "");
  const [title, setTitle] = React.useState(offer?.title ?? "");
  const [description, setDescription] = React.useState(offer?.description ?? "");
  const [skills, setSkills] = React.useState<string[]>(offer?.skills ?? []);
  const [experience, setExperience] = React.useState(offer?.experience ?? "");
  const [availability, setAvailability] = React.useState(offer?.availability ?? "");
  const [preferredHelp, setPreferredHelp] = React.useState(offer?.preferred_help ?? "");
  const [location, setLocation] = React.useState(offer?.location ?? "");
  const [timezone, setTimezone] = React.useState(
    offer?.timezone ?? (typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : ""),
  );

  const router = useRouter();
  const fieldErrors = state && !state.ok ? state.fieldErrors : undefined;

  React.useEffect(() => {
    if (state?.ok && !editing && state.data?.id) router.push(`/offers/${state.data.id}?new=1`);
  }, [state, editing, router]);

  React.useEffect(() => {
    if (!fieldErrors) return;
    if (fieldErrors.category) setStep(0);
    else if (fieldErrors.title || fieldErrors.description) setStep(1);
  }, [fieldErrors]);

  const canAdvance =
    step === 0 ? Boolean(category) : step === 1 ? title.length >= 6 && description.length >= 20 : true;

  return (
    <div>
      <div className="mb-8">
        <p className="mb-2 text-[11.5px] font-semibold uppercase tracking-[0.16em] text-aqua-600/80">
          {editing ? "Edit your offer" : "I want to help"}
        </p>
        <h1 className="text-[1.9rem] font-semibold leading-tight tracking-[-0.035em] text-ink sm:text-[2.25rem]">
          {editing ? "Update what you can offer" : "What could you give an hour to?"}
        </h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-ink/58">
          You don&apos;t have to be an expert. Someone out there is exactly one conversation behind
          where you are now.
        </p>
      </div>

      <div className="mb-8">
        <StepProgress steps={STEPS} current={step} onStepClick={setStep} />
      </div>

      <form action={action} className="space-y-6">
        {editing && <input type="hidden" name="id" value={offer!.id} />}
        <input type="hidden" name="category" value={category} />
        <input type="hidden" name="skills" value={skills.join(",")} />

        <AuthAlert>{state && !state.ok ? state.error : undefined}</AuthAlert>

        <AnimatePresence mode="wait" initial={false}>
          {step === 0 && (
            <motion.div
              key="s0"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-5"
            >
              <div>
                <h2 className="text-[15px] font-semibold text-ink/90">How would you like to help?</h2>
                <p className="mt-1 text-[13.5px] text-ink/58">Pick whichever is closest.</p>
              </div>
              <CategoryPicker categories={OFFER_CATEGORIES} value={category} onChange={setCategory} />
              {fieldErrors?.category && <p className="text-xs text-critical">{fieldErrors.category}</p>}
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="s1"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-5"
            >
              <Input
                name="title"
                label="Sum it up in one line"
                icon={<Type />}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                hint="“I'm a React Native developer and can help someone build an MVP.”"
                error={fieldErrors?.title}
                maxLength={120}
              />

              <Textarea
                name="description"
                label="Tell us more"
                icon={<HandHeart />}
                rows={7}
                maxChars={4000}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                hint="What you'd actually do, who you'd be best for, and anything you'd rather not take on."
                error={fieldErrors?.description}
              />

              <TagInput
                label="Skills you'd bring"
                icon={<Wrench />}
                value={skills}
                onChange={setSkills}
                suggestions={SKILL_SUGGESTIONS}
                hint="Press Enter after each. These help our team find you the right person."
              />
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="s2"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-5"
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <Select
                  name="experience"
                  label="How much experience?"
                  icon={<Award />}
                  placeholder="Prefer not to say"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                >
                  {EXPERIENCE_LEVELS.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </Select>

                <Select
                  name="availability"
                  label="How much time?"
                  icon={<CalendarClock />}
                  placeholder="Flexible"
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value)}
                >
                  {AVAILABILITY_OPTIONS.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </Select>
              </div>

              <Select
                name="preferred_help"
                label="What kind of help suits you best?"
                icon={<HandHeart />}
                placeholder="Open to anything"
                value={preferredHelp}
                onChange={(e) => setPreferredHelp(e.target.value)}
              >
                {HELP_TYPES.filter((h) => !h.startsWith("I genuinely")).map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </Select>

              <div className="grid gap-5 sm:grid-cols-2">
                <Input
                  name="location"
                  label="Where are you? (optional)"
                  icon={<MapPin />}
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
                <Input
                  name="timezone"
                  label="Time zone"
                  icon={<Globe2 />}
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  hint="Helps us match people who can actually talk."
                />
              </div>

              <div className="flex items-start gap-3 rounded-sm border border-ink/[0.08] bg-ink/[0.025] px-4 py-3.5">
                <Clock4 className="mt-0.5 size-4 shrink-0 text-aqua-600" />
                <p className="text-[13px] leading-relaxed text-ink/62">
                  You&apos;ll never be contacted out of the blue. We propose a specific person, you
                  read their situation, and you decide.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Carry unmounted steps' values through the submit. */}
        <div className="hidden" aria-hidden>
          {step !== 1 && (
            <>
              <input type="hidden" name="title" value={title} />
              <input type="hidden" name="description" value={description} />
            </>
          )}
          {step !== 2 && (
            <>
              <input type="hidden" name="experience" value={experience} />
              <input type="hidden" name="availability" value={availability} />
              <input type="hidden" name="preferred_help" value={preferredHelp} />
              <input type="hidden" name="location" value={location} />
              <input type="hidden" name="timezone" value={timezone} />
            </>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-ink/[0.07] pt-6">
          <Button
            type="button"
            variant="ghost"
            size="md"
            magnetic={false}
            icon={<ArrowLeft />}
            onClick={() => (step === 0 ? router.back() : setStep((s) => s - 1))}
          >
            {step === 0 ? "Cancel" : "Back"}
          </Button>

          {step < STEPS.length - 1 ? (
            <Button
              type="button"
              size="lg"
              iconRight={<ArrowRight />}
              disabled={!canAdvance}
              onClick={() => setStep((s) => s + 1)}
            >
              Continue
            </Button>
          ) : (
            <Button type="submit" size="lg" loading={pending} iconRight={<Send />}>
              {editing ? "Save changes" : "Submit offer"}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
