import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { AdminUsersTable } from "@/components/admin/users-table";
import type { Profile } from "@/lib/types";

export const metadata: Metadata = { title: "People" };
export const dynamic = "force-dynamic";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { profile: me } = await requireAdmin();
  const { q } = await searchParams;
  const admin = createAdminClient();

  const { data: profiles } = await admin
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);

  // Counts per person, so the table can show engagement without an N+1.
  const [{ data: needs }, { data: offers }] = await Promise.all([
    admin.from("needs").select("user_id"),
    admin.from("offers").select("user_id"),
  ]);

  const needCounts: Record<string, number> = {};
  for (const n of needs ?? []) needCounts[n.user_id] = (needCounts[n.user_id] ?? 0) + 1;
  const offerCounts: Record<string, number> = {};
  for (const o of offers ?? []) offerCounts[o.user_id] = (offerCounts[o.user_id] ?? 0) + 1;

  return (
    <div>
      <div className="mb-8">
        <p className="mb-2 text-[11.5px] font-semibold uppercase tracking-[0.16em] text-brand-700/80">
          People
        </p>
        <h1 className="text-[2rem] font-semibold leading-tight tracking-[-0.035em] text-ink">
          Everyone on WeCanHelpWay
        </h1>
        <p className="mt-2.5 max-w-2xl text-[15px] leading-relaxed text-ink/58">
          Roles and account status. Changing either takes effect immediately.
        </p>
      </div>

      <AdminUsersTable
        profiles={(profiles ?? []) as Profile[]}
        currentUserId={me.id}
        needCounts={needCounts}
        offerCounts={offerCounts}
        initialQuery={q ?? ""}
      />
    </div>
  );
}
