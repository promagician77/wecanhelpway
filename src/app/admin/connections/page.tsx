import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Link2 } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { Badge, EmptyState, SpotlightCard } from "@/components/ui/feedback";
import { Avatar } from "@/components/ui/misc";
import { CONNECTION_STATUS_META } from "@/lib/constants";
import { relativeTime } from "@/lib/utils";
import type { Connection } from "@/lib/types";

export const metadata: Metadata = { title: "Connections" };
export const dynamic = "force-dynamic";

export default async function AdminConnectionsPage() {
  await requireAdmin();
  const admin = createAdminClient();

  const { data: connections } = await admin
    .from("connections")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = (connections ?? []) as Connection[];
  const personIds = [...new Set(rows.flatMap((c) => [c.requester_id, c.helper_id]))];
  const needIds = rows.map((c) => c.need_id).filter(Boolean) as string[];

  const [{ data: profiles }, { data: needs }, { data: conversations }] = await Promise.all([
    personIds.length
      ? admin.from("profiles").select("id, full_name, avatar_url").in("id", personIds)
      : Promise.resolve({ data: [] }),
    needIds.length ? admin.from("needs").select("id, title").in("id", needIds) : Promise.resolve({ data: [] }),
    rows.length
      ? admin.from("conversations").select("id, connection_id, last_message_at").in("connection_id", rows.map((c) => c.id))
      : Promise.resolve({ data: [] }),
  ]);

  const byId = new Map((profiles ?? []).map((p) => [p.id, p]));
  const needById = new Map((needs ?? []).map((n) => [n.id, n]));
  const convByConnection = new Map((conversations ?? []).map((c) => [c.connection_id, c]));

  return (
    <div>
      <div className="mb-8">
        <p className="mb-2 text-[11.5px] font-semibold uppercase tracking-[0.16em] text-brand-700/80">
          Connections
        </p>
        <h1 className="text-[2rem] font-semibold leading-tight tracking-[-0.035em] text-ink">
          Every introduction
        </h1>
        <p className="mt-2.5 max-w-2xl text-[15px] leading-relaxed text-ink/58">
          Where each proposed connection stands, and whether a conversation actually started.
        </p>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={<Link2 />}
          title="No connections yet"
          description="Open a request from the queue and propose someone to create the first one."
        />
      ) : (
        <div className="space-y-2.5">
          {rows.map((c) => {
            const meta = CONNECTION_STATUS_META[c.status];
            const requester = byId.get(c.requester_id);
            const helper = byId.get(c.helper_id);
            const need = c.need_id ? needById.get(c.need_id) : null;
            const conversation = convByConnection.get(c.id);

            return (
              <SpotlightCard key={c.id} className="p-5">
                <div className="flex flex-wrap items-center gap-4">
                  {/* The pair */}
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Avatar src={requester?.avatar_url} name={requester?.full_name} size={40} />
                      <div className="hidden min-w-0 sm:block">
                        <p className="truncate text-[13px] font-medium text-ink/85">
                          {requester?.full_name ?? "Unknown"}
                        </p>
                        <p className="text-[10.5px] uppercase tracking-wider text-ink/50">asked</p>
                      </div>
                    </div>

                    <ArrowRight className="size-4 shrink-0 text-brand-600/60" />

                    <div className="flex items-center gap-2">
                      <Avatar src={helper?.avatar_url} name={helper?.full_name} size={40} />
                      <div className="hidden min-w-0 sm:block">
                        <p className="truncate text-[13px] font-medium text-ink/85">
                          {helper?.full_name ?? "Unknown"}
                        </p>
                        <p className="text-[10.5px] uppercase tracking-wider text-ink/50">helps</p>
                      </div>
                    </div>
                  </div>

                  {/* Context */}
                  <div className="min-w-0 flex-1">
                    {need && (
                      <Link
                        href={`/admin/needs/${need.id}`}
                        className="truncate text-[13.5px] font-medium text-ink/75 transition-colors hover:text-brand-700"
                      >
                        {need.title}
                      </Link>
                    )}
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 text-[11.5px] text-ink/50">
                      <span className="font-mono">{relativeTime(c.created_at)}</span>
                      <span>requester: {c.requester_response}</span>
                      <span>helper: {c.helper_response}</span>
                      {conversation?.last_message_at && (
                        <span className="text-positive/70">
                          last message {relativeTime(conversation.last_message_at)}
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {conversation && !conversation.last_message_at && c.status === "connected" && (
                      <Badge tone="warn">Not talking yet</Badge>
                    )}
                    <Badge tone={meta.tone} pulse={meta.tone === "progress"}>
                      {meta.label}
                    </Badge>
                  </div>
                </div>

                {c.admin_message && (
                  <p className="mt-3.5 border-t border-ink/[0.06] pt-3.5 text-[12.5px] leading-relaxed text-ink/58">
                    <span className="font-medium text-ink/60">Why we matched them: </span>
                    {c.admin_message}
                  </p>
                )}
              </SpotlightCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
