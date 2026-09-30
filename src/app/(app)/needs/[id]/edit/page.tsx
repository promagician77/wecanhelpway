import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/app/page-header";
import { NeedForm } from "@/components/app/need-form";
import type { Need } from "@/lib/types";

export const metadata: Metadata = { title: "Edit request" };

export default async function EditNeedPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { profile } = await requireUser();

  const supabase = await createClient();
  const { data } = await supabase.from("needs").select("*").eq("id", id).single();
  if (!data || data.user_id !== profile.id) notFound();

  return (
    <PageShell className="max-w-3xl">
      <NeedForm need={data as Need} />
    </PageShell>
  );
}
