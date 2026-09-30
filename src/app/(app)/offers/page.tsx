import type { Metadata } from "next";
import Link from "next/link";
import { HandHeart, Plus } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, PageShell } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Badge, EmptyState, SpotlightCard } from "@/components/ui/feedback";
import { OFFER_STATUS_META, categoryLabel } from "@/lib/constants";
import { relativeTime, truncate } from "@/lib/utils";
import type { Offer } from "@/lib/types";

export const metadata: Metadata = { title: "I Want to Help" };

export default async function OffersPage() {
  const { profile } = await requireUser();
  const supabase = await createClient();

  const { data } = await supabase
    .from("offers")
    .select("*")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false });

  const offers = (data ?? []) as Offer[];

  return (
    <PageShell>
      <PageHeader
        eyebrow="I want to help"
        title="What you're offering"
        description="Everything you've told us you could help with. Our team matches these to real people."
        actions={
          <Link href="/offers/new">
            <Button size="md" icon={<Plus />}>
              New offer
            </Button>
          </Link>
        }
      />

      <div className="mt-8">
        {offers.length === 0 ? (
          <EmptyState
            icon={<HandHeart />}
            title="You haven't offered anything yet"
            description="An hour of what you already know can change somebody's year. Tell us what you'd be glad to help with."
            action={
              <Link href="/offers/new">
                <Button size="lg" icon={<Plus />}>
                  Offer to help
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="grid gap-3.5 md:grid-cols-2">
            {offers.map((offer) => {
              const meta = OFFER_STATUS_META[offer.status];
              return (
                <Link key={offer.id} href={`/offers/${offer.id}`} className="block h-full">
                  <SpotlightCard className="group h-full p-5 transition-transform duration-300 hover:-translate-y-0.5">
                    <div className="flex items-start justify-between gap-3">
                      <Badge tone={meta.tone} pulse={meta.tone === "progress"}>
                        {meta.label}
                      </Badge>
                      <span className="font-mono text-[10.5px] text-ink/50">
                        {relativeTime(offer.created_at)}
                      </span>
                    </div>

                    <h3 className="mt-3.5 text-[15.5px] font-semibold leading-snug tracking-[-0.015em] text-ink/90 transition-colors group-hover:text-ink">
                      {offer.title}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-ink/58">
                      {truncate(offer.description, 150)}
                    </p>

                    {offer.skills.length > 0 && (
                      <ul className="mt-3.5 flex flex-wrap gap-1.5">
                        {offer.skills.slice(0, 5).map((s) => (
                          <li
                            key={s}
                            className="rounded-full border border-aqua-400/20 bg-aqua-500/[0.08] px-2.5 py-1 text-[11px] text-aqua-600"
                          >
                            {s}
                          </li>
                        ))}
                      </ul>
                    )}

                    <p className="mt-4 border-t border-ink/[0.06] pt-3.5 text-[11.5px] font-medium text-aqua-600/70">
                      {categoryLabel(offer.category, "offer")}
                    </p>
                  </SpotlightCard>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </PageShell>
  );
}
