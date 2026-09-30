import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarClock,
  MapPin,
  MessageSquareQuote,
  Pencil,
  Sparkles,
  Target,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getNeedTimeline } from "@/actions/needs";
import { listMyConnections } from "@/actions/connections";
import { PageShell } from "@/components/app/page-header";
import { EventLog, JourneyRail } from "@/components/app/status-timeline";
import { Badge, SpotlightCard } from "@/components/ui/feedback";
import { Button } from "@/components/ui/button";
import { NeedActions } from "@/components/app/need-actions";
import { ConnectionCard } from "@/components/app/connection-card";
import { NEED_STATUS_META, categoryLabel } from "@/lib/constants";
import type { Need, StatusEvent } from "@/lib/types";

export const metadata: Metadata = { title: "Your request" };

export default async function NeedDetailPage({
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
  const { data } = await supabase.from("needs").select("*").eq("id", id).single();
  if (!data) notFound();

  const need = data as Need;
  const mine = need.user_id === profile.id;
  if (!mine) notFound();

  const [events, connections] = await Promise.all([getNeedTimeline(id), listMyConnections()]);
  const related = connections.filter((c) => c.need_id === id);
  const meta = NEED_STATUS_META[need.status];

  return (
    <PageShell className="max-w-4xl">
      <Link
        href="/needs"
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink/58 transition-colors hover:text-ink/80"
      >
        <ArrowLeft className="size-3.5" />
        All requests
      </Link>

      {isNew && (
        <div className="mt-6 flex items-start gap-3 rounded-md border border-positive/25 bg-positive/[0.08] px-5 py-4">
          <Sparkles className="mt-0.5 size-4 shrink-0 text-positive" />
          <div>
            <p className="text-[14px] font-semibold text-positive">Your request is in.</p>
            <p className="mt-1 text-[13px] leading-relaxed text-ink/55">
              Someone on our team will read it personally. You&apos;ll see every step below, and
              we&apos;ll email you when it moves.
            </p>
          </div>
        </div>
      )}

      {/* Header ----------------------------------------------------------- */}
      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={meta.tone} pulse={meta.tone === "progress"}>
              {meta.label}
            </Badge>
            <Badge>{categoryLabel(need.category)}</Badge>
            {need.not_sure && <Badge tone="info">Started unsure — that&apos;s fine</Badge>}
          </div>
          <h1 className="mt-3.5 text-[1.8rem] font-semibold leading-tight tracking-[-0.035em] text-ink sm:text-[2.1rem]">
            {need.title}
          </h1>
        </div>

        <div className="flex shrink-0 items-center gap-2.5">
          <Link href={`/needs/${need.id}/edit`}>
            <Button variant="glass" size="sm" icon={<Pencil />} magnetic={false}>
              Edit
            </Button>
          </Link>
          <NeedActions need={need} />
        </div>
      </div>

      {/* Journey ---------------------------------------------------------- */}
      <SpotlightCard className="mt-7 p-6 sm:p-7">
        <h2 className="mb-6 text-[13px] font-semibold uppercase tracking-[0.14em] text-ink/50">
          Where this is up to
        </h2>
        <JourneyRail status={need.status} />
      </SpotlightCard>

      {/* Proposed / live connections -------------------------------------- */}
      {related.length > 0 && (
        <div className="mt-5 space-y-3.5">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-ink/50">
            Introductions on this request
          </h2>
          {related.map((connection) => (
            <ConnectionCard key={connection.id} connection={connection} />
          ))}
        </div>
      )}

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        {/* What you told us ---------------------------------------------- */}
        <SpotlightCard className="p-6">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-ink/50">
            What you told us
          </h2>

          <p className="mt-4 whitespace-pre-wrap text-[14.5px] leading-relaxed text-ink/70">
            {need.description}
          </p>

          {need.goal && (
            <div className="mt-6 rounded-sm border border-ink/[0.07] bg-ink/[0.025] p-4">
              <p className="flex items-center gap-2 text-[11.5px] font-semibold uppercase tracking-[0.12em] text-brand-700/80">
                <Target className="size-3.5" />
                A good outcome
              </p>
              <p className="mt-2 whitespace-pre-wrap text-[13.5px] leading-relaxed text-ink/60">
                {need.goal}
              </p>
            </div>
          )}

          {need.preferences && (
            <div className="mt-3.5 rounded-sm border border-ink/[0.07] bg-ink/[0.025] p-4">
              <p className="flex items-center gap-2 text-[11.5px] font-semibold uppercase tracking-[0.12em] text-ink/58">
                <MessageSquareQuote className="size-3.5" />
                Other notes
              </p>
              <p className="mt-2 whitespace-pre-wrap text-[13.5px] leading-relaxed text-ink/60">
                {need.preferences}
              </p>
            </div>
          )}

          <dl className="mt-6 grid gap-4 border-t border-ink/[0.07] pt-5 sm:grid-cols-3">
            {need.help_type && (
              <Detail icon={<Sparkles className="size-3.5" />} label="Kind of help" value={need.help_type} />
            )}
            {need.location && (
              <Detail icon={<MapPin className="size-3.5" />} label="Location" value={need.location} />
            )}
            {need.availability && (
              <Detail icon={<CalendarClock className="size-3.5" />} label="Availability" value={need.availability} />
            )}
          </dl>
        </SpotlightCard>

        {/* Timeline ------------------------------------------------------- */}
        <SpotlightCard className="p-6">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-ink/50">
            Everything that&apos;s happened
          </h2>
          <div className="mt-5">
            <EventLog events={events as StatusEvent[]} />
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
