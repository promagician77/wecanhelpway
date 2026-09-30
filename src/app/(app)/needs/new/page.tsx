import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { PageShell } from "@/components/app/page-header";
import { NeedForm } from "@/components/app/need-form";

export const metadata: Metadata = { title: "Ask for help" };

export default async function NewNeedPage() {
  await requireUser();
  return (
    <PageShell className="max-w-3xl">
      <NeedForm />
    </PageShell>
  );
}
