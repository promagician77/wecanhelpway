"use client";

import * as React from "react";
import Link from "next/link";
import { useActionState } from "react";
import { AtSign, KeyRound, LogIn } from "lucide-react";
import { signIn, resendVerification } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input, PasswordInput } from "@/components/ui/field";
import { AuthAlert } from "@/components/auth/auth-alert";
import { AuthDivider, OAuthButtons } from "@/components/auth/oauth-buttons";

export function SignInForm({
  next,
  initialError,
  verified,
}: {
  next?: string;
  initialError?: string;
  verified?: boolean;
}) {
  const [state, action, pending] = useActionState(signIn, null);
  const [resendState, resendAction, resending] = useActionState(resendVerification, null);
  const [email, setEmail] = React.useState("");

  const error = state && !state.ok ? state.error : initialError;
  const needsVerification = Boolean(error && /verified/i.test(error));

  return (
    <div className="mt-9 space-y-6">
      <OAuthButtons next={next} disabled={pending} />
      <AuthDivider />

      <form action={action} className="space-y-4">
        <input type="hidden" name="next" value={next ?? ""} />

        {verified && <AuthAlert tone="success">Your email is verified. You can sign in now.</AuthAlert>}
        <AuthAlert>{error}</AuthAlert>
        {resendState?.ok && <AuthAlert tone="success">{resendState.message}</AuthAlert>}

        <Input
          name="email"
          type="email"
          label="Email address"
          autoComplete="email"
          icon={<AtSign />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={state && !state.ok ? state.fieldErrors?.email : undefined}
          required
        />

        <div>
          <PasswordInput
            name="password"
            label="Password"
            autoComplete="current-password"
            icon={<KeyRound />}
            error={state && !state.ok ? state.fieldErrors?.password : undefined}
            required
          />
          <div className="mt-2.5 text-right">
            <Link
              href="/forgot-password"
              className="text-[12.5px] font-medium text-ink/58 underline-offset-4 transition-colors hover:text-brand-700 hover:underline"
            >
              Forgot your password?
            </Link>
          </div>
        </div>

        <Button
          type="submit"
          size="lg"
          fullWidth
          loading={pending}
          iconRight={<LogIn />}
          className="mt-2"
        >
          Sign in
        </Button>
      </form>

      {needsVerification && (
        <form action={resendAction}>
          <input type="hidden" name="email" value={email} />
          <Button type="submit" variant="outline" size="sm" fullWidth loading={resending} magnetic={false}>
            Resend the verification email
          </Button>
        </form>
      )}

      <p className="text-center text-[12.5px] leading-relaxed text-ink/50">
        Locked out entirely?{" "}
        <Link href="/forgot-password?mode=recovery" className="text-ink/55 underline-offset-4 hover:underline">
          Recover your account
        </Link>
      </p>
    </div>
  );
}
