import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/app/page-header";
import { OfferForm } from "@/components/app/offer-form";
import type { Offer } from "@/lib/types";

export const metadata: Metadata = { title: "Edit offer" };

export default async function EditOfferPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { profile } = await requireUser();

  const supabase = await createClient();
  const { data } = await supabase.from("offers").select("*").eq("id", id).single();
  if (!data || data.user_id !== profile.id) notFound();

  return (
    <PageShell className="max-w-3xl">
      <OfferForm offer={data as Offer} />
    </PageShell>
  );
}
