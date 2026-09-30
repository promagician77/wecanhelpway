"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Clock3, MapPin } from "lucide-react";
import { Badge, SpotlightCard } from "@/components/ui/feedback";
import { Tabs } from "@/components/ui/misc";
import { NEED_STATUS_META, categoryLabel } from "@/lib/constants";
import { relativeTime, truncate } from "@/lib/utils";
import type { Need } from "@/lib/types";

const CLOSED = ["resolved", "archived", "rejected"];

export function NeedList({ needs }: { needs: Need[] }) {
  const [tab, setTab] = React.useState("open");

  const open = needs.filter((n) => !CLOSED.includes(n.status));
  const closed = needs.filter((n) => CLOSED.includes(n.status));
  const shown = tab === "open" ? open : tab === "closed" ? closed : needs;

  return (
    <div>
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "open", label: "In progress", count: open.length },
          { value: "closed", label: "Closed", count: closed.length },
          { value: "all", label: "All", count: needs.length },
        ]}
      />

      <div className="mt-6 grid gap-3.5 md:grid-cols-2">
        {shown.map((need, i) => {
          const meta = NEED_STATUS_META[need.status];
          return (
            <motion.div
              key={need.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.4 }}
            >
              <Link href={`/needs/${need.id}`} className="block h-full">
                <SpotlightCard className="group h-full p-5 transition-transform duration-300 hover:-translate-y-0.5">
                  <div className="flex items-start justify-between gap-3">
                    <Badge tone={meta.tone} pulse={meta.tone === "progress"}>
                      {meta.label}
                    </Badge>
                    <ArrowUpRight className="size-4 shrink-0 text-ink/50 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand-700" />
                  </div>

                  <h3 className="mt-3.5 text-[15.5px] font-semibold leading-snug tracking-[-0.015em] text-ink/90 transition-colors group-hover:text-ink">
                    {need.title}
                  </h3>

                  <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-ink/58">
                    {truncate(need.description, 150)}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-x-3.5 gap-y-1.5 border-t border-ink/[0.06] pt-3.5 text-[11.5px] text-ink/50">
                    <span className="font-medium text-brand-700/70">{categoryLabel(need.category)}</span>
                    {need.location && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="size-3" />
                        {need.location}
                      </span>
                    )}
                    <span className="ml-auto inline-flex items-center gap-1 font-mono">
                      <Clock3 className="size-3" />
                      {relativeTime(need.created_at)}
                    </span>
                  </div>
                </SpotlightCard>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {shown.length === 0 && (
        <p className="py-14 text-center text-[13.5px] text-ink/50">
          Nothing in this view.
        </p>
      )}
    </div>
  );
}
