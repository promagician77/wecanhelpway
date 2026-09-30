import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { PageShell } from "@/components/app/page-header";
import { OfferForm } from "@/components/app/offer-form";

export const metadata: Metadata = { title: "Offer to help" };

export default async function NewOfferPage() {
  await requireUser();
  return (
    <PageShell className="max-w-3xl">
      <OfferForm />
    </PageShell>
  );
}
