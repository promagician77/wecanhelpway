import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { ResetPasswordForm } from "./reset-form";

export const metadata: Metadata = { title: "Choose a new password" };

export default async function ResetPasswordPage() {
  // The recovery link signs the user in; without a session the link expired.
  const user = await getUser();
  if (!user) redirect("/forgot-password?expired=1");

  return (
    <div>
      <h1 className="text-[2rem] font-semibold tracking-[-0.035em] text-ink">Choose a new password</h1>
      <p className="mt-2 text-[15px] leading-relaxed text-ink/58">
        Make it something you&apos;ll remember — at least 8 characters.
      </p>
      <ResetPasswordForm />
    </div>
  );
}
