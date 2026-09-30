import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { AdminNeedsTable } from "@/components/admin/needs-table";
import type { Need } from "@/lib/types";

export const metadata: Metadata = { title: "Requests" };
export const dynamic = "force-dynamic";

export default async function AdminNeedsPage() {
  await requireAdmin();
  const admin = createAdminClient();

  const { data: needs } = await admin
    .from("needs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(300);

  const userIds = [...new Set((needs ?? []).map((n) => n.user_id))];
  const { data: profiles } = userIds.length
    ? await admin.from("profiles").select("id, full_name, avatar_url, email, country").in("id", userIds)
    : { data: [] };

  const connectionCounts = await admin
    .from("connections")
    .select("need_id")
    .in("status", ["proposed", "partially_accepted", "connected"]);

  const proposedByNeed = new Map<string, number>();
  for (const c of connectionCounts.data ?? []) {
    if (c.need_id) proposedByNeed.set(c.need_id, (proposedByNeed.get(c.need_id) ?? 0) + 1);
  }

  return (
    <div>
      <div className="mb-8">
        <p className="mb-2 text-[11.5px] font-semibold uppercase tracking-[0.16em] text-brand-700/80">
          Requests
        </p>
        <h1 className="text-[2rem] font-semibold leading-tight tracking-[-0.035em] text-ink">
          The queue
        </h1>
        <p className="mt-2.5 max-w-2xl text-[15px] leading-relaxed text-ink/58">
          Every request submitted to WeCanHelpWay. Open one to review it, ask a question, or propose
          a person.
        </p>
      </div>

      <AdminNeedsTable
        needs={(needs ?? []) as Need[]}
        profiles={(profiles ?? []) as { id: string; full_name: string | null; avatar_url: string | null; email: string | null; country: string | null }[]}
        proposedCounts={Object.fromEntries(proposedByNeed)}
      />
    </div>
  );
}
