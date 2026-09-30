"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Heart,
  MapPin,
  Send,
  Sparkles,
  Target,
  Type,
} from "lucide-react";
import { createNeed, updateNeed } from "@/actions/needs";
import { CategoryPicker } from "./category-picker";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/field";
import { StepProgress } from "@/components/ui/feedback";
import { AuthAlert } from "@/components/auth/auth-alert";
import { AVAILABILITY_OPTIONS, HELP_TYPES, NEED_CATEGORIES } from "@/lib/constants";
import type { Need } from "@/lib/types";

const STEPS = ["What's going on", "Tell us more", "Practical details"];

export function NeedForm({ need }: { need?: Need }) {
  const editing = Boolean(need);
  const [state, action, pending] = useActionState(editing ? updateNeed : createNeed, null);
  const [step, setStep] = React.useState(0);
  const [category, setCategory] = React.useState(need?.category ?? "");
  const [title, setTitle] = React.useState(need?.title ?? "");
  const [description, setDescription] = React.useState(need?.description ?? "");
  const [goal, setGoal] = React.useState(need?.goal ?? "");
  const [helpType, setHelpType] = React.useState(need?.help_type ?? "");
  const [location, setLocation] = React.useState(need?.location ?? "");
  const [availability, setAvailability] = React.useState(need?.availability ?? "");
  const [preferences, setPreferences] = React.useState(need?.preferences ?? "");
  const router = useRouter();

  const fieldErrors = state && !state.ok ? state.fieldErrors : undefined;

  React.useEffect(() => {
    if (state?.ok && !editing && state.data?.id) {
      router.push(`/needs/${state.data.id}?new=1`);
    }
  }, [state, editing, router]);

  // Server-side validation failures must surface their step, not hide behind it.
  React.useEffect(() => {
    if (!fieldErrors) return;
    if (fieldErrors.category) setStep(0);
    else if (fieldErrors.title || fieldErrors.description) setStep(1);
  }, [fieldErrors]);

  const canAdvance = step === 0 ? Boolean(category) : step === 1 ? title.length >= 6 && description.length >= 20 : true;

  return (
    <div>
      <div className="mb-8">
        <p className="mb-2 text-[11.5px] font-semibold uppercase tracking-[0.16em] text-brand-700/80">
          {editing ? "Edit your request" : "I need help"}
        </p>
        <h1 className="text-[1.9rem] font-semibold leading-tight tracking-[-0.035em] text-ink sm:text-[2.25rem]">
          {editing ? "Update what you need" : "Tell us what's going on"}
        </h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-ink/58">
          Write it how you&apos;d say it out loud. A real person reads every request — you don&apos;t
          need the right words, just the honest ones.
        </p>
      </div>

      <div className="mb-8">
        <StepProgress steps={STEPS} current={step} onStepClick={setStep} />
      </div>

      <form action={action} className="space-y-6">
        {editing && <input type="hidden" name="id" value={need!.id} />}
        {/* Every step's value must post, so fields outside the current step stay mounted and hidden. */}
        <input type="hidden" name="category" value={category} />

        <AuthAlert>{state && !state.ok ? state.error : undefined}</AuthAlert>

        <AnimatePresence mode="wait" initial={false}>
          {/* ---------------------------- Step 1 ---------------------------- */}
          {step === 0 && (
            <motion.div
              key="step-0"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-5"
            >
              <div>
                <h2 className="text-[15px] font-semibold text-ink/90">
                  Which of these is closest?
                </h2>
                <p className="mt-1 text-[13.5px] text-ink/58">
                  If none of them fit, the first option is a real answer — not a cop-out.
                </p>
              </div>

              <CategoryPicker categories={NEED_CATEGORIES} value={category} onChange={setCategory} />

              {fieldErrors?.category && (
                <p className="text-xs text-critical">{fieldErrors.category}</p>
              )}

              {category === "not_sure" && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-3 rounded-sm border border-aqua-400/25 bg-aqua-500/[0.08] px-4 py-3.5"
                >
                  <Sparkles className="mt-0.5 size-4 shrink-0 text-aqua-600" />
                  <p className="text-[13px] leading-relaxed text-ink/60">
                    Good. Most people who end up well matched started here. Just describe the
                    situation on the next step — we&apos;ll figure out the rest with you.
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ---------------------------- Step 2 ---------------------------- */}
          {step === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-5"
            >
              <Input
                name="title"
                label="Give it a short title"
                icon={<Type />}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                hint="One line, like you'd text a friend. “I want to learn to code” is perfect."
                error={fieldErrors?.title}
                maxLength={120}
              />

              <Textarea
                name="description"
                label="What's happening?"
                icon={<Heart />}
                rows={7}
                maxChars={4000}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                hint="Context helps more than precision. Where you are, what you've tried, what's in the way."
                error={fieldErrors?.description}
              />

              <Textarea
                name="goal"
                label="What would a good outcome look like?"
                icon={<Target />}
                rows={3}
                maxChars={1000}
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                hint="Optional — but it's often the most useful thing you can tell us."
              />
            </motion.div>
          )}

          {/* ---------------------------- Step 3 ---------------------------- */}
          {step === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-5"
            >
              <Select
                name="help_type"
                label="What kind of help do you think you need?"
                icon={<Sparkles />}
                placeholder="Pick one — or the last option"
                value={helpType}
                onChange={(e) => setHelpType(e.target.value)}
              >
                {HELP_TYPES.map((h) => (
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
                  hint="Only matters if you'd like someone nearby."
                />
                <Select
                  name="availability"
                  label="When are you free? (optional)"
                  icon={<CalendarClock />}
                  placeholder="No preference"
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

              <Textarea
                name="preferences"
                label="Anything else we should know? (optional)"
                rows={3}
                maxChars={1000}
                value={preferences}
                onChange={(e) => setPreferences(e.target.value)}
                hint="A language you'd prefer, a time zone, something you'd rather avoid."
              />

              <div className="flex items-start gap-3 rounded-sm border border-ink/[0.08] bg-ink/[0.025] px-4 py-3.5">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-positive" />
                <p className="text-[13px] leading-relaxed text-ink/62">
                  Nobody can see this except the WeCanHelpWay team. If we find someone, we ask you
                  both before either of you can message the other.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Only the current step is mounted, so every other step's value is
            carried in a hidden input — otherwise submitting from step 3 would
            silently drop what was typed on step 2. */}
        <div className="hidden" aria-hidden>
          {step !== 1 && (
            <>
              <input type="hidden" name="title" value={title} />
              <input type="hidden" name="description" value={description} />
              <input type="hidden" name="goal" value={goal} />
            </>
          )}
          {step !== 2 && (
            <>
              <input type="hidden" name="help_type" value={helpType} />
              <input type="hidden" name="location" value={location} />
              <input type="hidden" name="availability" value={availability} />
              <input type="hidden" name="preferences" value={preferences} />
            </>
          )}
        </div>

        {/* Navigation ------------------------------------------------------ */}
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
              {editing ? "Save changes" : "Submit request"}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
