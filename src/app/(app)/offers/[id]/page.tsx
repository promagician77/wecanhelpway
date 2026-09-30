import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Award, CalendarClock, Globe2, HandHeart, MapPin, Pencil, Sparkles } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { listMyConnections } from "@/actions/connections";
import { PageShell } from "@/components/app/page-header";
import { Badge, SpotlightCard } from "@/components/ui/feedback";
import { Button } from "@/components/ui/button";
import { EventLog } from "@/components/app/status-timeline";
import { ConnectionCard } from "@/components/app/connection-card";
import { OfferPauseToggle } from "@/components/app/offer-pause-toggle";
import { OFFER_STATUS_META, categoryLabel } from "@/lib/constants";
import type { Offer, StatusEvent } from "@/lib/types";

export const metadata: Metadata = { title: "Your offer" };

export default async function OfferDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ new?: string }>;
}) {
  const { id } = await params;
  const { new: isNew } = await searchParams;
  const { profile } = await requireUser();

  const supabase = await createClient();
  const { data } = await supabase.from("offers").select("*").eq("id", id).single();
  if (!data || data.user_id !== profile.id) notFound();

  const offer = data as Offer;
  const meta = OFFER_STATUS_META[offer.status];

  const admin = createAdminClient();
  const [{ data: events }, connections] = await Promise.all([
    admin
      .from("status_events")
      .select("*")
      .eq("entity_type", "offer")
      .eq("entity_id", id)
      .eq("is_internal", false)
      .order("created_at", { ascending: true }),
    listMyConnections(),
  ]);

  const related = connections.filter((c) => c.offer_id === id);

  return (
    <PageShell className="max-w-4xl">
      <Link
        href="/offers"
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink/58 transition-colors hover:text-ink/80"
      >
        <ArrowLeft className="size-3.5" />
        All offers
      </Link>

      {isNew && (
        <div className="mt-6 flex items-start gap-3 rounded-md border border-positive/25 bg-positive/[0.08] px-5 py-4">
          <Sparkles className="mt-0.5 size-4 shrink-0 text-positive" />
          <div>
            <p className="text-[14px] font-semibold text-positive">Thank you — this matters.</p>
            <p className="mt-1 text-[13px] leading-relaxed text-ink/55">
              Our team will review your offer and come back to you when we find someone it fits.
            </p>
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={meta.tone} pulse={meta.tone === "progress"}>
              {meta.label}
            </Badge>
            <Badge>{categoryLabel(offer.category, "offer")}</Badge>
          </div>
          <h1 className="mt-3.5 text-[1.8rem] font-semibold leading-tight tracking-[-0.035em] text-ink sm:text-[2.1rem]">
            {offer.title}
          </h1>
        </div>

        <div className="flex shrink-0 items-center gap-2.5">
          <Link href={`/offers/${offer.id}/edit`}>
            <Button variant="glass" size="sm" icon={<Pencil />} magnetic={false}>
              Edit
            </Button>
          </Link>
          <OfferPauseToggle offerId={offer.id} paused={offer.status === "paused"} />
        </div>
      </div>

      {related.length > 0 && (
        <div className="mt-7 space-y-3.5">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-ink/50">
            People we&apos;ve matched you with
          </h2>
          {related.map((connection) => (
            <ConnectionCard key={connection.id} connection={connection} />
          ))}
        </div>
      )}

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <SpotlightCard className="p-6">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-ink/50">
            What you offered
          </h2>
          <p className="mt-4 whitespace-pre-wrap text-[14.5px] leading-relaxed text-ink/70">
            {offer.description}
          </p>

          {offer.skills.length > 0 && (
            <ul className="mt-5 flex flex-wrap gap-1.5">
              {offer.skills.map((s) => (
                <li
                  key={s}
                  className="rounded-full border border-aqua-400/20 bg-aqua-500/[0.08] px-2.5 py-1 text-[11.5px] text-aqua-600"
                >
                  {s}
                </li>
              ))}
            </ul>
          )}

          <dl className="mt-6 grid gap-4 border-t border-ink/[0.07] pt-5 sm:grid-cols-2">
            {offer.experience && <Detail icon={<Award className="size-3.5" />} label="Experience" value={offer.experience} />}
            {offer.availability && <Detail icon={<CalendarClock className="size-3.5" />} label="Availability" value={offer.availability} />}
            {offer.preferred_help && <Detail icon={<HandHeart className="size-3.5" />} label="Preferred help" value={offer.preferred_help} />}
            {offer.location && <Detail icon={<MapPin className="size-3.5" />} label="Location" value={offer.location} />}
            {offer.timezone && <Detail icon={<Globe2 className="size-3.5" />} label="Time zone" value={offer.timezone} />}
          </dl>
        </SpotlightCard>

        <SpotlightCard className="p-6">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-ink/50">
            Activity
          </h2>
          <div className="mt-5">
            <EventLog events={(events ?? []) as StatusEvent[]} />
          </div>
        </SpotlightCard>
      </div>
    </PageShell>
  );
}

function Detail({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.1em] text-ink/50">
        {icon}
        {label}
      </dt>
      <dd className="mt-1.5 text-[13.5px] leading-snug text-ink/70">{value}</dd>
    </div>
  );
}
