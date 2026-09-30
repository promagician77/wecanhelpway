import type { Metadata } from "next";
import Link from "next/link";
import { SignUpForm } from "./sign-up-form";

export const metadata: Metadata = { title: "Create your account" };

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; intent?: string }>;
}) {
  const params = await searchParams;

  return (
    <div>
      <h1 className="text-[2rem] font-semibold tracking-[-0.035em] text-ink">
        {params.intent === "help" ? "Start helping someone" : "Create your account"}
      </h1>
      <p className="mt-2 text-[15px] leading-relaxed text-ink/58">
        Takes under a minute.{" "}
        <Link
          href={`/sign-in${params.next ? `?next=${encodeURIComponent(params.next)}` : ""}`}
          className="font-medium text-brand-700 underline-offset-4 transition-colors hover:text-brand-700 hover:underline"
        >
          Already have one?
        </Link>
      </p>

      <SignUpForm next={params.next} />
    </div>
  );
}
