"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { KeyRound, ShieldCheck } from "lucide-react";
import { updatePassword } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/field";
import { AuthAlert } from "@/components/auth/auth-alert";

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState(updatePassword, null);
  const router = useRouter();

  useEffect(() => {
    if (state?.ok) {
      const t = setTimeout(() => router.push("/dashboard"), 1600);
      return () => clearTimeout(t);
    }
  }, [state, router]);

  return (
    <form action={action} className="mt-9 space-y-4">
      {state?.ok && <AuthAlert tone="success">{state.message} Taking you to your dashboard…</AuthAlert>}
      <AuthAlert>{state && !state.ok ? state.error : undefined}</AuthAlert>

      <PasswordInput
        name="password"
        label="New password"
        autoComplete="new-password"
        icon={<KeyRound />}
        showMeter
        error={state && !state.ok ? state.fieldErrors?.password : undefined}
        required
      />
      <PasswordInput
        name="confirm"
        label="Confirm new password"
        autoComplete="new-password"
        icon={<ShieldCheck />}
        error={state && !state.ok ? state.fieldErrors?.confirm : undefined}
        required
      />

      <Button type="submit" size="lg" fullWidth loading={pending} disabled={state?.ok}>
        Update password
      </Button>
    </form>
  );
}
