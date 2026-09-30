"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Handshake, Search, UserSearch, X } from "lucide-react";
import { cancelConnection, findCandidates, proposeConnection, type Candidate } from "@/actions/admin";
import { Avatar, Modal } from "@/components/ui/misc";
import { Badge, SpotlightCard, Spinner, useToast } from "@/components/ui/feedback";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/field";
import { CONNECTION_STATUS_META, categoryLabel } from "@/lib/constants";
import { cn, relativeTime, truncate } from "@/lib/utils";
import type { Connection } from "@/lib/types";

type ExistingConnection = Connection & { helper_name: string; helper_avatar: string | null };

/**
 * The manual match. Stage 1 has no AI and no recommendation engine on purpose:
 * a person reads the request, reads the offers, and chooses. The "reasons"
 * chips below are search context, not a score.
 */
export function MatchWorkspace({
  needId,
  initialCandidates,
  existingConnections,
}: {
  needId: string;
  initialCandidates: Candidate[];
  existingConnections: ExistingConnection[];
}) {
  const [candidates, setCandidates] = React.useState(initialCandidates);
  const [query, setQuery] = React.useState("");
  const [searching, setSearching] = React.useState(false);
  const [selected, setSelected] = React.useState<Candidate | null>(null);
  const [message, setMessage] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [cancelTarget, setCancelTarget] = React.useState<ExistingConnection | null>(null);
  const [cancelReason, setCancelReason] = React.useState("");
  const { push } = useToast();
  const router = useRouter();

  const alreadyProposed = new Set(
    existingConnections
      .filter((c) => ["proposed", "partially_accepted", "connected"].includes(c.status))
      .map((c) => c.helper_id),
  );

  // Debounced re-search against the offers table.
  React.useEffect(() => {
    const t = setTimeout(async () => {
      setSearching(true);
      setCandidates(await findCandidates(needId, query));
      setSearching(false);
    }, 320);
    return () => clearTimeout(t);
  }, [query, needId]);

  async function propose() {
    if (!selected) return;
    setBusy(true);
    const result = await proposeConnection({
      needId,
      helperId: selected.id,
      offerId: selected.offer?.id ?? null,
      message: message.trim() || undefined,
    });
    setBusy(false);
    setSelected(null);
    setMessage("");

    if (result.ok) {
      push({
        tone: "success",
        title: "Connection proposed",
        description: "Both people have been notified. Neither can message the other until both accept.",
      });
      router.refresh();
    } else {
      push({ tone: "danger", title: "Couldn't propose that", description: result.error });
    }
  }

  async function cancel() {
    if (!cancelTarget) return;
    setBusy(true);
    const result = await cancelConnection(cancelTarget.id, cancelReason);
    setBusy(false);
    setCancelTarget(null);
    setCancelReason("");
    if (result.ok) {
      push({ tone: "success", title: result.message ?? "Cancelled" });
      router.refresh();
    } else {
      push({ tone: "danger", title: "That didn't work", description: result.error });
    }
  }

  return (
    <SpotlightCard className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2.5 text-[13px] font-semibold uppercase tracking-[0.14em] text-ink/50">
          <Handshake className="size-3.5" />
          Find a match
        </h2>
        <span className="rounded-full border border-ink/[0.08] bg-ink/[0.03] px-2.5 py-1 text-[11px] text-ink/50">
          Chosen by a person, not an algorithm
        </span>
      </div>

      {/* Existing proposals ---------------------------------------------- */}
      {existingConnections.length > 0 && (
        <div className="mt-5 space-y-2">
          <p className="text-[11.5px] font-medium uppercase tracking-[0.1em] text-ink/50">
            Already proposed
          </p>
          {existingConnections.map((c) => {
            const meta = CONNECTION_STATUS_META[c.status];
            return (
              <div
                key={c.id}
                className="flex flex-wrap items-center gap-3 rounded-sm border border-ink/[0.07] bg-ink/[0.025] p-3.5"
              >
                <Avatar src={c.helper_avatar} name={c.helper_name} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-medium text-ink/85">{c.helper_name}</p>
                  <p className="mt-0.5 text-[11.5px] text-ink/50">
                    asked {relativeTime(c.created_at)} · them: {c.helper_response} · requester:{" "}
                    {c.requester_response}
                  </p>
                </div>
                <Badge tone={meta.tone} pulse={meta.tone === "progress"}>
                  {meta.label}
                </Badge>
                {["proposed", "partially_accepted"].includes(c.status) && (
                  <Button
                    size="sm"
                    variant="ghost"
                    magnetic={false}
                    icon={<X />}
                    onClick={() => setCancelTarget(c)}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Search ----------------------------------------------------------- */}
      <div className="mt-6">
        <Input
          placeholder="Search offers by skill, category, or what they wrote…"
          icon={searching ? <Spinner size={17} /> : <Search />}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* Candidates ------------------------------------------------------- */}
      <div className="mt-5">
        <AnimatePresence mode="popLayout">
          {candidates.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-2.5 rounded-sm border border-dashed border-ink/10 py-12 text-center"
            >
              <UserSearch className="size-6 text-ink/50" />
              <p className="text-[13.5px] text-ink/50">
                {query ? "Nobody matches that search." : "Nobody has offered help in this area yet."}
              </p>
            </motion.div>
          ) : (
            <ul className="space-y-2">
              {candidates.map((candidate, i) => {
                const proposed = alreadyProposed.has(candidate.id);
                return (
                  <motion.li
                    key={`${candidate.id}-${candidate.offer?.id}`}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: Math.min(i * 0.03, 0.25) }}
                    className={cn(
                      "rounded-sm border p-4 transition-colors",
                      proposed
                        ? "border-positive/20 bg-positive/[0.05]"
                        : "border-ink/[0.07] bg-ink/[0.022] hover:border-ink/15",
                    )}
                  >
                    <div className="flex flex-wrap items-start gap-3.5">
                      <Avatar src={candidate.avatar_url} name={candidate.full_name} size={44} />

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-[14.5px] font-semibold text-ink/90">
                            {candidate.full_name ?? "Unnamed"}
                          </p>
                          {candidate.country && (
                            <span className="text-[11.5px] text-ink/50">{candidate.country}</span>
                          )}
                          {candidate.reasons.map((r) => (
                            <Badge key={r} tone="info">
                              {r}
                            </Badge>
                          ))}
                        </div>

                        {candidate.offer && (
                          <>
                            <p className="mt-2 text-[13.5px] font-medium text-ink/75">
                              {candidate.offer.title}
                            </p>
                            <p className="mt-1 line-clamp-2 text-[12.5px] leading-relaxed text-ink/58">
                              {truncate(candidate.offer.description, 180)}
                            </p>
                            <p className="mt-2 flex flex-wrap items-center gap-x-3 text-[11px] text-ink/50">
                              <span className="text-aqua-600/70">
                                {categoryLabel(candidate.offer.category, "offer")}
                              </span>
                              {candidate.offer.availability && <span>{candidate.offer.availability}</span>}
                            </p>
                          </>
                        )}

                        {candidate.skills.length > 0 && (
                          <ul className="mt-2.5 flex flex-wrap gap-1.5">
                            {candidate.skills.slice(0, 8).map((s) => (
                              <li
                                key={s}
                                className="rounded-full border border-ink/10 bg-ink/[0.04] px-2 py-0.5 text-[11px] text-ink/62"
                              >
                                {s}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      <div className="shrink-0">
                        {proposed ? (
                          <span className="inline-flex items-center gap-1.5 rounded-sm border border-positive/25 bg-positive/10 px-3 py-2 text-[12px] font-medium text-positive">
                            <Check className="size-3.5" />
                            Proposed
                          </span>
                        ) : (
                          <Button size="sm" magnetic={false} onClick={() => setSelected(candidate)}>
                            Propose connection
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.li>
                );
              })}
            </ul>
          )}
        </AnimatePresence>
      </div>

      {/* Propose modal ---------------------------------------------------- */}
      <Modal
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={`Propose ${selected?.full_name ?? "this person"}?`}
        description="Both people get a notification and an email. Neither can message the other until they both accept — and either can decline without giving a reason."
        size="md"
        footer={
          <>
            <Button variant="ghost" size="md" magnetic={false} onClick={() => setSelected(null)}>
              Cancel
            </Button>
            <Button size="md" magnetic={false} loading={busy} onClick={propose} icon={<Handshake />}>
              Propose connection
            </Button>
          </>
        }
      >
        <Textarea
          label="Why these two? (shown to both)"
          rows={4}
          maxChars={800}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          hint="A sentence goes a long way. “Alex builds React Native apps and has mentored two people through their first launch.”"
        />
      </Modal>

      {/* Cancel modal ----------------------------------------------------- */}
      <Modal
        open={cancelTarget !== null}
        onClose={() => setCancelTarget(null)}
        title="Withdraw this proposal?"
        description="Both people are told. The request goes back to “We're looking for a match”."
        size="sm"
        footer={
          <>
            <Button variant="ghost" size="md" magnetic={false} onClick={() => setCancelTarget(null)}>
              Keep it
            </Button>
            <Button variant="danger" size="md" magnetic={false} loading={busy} onClick={cancel}>
              Withdraw
            </Button>
          </>
        }
      >
        <Textarea
          label="Reason (shown to both)"
          rows={3}
          maxChars={500}
          value={cancelReason}
          onChange={(e) => setCancelReason(e.target.value)}
        />
      </Modal>
    </SpotlightCard>
  );
}
