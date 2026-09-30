import type { Metadata } from "next";
import Link from "next/link";
import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string; verified?: string }>;
}) {
  const params = await searchParams;

  return (
    <div>
      <h1 className="text-[2rem] font-semibold tracking-[-0.035em] text-ink">Welcome back</h1>
      <p className="mt-2 text-[15px] leading-relaxed text-ink/58">
        Pick up where you left off.{" "}
        <Link
          href={`/sign-up${params.next ? `?next=${encodeURIComponent(params.next)}` : ""}`}
          className="font-medium text-brand-700 underline-offset-4 transition-colors hover:text-brand-700 hover:underline"
        >
          Need an account?
        </Link>
      </p>

      <SignInForm next={params.next} initialError={params.error} verified={params.verified === "1"} />
    </div>
  );
}
