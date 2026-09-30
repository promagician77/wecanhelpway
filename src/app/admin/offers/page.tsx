import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { AdminOffersBoard } from "@/components/admin/offers-board";
import type { Offer } from "@/lib/types";

export const metadata: Metadata = { title: "Offers" };
export const dynamic = "force-dynamic";

export default async function AdminOffersPage() {
  await requireAdmin();
  const admin = createAdminClient();

  const { data: offers } = await admin
    .from("offers")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(300);

  const userIds = [...new Set((offers ?? []).map((o) => o.user_id))];
  const { data: profiles } = userIds.length
    ? await admin.from("profiles").select("id, full_name, avatar_url, email, country").in("id", userIds)
    : { data: [] };

  return (
    <div>
      <div className="mb-8">
        <p className="mb-2 text-[11.5px] font-semibold uppercase tracking-[0.16em] text-aqua-600/80">
          Offers
        </p>
        <h1 className="text-[2rem] font-semibold leading-tight tracking-[-0.035em] text-ink">
          People who want to help
        </h1>
        <p className="mt-2.5 max-w-2xl text-[15px] leading-relaxed text-ink/58">
          Review each offer and mark it active — active offers are what the matching workspace
          searches.
        </p>
      </div>

      <AdminOffersBoard
        offers={(offers ?? []) as Offer[]}
        profiles={(profiles ?? []) as { id: string; full_name: string | null; avatar_url: string | null; email: string | null; country: string | null }[]}
      />
    </div>
  );
}
