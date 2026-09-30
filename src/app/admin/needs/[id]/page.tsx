import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarClock, Globe2, Mail, MapPin, Phone, Sparkles, Target } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { findCandidates } from "@/actions/admin";
import { Badge, SpotlightCard } from "@/components/ui/feedback";
import { Avatar } from "@/components/ui/misc";
import { EventLog } from "@/components/app/status-timeline";
import { AdminNeedControls } from "@/components/admin/need-controls";
import { MatchWorkspace } from "@/components/admin/match-workspace";
import { AdminNotes } from "@/components/admin/admin-notes";
import { NEED_STATUS_META, PRIORITY_META, categoryLabel } from "@/lib/constants";
import { relativeTime } from "@/lib/utils";
import type { AdminNote, Connection, Need, Profile, StatusEvent } from "@/lib/types";

export const metadata: Metadata = { title: "Review request" };
export const dynamic = "force-dynamic";

export default async function AdminNeedDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAdmin();
  const admin = createAdminClient();

  const { data: need } = await admin.from("needs").select("*").eq("id", id).single();
  if (!need) notFound();

  const [{ data: requester }, { data: events }, { data: notes }, { data: connections }, candidates] =
    await Promise.all([
      admin.from("profiles").select("*").eq("id", need.user_id).single(),
      admin
        .from("status_events")
        .select("*")
        .eq("entity_type", "need")
        .eq("entity_id", id)
        .order("created_at", { ascending: true }),
      admin
        .from("admin_notes")
        .select("*")
        .eq("entity_type", "need")
        .eq("entity_id", id)
        .order("created_at", { ascending: false }),
      admin.from("connections").select("*").eq("need_id", id).order("created_at", { ascending: false }),
      findCandidates(id),
    ]);

  const helperIds = [...new Set((connections ?? []).map((c) => c.helper_id))];
  const { data: helpers } = helperIds.length
    ? await admin.from("profiles").select("id, full_name, avatar_url").in("id", helperIds)
    : { data: [] };
  const helperById = new Map((helpers ?? []).map((h) => [h.id, h]));

  const typedNeed = need as Need;
  const meta = NEED_STATUS_META[typedNeed.status];
  const profile = requester as Profile | null;

  return (
    <div>
      <Link
        href="/admin/needs"
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink/58 transition-colors hover:text-ink/80"
      >
        <ArrowLeft className="size-3.5" />
        Back to the queue
      </Link>

      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={meta.tone} pulse={meta.tone === "progress"}>
              {meta.label}
            </Badge>
            <Badge tone={PRIORITY_META[typedNeed.priority].tone}>
              {PRIORITY_META[typedNeed.priority].label} priority
            </Badge>
            <Badge>{categoryLabel(typedNeed.category)}</Badge>
            {typedNeed.not_sure && <Badge tone="info">Not sure what they need</Badge>}
          </div>
          <h1 className="mt-3.5 text-[1.8rem] font-semibold leading-tight tracking-[-0.035em] text-ink">
            {typedNeed.title}
          </h1>
          <p className="mt-2 font-mono text-[11.5px] text-ink/50">
            Submitted {relativeTime(typedNeed.created_at)} · {new Date(typedNeed.created_at).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="mt-7 grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-5">
          {/* What they wrote --------------------------------------------- */}
          <SpotlightCard className="p-6">
            <h2 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-ink/50">
              What they wrote
            </h2>
            <p className="mt-4 whitespace-pre-wrap text-[14.5px] leading-relaxed text-ink/75">
              {typedNeed.description}
            </p>

            {typedNeed.goal && (
              <div className="mt-5 rounded-sm border border-ink/[0.07] bg-ink/[0.025] p-4">
                <p className="flex items-center gap-2 text-[11.5px] font-semibold uppercase tracking-[0.12em] text-brand-700/80">
                  <Target className="size-3.5" />
                  What a good outcome looks like
                </p>
                <p className="mt-2 whitespace-pre-wrap text-[13.5px] leading-relaxed text-ink/60">
                  {typedNeed.goal}
                </p>
              </div>
            )}

            {typedNeed.preferences && (
              <div className="mt-3.5 rounded-sm border border-ink/[0.07] bg-ink/[0.025] p-4">
                <p className="text-[11.5px] font-semibold uppercase tracking-[0.12em] text-ink/58">
                  Preferences
                </p>
                <p className="mt-2 whitespace-pre-wrap text-[13.5px] leading-relaxed text-ink/60">
                  {typedNeed.preferences}
                </p>
              </div>
            )}

            <dl className="mt-5 grid gap-4 border-t border-ink/[0.07] pt-5 sm:grid-cols-3">
              {typedNeed.help_type && <Detail icon={<Sparkles className="size-3.5" />} label="Kind of help" value={typedNeed.help_type} />}
              {typedNeed.location && <Detail icon={<MapPin className="size-3.5" />} label="Location" value={typedNeed.location} />}
              {typedNeed.availability && <Detail icon={<CalendarClock className="size-3.5" />} label="Availability" value={typedNeed.availability} />}
            </dl>
          </SpotlightCard>

          {/* Matching ----------------------------------------------------- */}
          <MatchWorkspace
            needId={typedNeed.id}
            initialCandidates={candidates}
            existingConnections={(connections ?? []).map((c: Connection) => ({
              ...c,
              helper_name: helperById.get(c.helper_id)?.full_name ?? "Unknown",
              helper_avatar: helperById.get(c.helper_id)?.avatar_url ?? null,
            }))}
          />

          {/* Timeline ----------------------------------------------------- */}
          <SpotlightCard className="p-6">
            <h2 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-ink/50">
              Connection history
            </h2>
            <div className="mt-5">
              <EventLog events={(events ?? []) as StatusEvent[]} />
            </div>
          </SpotlightCard>
        </div>

        {/* Sidebar -------------------------------------------------------- */}
        <div className="space-y-5">
          {/* The person -------------------------------------------------- */}
          <SpotlightCard className="p-6">
            <h2 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-ink/50">
              Who asked
            </h2>
            <div className="mt-4 flex items-start gap-3.5">
              <Avatar src={profile?.avatar_url} name={profile?.full_name} size={52} ring />
              <div className="min-w-0">
                <p className="text-[15px] font-semibold text-ink">{profile?.full_name ?? "Unknown"}</p>
                {profile?.country && (
                  <p className="mt-0.5 inline-flex items-center gap-1.5 text-[12px] text-ink/58">
                    <Globe2 className="size-3" />
                    {profile.country}
                  </p>
                )}
              </div>
            </div>

            {profile?.bio && (
              <p className="mt-4 text-[13px] leading-relaxed text-ink/62">{profile.bio}</p>
            )}

            <dl className="mt-4 space-y-2.5 border-t border-ink/[0.07] pt-4 text-[12.5px]">
              {profile?.email && (
                <div className="flex items-center gap-2 text-ink/62">
                  <Mail className="size-3.5 shrink-0 text-ink/50" />
                  <span className="truncate">{profile.email}</span>
                </div>
              )}
              {profile?.phone && (
                <div className="flex items-center gap-2 text-ink/62">
                  <Phone className="size-3.5 shrink-0 text-ink/50" />
                  <span>{profile.phone}</span>
                  {profile.phone_verified && <Badge tone="success">verified</Badge>}
                </div>
              )}
            </dl>

            {(profile?.skills?.length || profile?.languages?.length) && (
              <div className="mt-4 space-y-3 border-t border-ink/[0.07] pt-4">
                {profile.languages.length > 0 && (
                  <TagRow label="Speaks" tags={profile.languages} />
                )}
                {profile.skills.length > 0 && <TagRow label="Skills" tags={profile.skills} />}
              </div>
            )}

            <Link
              href={`/admin/users?q=${encodeURIComponent(profile?.email ?? "")}`}
              className="mt-5 block rounded-sm border border-ink/10 bg-ink/[0.03] py-2.5 text-center text-[12.5px] font-medium text-ink/60 transition-all hover:border-ink/20 hover:text-ink"
            >
              View full profile
            </Link>
          </SpotlightCard>

          {/* Controls ---------------------------------------------------- */}
          <AdminNeedControls need={typedNeed} />

          {/* Internal notes ---------------------------------------------- */}
          <AdminNotes entityType="need" entityId={typedNeed.id} notes={(notes ?? []) as AdminNote[]} />
        </div>
      </div>
    </div>
  );
}

function Detail({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.1em] text-ink/50">
        {icon}
        {label}
      </dt>
      <dd className="mt-1.5 text-[13px] leading-snug text-ink/70">{value}</dd>
    </div>
  );
}

function TagRow({ label, tags }: { label: string; tags: string[] }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-ink/50">{label}</p>
      <ul className="mt-2 flex flex-wrap gap-1.5">
        {tags.map((t) => (
          <li
            key={t}
            className="rounded-full border border-ink/10 bg-ink/[0.04] px-2.5 py-1 text-[11.5px] text-ink/55"
          >
            {t}
          </li>
        ))}
      </ul>
    </div>
  );
}
