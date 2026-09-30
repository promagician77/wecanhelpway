import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  HandHeart,
  LifeBuoy,
  Link2,
  MessagesSquare,
  Timer,
  Users,
} from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { Badge, CountUp, Reveal, SpotlightCard } from "@/components/ui/feedback";
import { Avatar } from "@/components/ui/misc";
import { NEED_STATUS_META, PRIORITY_META, categoryLabel } from "@/lib/constants";
import { relativeTime, truncate } from "@/lib/utils";
import type { Need } from "@/lib/types";

export const metadata: Metadata = { title: "Team Dashboard" };
export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  await requireAdmin();
  const admin = createAdminClient();

  const [
    { count: totalUsers },
    { count: totalNeeds },
    { count: totalOffers },
    { count: openNeeds },
    { count: liveConnections },
    { count: conversations },
    { data: queue },
    { data: recentProfiles },
  ] = await Promise.all([
    admin.from("profiles").select("id", { count: "exact", head: true }),
    admin.from("needs").select("id", { count: "exact", head: true }),
    admin.from("offers").select("id", { count: "exact", head: true }),
    admin
      .from("needs")
      .select("id", { count: "exact", head: true })
      .in("status", ["submitted", "under_review", "looking_for_match", "needs_clarification"]),
    admin.from("connections").select("id", { count: "exact", head: true }).eq("status", "connected"),
    admin.from("conversations").select("id", { count: "exact", head: true }),
    admin
      .from("needs")
      .select("*")
      .in("status", ["submitted", "under_review", "looking_for_match", "needs_clarification"])
      .order("priority", { ascending: false })
      .order("created_at", { ascending: true })
      .limit(8),
    admin
      .from("profiles")
      .select("id, full_name, avatar_url, created_at, country")
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  const needs = (queue ?? []) as Need[];
  const userIds = [...new Set(needs.map((n) => n.user_id))];
  const { data: requesters } = userIds.length
    ? await admin.from("profiles").select("id, full_name, avatar_url").in("id", userIds)
    : { data: [] };
  const byId = new Map((requesters ?? []).map((p) => [p.id, p]));

  const stats = [
    { label: "People", value: totalUsers ?? 0, icon: Users, href: "/admin/users" },
    { label: "Requests", value: totalNeeds ?? 0, icon: LifeBuoy, href: "/admin/needs" },
    { label: "Offers", value: totalOffers ?? 0, icon: HandHeart, href: "/admin/offers" },
    { label: "Awaiting action", value: openNeeds ?? 0, icon: Timer, href: "/admin/needs", urgent: true },
    { label: "Live connections", value: liveConnections ?? 0, icon: Link2, href: "/admin/connections" },
    { label: "Conversations", value: conversations ?? 0, icon: MessagesSquare, href: "/admin/connections" },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="mb-2 text-[11.5px] font-semibold uppercase tracking-[0.16em] text-brand-700/80">
            WeCanHelpWay team
          </p>
          <h1 className="text-[2rem] font-semibold leading-tight tracking-[-0.035em] text-ink">
            Operations overview
          </h1>
          <p className="mt-2.5 max-w-2xl text-[15px] leading-relaxed text-ink/58">
            Every request here is a person waiting. Work the queue oldest-first unless something is
            marked urgent.
          </p>
        </div>

        <Link href="/admin/needs">
          <span className="inline-flex items-center gap-2 rounded-sm skin-chrome px-5 py-3 text-[13.5px] font-medium transition-[filter] hover:brightness-105">
            Open the queue
            <ArrowRight className="size-4" />
          </span>
        </Link>
      </div>

      {/* Stats -------------------------------------------------------------- */}
      <div className="mt-8 grid grid-cols-2 gap-3.5 lg:grid-cols-6">
        {stats.map((stat, i) => (
          <Reveal key={stat.label} delay={i * 0.05}>
            <Link href={stat.href}>
              <SpotlightCard className="h-full p-5 transition-transform duration-300 hover:-translate-y-0.5">
                <stat.icon
                  className={stat.urgent && stat.value > 0 ? "size-[18px] text-caution" : "size-[18px] text-brand-700"}
                />
                <p className="mt-3.5 text-[1.9rem] font-semibold leading-none tracking-[-0.04em] text-ink">
                  <CountUp to={stat.value} />
                </p>
                <p className="mt-1.5 text-[12px] text-ink/58">{stat.label}</p>
              </SpotlightCard>
            </Link>
          </Reveal>
        ))}
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        {/* Queue ----------------------------------------------------------- */}
        <Reveal>
          <SpotlightCard className="p-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="flex items-center gap-2.5 text-[15px] font-semibold text-ink/90">
                <Timer className="size-[17px] text-caution" />
                Needs your attention
              </h2>
              <Link
                href="/admin/needs"
                className="text-[12.5px] font-medium text-brand-700 transition-colors hover:text-brand-700"
              >
                See all
              </Link>
            </div>

            {needs.length === 0 ? (
              <div className="flex flex-col items-center gap-2.5 py-14 text-center">
                <AlertTriangle className="size-6 text-ink/50" />
                <p className="text-[13.5px] text-ink/50">
                  The queue is empty. Every request has been triaged.
                </p>
              </div>
            ) : (
              <ul className="mt-5 space-y-2">
                {needs.map((need) => {
                  const meta = NEED_STATUS_META[need.status];
                  const person = byId.get(need.user_id);
                  return (
                    <li key={need.id}>
                      <Link
                        href={`/admin/needs/${need.id}`}
                        className="group flex gap-3.5 rounded-sm border border-ink/[0.06] bg-ink/[0.02] p-4 transition-all duration-300 hover:border-brand-400/30 hover:bg-ink/[0.05]"
                      >
                        <Avatar src={person?.avatar_url} name={person?.full_name} size={38} />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="truncate text-[14px] font-medium text-ink/90 group-hover:text-ink">
                              {need.title}
                            </span>
                            {need.priority !== "normal" && (
                              <Badge tone={PRIORITY_META[need.priority].tone}>
                                {PRIORITY_META[need.priority].label}
                              </Badge>
                            )}
                            {need.not_sure && <Badge tone="info">Unsure</Badge>}
                          </div>
                          <p className="mt-1 line-clamp-1 text-[12.5px] text-ink/58">
                            {truncate(need.description, 110)}
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink/50">
                            <span className="text-brand-700/70">{categoryLabel(need.category)}</span>
                            <span>{person?.full_name ?? "Unknown"}</span>
                            <span className="font-mono">{relativeTime(need.created_at)}</span>
                          </div>
                        </div>
                        <Badge tone={meta.tone} pulse={meta.tone === "progress"}>
                          {meta.label}
                        </Badge>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </SpotlightCard>
        </Reveal>

        {/* Newest people --------------------------------------------------- */}
        <Reveal delay={0.1}>
          <SpotlightCard className="p-6">
            <h2 className="flex items-center gap-2.5 text-[15px] font-semibold text-ink/90">
              <Users className="size-[17px] text-aqua-600" />
              Newest members
            </h2>
            <ul className="mt-5 space-y-1">
              {(recentProfiles ?? []).map((p) => (
                <li key={p.id} className="flex items-center gap-3 rounded-sm px-2 py-2.5">
                  <Avatar src={p.avatar_url} name={p.full_name} size={36} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-medium text-ink/85">
                      {p.full_name ?? "New member"}
                    </p>
                    <p className="truncate text-[11.5px] text-ink/50">
                      {p.country ?? "—"} · {relativeTime(p.created_at)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <Link
              href="/admin/users"
              className="mt-4 block border-t border-ink/[0.07] pt-4 text-center text-[12.5px] font-medium text-brand-700 transition-colors hover:text-brand-700"
            >
              Manage people
            </Link>
          </SpotlightCard>
        </Reveal>
      </div>
    </div>
  );
}
