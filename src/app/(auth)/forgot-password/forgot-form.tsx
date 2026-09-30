"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AtSign, Send } from "lucide-react";
import { requestPasswordReset, sendRecoveryLink } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { AuthAlert } from "@/components/auth/auth-alert";

export function ForgotPasswordForm({ recovery }: { recovery?: boolean }) {
  const [state, action, pending] = useActionState(
    recovery ? sendRecoveryLink : requestPasswordReset,
    null,
  );

  return (
    <div className="mt-9 space-y-5">
      <form action={action} className="space-y-4">
        {state?.ok && <AuthAlert tone="success">{state.message}</AuthAlert>}
        <AuthAlert>{state && !state.ok ? state.error : undefined}</AuthAlert>

        <Input
          name="email"
          type="email"
          label="Email address"
          autoComplete="email"
          icon={<AtSign />}
          error={state && !state.ok ? state.fieldErrors?.email : undefined}
          required
        />

        <Button type="submit" size="lg" fullWidth loading={pending} iconRight={<Send />}>
          {recovery ? "Email me a sign-in link" : "Send reset link"}
        </Button>
      </form>

      <p className="text-center text-[12.5px] text-ink/50">
        {recovery ? (
          <>
            Prefer a password reset?{" "}
            <Link href="/forgot-password" className="text-ink/55 underline-offset-4 hover:underline">
              Do that instead
            </Link>
          </>
        ) : (
          <>
            No longer have access to your password?{" "}
            <Link href="/forgot-password?mode=recovery" className="text-ink/55 underline-offset-4 hover:underline">
              Use a one-time link
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
