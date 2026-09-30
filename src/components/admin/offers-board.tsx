"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Ban, CheckCircle2, Search, ShieldCheck } from "lucide-react";
import { setOfferStatus } from "@/actions/admin";
import { Avatar, Tabs } from "@/components/ui/misc";
import { Badge, SpotlightCard, useToast } from "@/components/ui/feedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { OFFER_STATUS_META, categoryLabel } from "@/lib/constants";
import { relativeTime, truncate } from "@/lib/utils";
import type { Offer, OfferStatus } from "@/lib/types";

type Person = { id: string; full_name: string | null; avatar_url: string | null; email: string | null; country: string | null };

export function AdminOffersBoard({ offers, profiles }: { offers: Offer[]; profiles: Person[] }) {
  const [tab, setTab] = React.useState("new");
  const [query, setQuery] = React.useState("");
  const [busy, setBusy] = React.useState<string | null>(null);
  const { push } = useToast();
  const router = useRouter();

  const byId = React.useMemo(() => new Map(profiles.map((p) => [p.id, p])), [profiles]);

  const buckets: Record<string, OfferStatus[] | null> = {
    new: ["submitted", "under_review", "needs_clarification"],
    active: ["active", "matched"],
    inactive: ["paused", "rejected", "archived"],
    all: null,
  };

  const filtered = React.useMemo(() => {
    const bucket = buckets[tab];
    const q = query.trim().toLowerCase();
    return offers
      .filter((o) => (bucket ? bucket.includes(o.status) : true))
      .filter((o) => {
        if (!q) return true;
        const person = byId.get(o.user_id);
        return (
          o.title.toLowerCase().includes(q) ||
          o.description.toLowerCase().includes(q) ||
          o.skills.some((s) => s.toLowerCase().includes(q)) ||
          (person?.full_name ?? "").toLowerCase().includes(q)
        );
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offers, tab, query, byId]);

  async function apply(offerId: string, status: OfferStatus) {
    setBusy(offerId + status);
    const result = await setOfferStatus(offerId, status);
    setBusy(null);
    if (result.ok) {
      push({ tone: "success", title: result.message ?? "Updated" });
      router.refresh();
    } else {
      push({ tone: "danger", title: "That didn't work", description: result.error });
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { value: "new", label: "Needs review", count: offers.filter((o) => buckets.new!.includes(o.status)).length },
            { value: "active", label: "Active", count: offers.filter((o) => buckets.active!.includes(o.status)).length },
            { value: "inactive", label: "Inactive", count: offers.filter((o) => buckets.inactive!.includes(o.status)).length },
            { value: "all", label: "All", count: offers.length },
          ]}
        />
        <Input
          placeholder="Search offers, skills, people…"
          icon={<Search />}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          wrapperClassName="ml-auto min-w-[16rem] flex-1 sm:flex-none sm:w-80"
        />
      </div>

      <div className="mt-6 grid gap-3 lg:grid-cols-2">
        {filtered.map((offer, i) => {
          const meta = OFFER_STATUS_META[offer.status];
          const person = byId.get(offer.user_id);

          return (
            <motion.div
              key={offer.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.3) }}
            >
              <SpotlightCard className="h-full p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar src={person?.avatar_url} name={person?.full_name} size={38} />
                    <div className="min-w-0">
                      <p className="truncate text-[13.5px] font-medium text-ink/85">
                        {person?.full_name ?? "Unknown"}
                      </p>
                      <p className="truncate text-[11px] text-ink/50">
                        {person?.country ?? "—"} · {relativeTime(offer.created_at)}
                      </p>
                    </div>
                  </div>
                  <Badge tone={meta.tone} pulse={meta.tone === "progress"}>
                    {meta.label}
                  </Badge>
                </div>

                <h3 className="mt-4 text-[15px] font-semibold leading-snug text-ink/90">
                  {offer.title}
                </h3>
                <p className="mt-2 line-clamp-3 text-[13px] leading-relaxed text-ink/58">
                  {truncate(offer.description, 220)}
                </p>

                {offer.skills.length > 0 && (
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {offer.skills.slice(0, 8).map((s) => (
                      <li
                        key={s}
                        className="rounded-full border border-aqua-400/20 bg-aqua-500/[0.08] px-2 py-0.5 text-[11px] text-aqua-600"
                      >
                        {s}
                      </li>
                    ))}
                  </ul>
                )}

                <p className="mt-3 text-[11.5px] text-ink/50">
                  <span className="text-aqua-600/70">{categoryLabel(offer.category, "offer")}</span>
                  {offer.availability && ` · ${offer.availability}`}
                  {offer.experience && ` · ${offer.experience}`}
                </p>

                <div className="mt-4 flex flex-wrap gap-2 border-t border-ink/[0.07] pt-4">
                  <Button
                    size="sm"
                    variant="glass"
                    magnetic={false}
                    icon={<ShieldCheck />}
                    loading={busy === offer.id + "under_review"}
                    disabled={offer.status === "under_review"}
                    onClick={() => apply(offer.id, "under_review")}
                  >
                    Reviewing
                  </Button>
                  <Button
                    size="sm"
                    variant="success"
                    magnetic={false}
                    icon={<CheckCircle2 />}
                    loading={busy === offer.id + "active"}
                    disabled={offer.status === "active"}
                    onClick={() => apply(offer.id, "active")}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    magnetic={false}
                    icon={<Ban />}
                    loading={busy === offer.id + "rejected"}
                    disabled={offer.status === "rejected"}
                    onClick={() => apply(offer.id, "rejected")}
                  >
                    Reject
                  </Button>
                </div>
              </SpotlightCard>
            </motion.div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <p className="py-16 text-center text-[13.5px] text-ink/50">Nothing in this view.</p>
      )}
    </div>
  );
}
