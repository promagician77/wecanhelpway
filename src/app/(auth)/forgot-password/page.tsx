import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "./forgot-form";

export const metadata: Metadata = { title: "Reset your password" };

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const params = await searchParams;
  const recovery = params.mode === "recovery";

  return (
    <div>
      <h1 className="text-[2rem] font-semibold tracking-[-0.035em] text-ink">
        {recovery ? "Recover your account" : "Reset your password"}
      </h1>
      <p className="mt-2 text-[15px] leading-relaxed text-ink/58">
        {recovery
          ? "We'll email you a one-time sign-in link. No password needed."
          : "Enter your email and we'll send you a link to set a new one."}
      </p>

      <ForgotPasswordForm recovery={recovery} />

      <p className="mt-8 text-center text-[13px] text-ink/50">
        Remembered it?{" "}
        <Link href="/sign-in" className="font-medium text-brand-700 underline-offset-4 hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
