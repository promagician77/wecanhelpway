"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Search, SlidersHorizontal } from "lucide-react";
import { Avatar } from "@/components/ui/misc";
import { Badge, SpotlightCard } from "@/components/ui/feedback";
import { Input, Select } from "@/components/ui/field";
import { Tabs } from "@/components/ui/misc";
import { NEED_STATUS_META, PRIORITY_META, categoryLabel } from "@/lib/constants";
import { relativeTime, truncate } from "@/lib/utils";
import type { Need, NeedStatus } from "@/lib/types";

type Person = { id: string; full_name: string | null; avatar_url: string | null; email: string | null; country: string | null };

const OPEN: NeedStatus[] = ["submitted", "under_review", "looking_for_match", "needs_clarification", "match_suggested"];
const MATCHING: NeedStatus[] = ["connection_proposed", "connected", "conversation_active"];
const CLOSED: NeedStatus[] = ["resolved", "rejected", "archived"];

export function AdminNeedsTable({
  needs,
  profiles,
  proposedCounts,
}: {
  needs: Need[];
  profiles: Person[];
  proposedCounts: Record<string, number>;
}) {
  const [tab, setTab] = React.useState("open");
  const [query, setQuery] = React.useState("");
  const [priority, setPriority] = React.useState("");

  const byId = React.useMemo(() => new Map(profiles.map((p) => [p.id, p])), [profiles]);

  const filtered = React.useMemo(() => {
    const bucket =
      tab === "open" ? OPEN : tab === "matching" ? MATCHING : tab === "closed" ? CLOSED : null;

    const q = query.trim().toLowerCase();

    return needs
      .filter((n) => (bucket ? bucket.includes(n.status) : true))
      .filter((n) => (priority ? n.priority === priority : true))
      .filter((n) => {
        if (!q) return true;
        const person = byId.get(n.user_id);
        return (
          n.title.toLowerCase().includes(q) ||
          n.description.toLowerCase().includes(q) ||
          categoryLabel(n.category).toLowerCase().includes(q) ||
          (person?.full_name ?? "").toLowerCase().includes(q) ||
          (person?.email ?? "").toLowerCase().includes(q)
        );
      })
      // Oldest first inside the working buckets — the person waiting longest goes next.
      .sort((a, b) =>
        tab === "closed"
          ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          : new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );
  }, [needs, tab, query, priority, byId]);

  const counts = {
    open: needs.filter((n) => OPEN.includes(n.status)).length,
    matching: needs.filter((n) => MATCHING.includes(n.status)).length,
    closed: needs.filter((n) => CLOSED.includes(n.status)).length,
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { value: "open", label: "Needs triage", count: counts.open },
            { value: "matching", label: "In matching", count: counts.matching },
            { value: "closed", label: "Closed", count: counts.closed },
            { value: "all", label: "All", count: needs.length },
          ]}
        />

        <div className="ml-auto flex flex-1 flex-wrap items-center gap-3 sm:flex-none">
          <Input
            placeholder="Search title, description, person…"
            icon={<Search />}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            wrapperClassName="min-w-[16rem] flex-1"
          />
          <Select
            icon={<SlidersHorizontal />}
            placeholder="Any priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            wrapperClassName="w-44"
          >
            {Object.entries(PRIORITY_META).map(([value, meta]) => (
              <option key={value} value={value}>
                {meta.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="mt-6 space-y-2">
        {filtered.map((need, i) => {
          const meta = NEED_STATUS_META[need.status];
          const person = byId.get(need.user_id);
          const proposed = proposedCounts[need.id] ?? 0;

          return (
            <motion.div
              key={need.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.02, 0.25) }}
            >
              <Link href={`/admin/needs/${need.id}`}>
                <SpotlightCard className="group p-4 transition-transform duration-300 hover:-translate-y-0.5">
                  <div className="flex flex-wrap items-start gap-4">
                    <Avatar src={person?.avatar_url} name={person?.full_name} size={42} />

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-[14.5px] font-semibold text-ink/90 group-hover:text-ink">
                          {need.title}
                        </h3>
                        {need.priority !== "normal" && (
                          <Badge tone={PRIORITY_META[need.priority].tone}>
                            {PRIORITY_META[need.priority].label}
                          </Badge>
                        )}
                        {need.not_sure && <Badge tone="info">Not sure what they need</Badge>}
                        {proposed > 0 && (
                          <Badge tone="progress">
                            {proposed} proposed
                          </Badge>
                        )}
                      </div>

                      <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-ink/58">
                        {truncate(need.description, 190)}
                      </p>

                      <div className="mt-2.5 flex flex-wrap items-center gap-x-3.5 gap-y-1 text-[11.5px] text-ink/50">
                        <span className="font-medium text-brand-700/70">{categoryLabel(need.category)}</span>
                        <span>{person?.full_name ?? "Unknown"}</span>
                        {person?.country && <span>{person.country}</span>}
                        <span className="font-mono">{relativeTime(need.created_at)}</span>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-3">
                      <Badge tone={meta.tone} pulse={meta.tone === "progress"}>
                        {meta.label}
                      </Badge>
                      <ArrowUpRight className="size-4 text-ink/50 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand-700" />
                    </div>
                  </div>
                </SpotlightCard>
              </Link>
            </motion.div>
          );
        })}

        {filtered.length === 0 && (
          <p className="py-16 text-center text-[13.5px] text-ink/50">
            Nothing matches those filters.
          </p>
        )}
      </div>
    </div>
  );
}
