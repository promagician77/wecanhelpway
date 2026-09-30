"use client";

import * as React from "react";
import Link from "next/link";
import { useActionState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, AtSign, KeyRound, MailCheck, User } from "lucide-react";
import { signUp, resendVerification } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Checkbox, Input, PasswordInput } from "@/components/ui/field";
import { AuthAlert } from "@/components/auth/auth-alert";
import { AuthDivider, OAuthButtons } from "@/components/auth/oauth-buttons";

export function SignUpForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(signUp, null);
  const [accepted, setAccepted] = React.useState(false);

  // Once the account exists we swap the whole form for the "check your inbox"
  // panel rather than routing away — the user hasn't a session yet.
  if (state?.ok && state.data?.email) {
    return <CheckInbox email={state.data.email} />;
  }

  return (
    <div className="mt-9 space-y-6">
      <OAuthButtons next={next} disabled={pending} />
      <AuthDivider label="or use your email" />

      <form action={action} className="space-y-4">
        <AuthAlert>{state && !state.ok ? state.error : undefined}</AuthAlert>

        <Input
          name="fullName"
          label="Full name"
          autoComplete="name"
          icon={<User />}
          error={state && !state.ok ? state.fieldErrors?.fullName : undefined}
          required
        />
        <Input
          name="email"
          type="email"
          label="Email address"
          autoComplete="email"
          icon={<AtSign />}
          error={state && !state.ok ? state.fieldErrors?.email : undefined}
          required
        />
        <PasswordInput
          name="password"
          label="Password"
          autoComplete="new-password"
          icon={<KeyRound />}
          showMeter
          error={state && !state.ok ? state.fieldErrors?.password : undefined}
          required
        />

        <div className="pt-1">
          <Checkbox
            name="accept"
            checked={accepted}
            onChange={setAccepted}
            label={
              <>
                I agree to the{" "}
                <Link href="/terms" className="text-brand-700 underline-offset-4 hover:underline">
                  Terms
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-brand-700 underline-offset-4 hover:underline">
                  Privacy Policy
                </Link>
                .
              </>
            }
          />
          {state && !state.ok && state.fieldErrors?.accept && (
            <p className="mt-2 pl-8 text-xs text-critical">{state.fieldErrors.accept}</p>
          )}
        </div>

        <Button type="submit" size="lg" fullWidth loading={pending} iconRight={<ArrowRight />} className="mt-2">
          Create account
        </Button>
      </form>
    </div>
  );
}

function CheckInbox({ email }: { email: string }) {
  const [state, action, pending] = useActionState(resendVerification, null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 26 }}
      className="mt-9 rounded-lg glass p-7 text-center"
    >
      <div className="relative mx-auto grid size-16 place-items-center">
        <span className="absolute inset-0 rounded-full bg-brand-500/25 blur-xl" />
        <span className="absolute -inset-2 animate-breathe rounded-full bg-brand-100" />
        <span className="relative grid size-16 place-items-center rounded-full border border-ink/12 bg-ink/[0.05]">
          <MailCheck className="size-7 text-brand-700" />
        </span>
      </div>

      <h2 className="mt-6 text-xl font-semibold tracking-[-0.02em] text-ink">Check your inbox</h2>
      <p className="mx-auto mt-2.5 max-w-sm text-[14.5px] leading-relaxed text-ink/62">
        We sent a verification link to{" "}
        <span className="font-medium text-ink/85">{email}</span>. Click it and you&apos;re in.
      </p>

      <div className="mt-6 space-y-3">
        {state?.ok && <AuthAlert tone="success">{state.message}</AuthAlert>}
        {state && !state.ok && <AuthAlert>{state.error}</AuthAlert>}

        <form action={action}>
          <input type="hidden" name="email" value={email} />
          <Button type="submit" variant="outline" fullWidth loading={pending} magnetic={false}>
            Resend the link
          </Button>
        </form>

        <Link
          href="/sign-in"
          className="block text-[12.5px] text-ink/50 underline-offset-4 transition-colors hover:text-ink/70 hover:underline"
        >
          Back to sign in
        </Link>
      </div>

      <p className="mt-6 border-t border-ink/[0.07] pt-5 text-[12px] leading-relaxed text-ink/50">
        Nothing after a few minutes? Check spam, and make sure the address above is right.
      </p>
    </motion.div>
  );
}
