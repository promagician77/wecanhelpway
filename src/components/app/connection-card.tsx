"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Check,
  CheckCheck,
  Clock,
  Globe2,
  MessagesSquare,
  Quote,
  ShieldCheck,
  X,
} from "lucide-react";
import { completeConnection, respondToConnection, type ConnectionView } from "@/actions/connections";
import { Avatar, Modal } from "@/components/ui/misc";
import { Badge, AuroraCard, SpotlightCard, useToast } from "@/components/ui/feedback";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/field";
import { CONNECTION_STATUS_META } from "@/lib/constants";
import { cn, relativeTime } from "@/lib/utils";

/**
 * One proposed or live connection. When it's waiting on this user it gets the
 * rotating aurora border — it's the one thing on the page that needs an answer.
 */
export function ConnectionCard({ connection }: { connection: ConnectionView }) {
  const [decision, setDecision] = React.useState<"accepted" | "declined" | null>(null);
  const [note, setNote] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const { push } = useToast();
  const router = useRouter();

  const meta = CONNECTION_STATUS_META[connection.status];
  const awaitingMe =
    connection.my_response === "pending" && ["proposed", "partially_accepted"].includes(connection.status);
  const isLive = connection.status === "connected";

  async function submit() {
    if (!decision) return;
    setBusy(true);
    const result = await respondToConnection(connection.id, decision, note.trim() || undefined);
    setBusy(false);
    setDecision(null);
    setNote("");

    if (result.ok) {
      push({
        tone: decision === "accepted" ? "success" : "neutral",
        title: result.message ?? "Saved",
        description:
          decision === "accepted" && result.data?.conversationId
            ? "Your private conversation is open."
            : undefined,
      });
      if (result.data?.conversationId) router.push(`/messages/${result.data.conversationId}`);
      else router.refresh();
    } else {
      push({ tone: "danger", title: "That didn't work", description: result.error });
    }
  }

  async function markComplete() {
    setBusy(true);
    const result = await completeConnection(connection.id);
    setBusy(false);
    if (result.ok) {
      push({ tone: "success", title: result.message ?? "Marked complete" });
      router.refresh();
    } else {
      push({ tone: "danger", title: "That didn't work", description: result.error });
    }
  }

  const Wrapper = awaitingMe ? AuroraCard : SpotlightCard;
  const context = connection.need ?? connection.offer;

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Wrapper className={cn(awaitingMe ? "" : "rounded-lg")}>
          <div className="p-5 sm:p-6">
            {/* Header ---------------------------------------------------- */}
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <Badge tone={meta.tone} pulse={awaitingMe}>
                  {awaitingMe ? "Waiting on you" : meta.label}
                </Badge>
                <Badge>{connection.my_role === "requester" ? "You asked" : "You offered"}</Badge>
              </div>
              <span className="font-mono text-[10.5px] text-ink/50">
                {relativeTime(connection.created_at)}
              </span>
            </div>

            {/* The person ------------------------------------------------ */}
            <div className="mt-5 flex items-start gap-4">
              <Avatar
                src={connection.other.avatar_url}
                name={connection.other.full_name}
                size={56}
                ring={awaitingMe}
              />
              <div className="min-w-0 flex-1">
                <h3 className="text-[16.5px] font-semibold tracking-[-0.02em] text-ink">
                  {connection.other.full_name ?? "A member of our community"}
                </h3>
                {connection.other.country && (
                  <p className="mt-1 inline-flex items-center gap-1.5 text-[12.5px] text-ink/58">
                    <Globe2 className="size-3.5" />
                    {connection.other.country}
                  </p>
                )}
                {connection.other.bio && (
                  <p className="mt-2 line-clamp-3 text-[13.5px] leading-relaxed text-ink/62">
                    {connection.other.bio}
                  </p>
                )}
                {connection.other.skills?.length > 0 && (
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {connection.other.skills.slice(0, 6).map((s) => (
                      <li
                        key={s}
                        className="rounded-full border border-ink/10 bg-ink/[0.04] px-2.5 py-1 text-[11.5px] text-ink/55"
                      >
                        {s}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Context --------------------------------------------------- */}
            {context && (
              <div className="mt-5 rounded-sm border border-ink/[0.07] bg-ink/[0.025] px-4 py-3.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink/50">
                  {connection.my_role === "requester" ? "About your request" : "They need help with"}
                </p>
                <p className="mt-1.5 text-[14px] font-medium text-ink/80">{context.title}</p>
              </div>
            )}

            {/* Why we matched you ---------------------------------------- */}
            {connection.admin_message && (
              <div className="mt-3.5 flex gap-3 rounded-sm border border-brand-400/20 bg-brand-500/[0.08] px-4 py-3.5">
                <Quote className="mt-0.5 size-4 shrink-0 text-brand-700" />
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-700/80">
                    From the WeCanHelpWay team
                  </p>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink/65">
                    {connection.admin_message}
                  </p>
                </div>
              </div>
            )}

            {/* State of play --------------------------------------------- */}
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-ink/[0.07] pt-4 text-[12.5px]">
              <Party label="You" response={connection.my_response} />
              <Party
                label={connection.other.full_name?.split(" ")[0] ?? "Them"}
                response={
                  connection.my_role === "requester" ? connection.helper_response : connection.requester_response
                }
              />
            </div>

            {/* Actions --------------------------------------------------- */}
            {awaitingMe && (
              <>
                <div className="mt-5 flex flex-wrap gap-2.5">
                  <Button size="md" icon={<Check />} onClick={() => setDecision("accepted")}>
                    Yes, introduce us
                  </Button>
                  <Button
                    size="md"
                    variant="outline"
                    icon={<X />}
                    magnetic={false}
                    onClick={() => setDecision("declined")}
                  >
                    Not this one
                  </Button>
                </div>
                <p className="mt-3.5 flex items-start gap-2 text-[12px] leading-relaxed text-ink/50">
                  <ShieldCheck className="mt-px size-3.5 shrink-0 text-positive/60" />
                  Declining is completely fine and stays private — we simply keep looking. Nobody can
                  message you unless you both say yes.
                </p>
              </>
            )}

            {isLive && connection.conversation_id && (
              <div className="mt-5 flex flex-wrap gap-2.5">
                <Link href={`/messages/${connection.conversation_id}`}>
                  <Button size="md" icon={<MessagesSquare />}>
                    Open conversation
                  </Button>
                </Link>
                <Button
                  size="md"
                  variant="ghost"
                  magnetic={false}
                  loading={busy}
                  onClick={markComplete}
                  icon={<CheckCheck />}
                >
                  Mark complete
                </Button>
              </div>
            )}

            {connection.my_response === "accepted" && connection.status === "partially_accepted" && (
              <p className="mt-5 inline-flex items-center gap-2 rounded-sm border border-ink/[0.08] bg-ink/[0.025] px-3.5 py-2.5 text-[12.5px] text-ink/62">
                <Clock className="size-3.5 text-caution" />
                You&apos;ve accepted. We&apos;re waiting on the other person — we&apos;ll email you the
                moment they answer.
              </p>
            )}
          </div>
        </Wrapper>
      </motion.div>

      {/* Decision modal ------------------------------------------------- */}
      <Modal
        open={decision !== null}
        onClose={() => setDecision(null)}
        size="sm"
        title={decision === "accepted" ? "Open a conversation?" : "Decline this introduction?"}
        description={
          decision === "accepted"
            ? "If the other person also accepts, a private chat opens between you two. Nobody else can read it."
            : "We'll keep looking for someone else. You don't owe anyone an explanation — but a line helps us match you better."
        }
        footer={
          <>
            <Button variant="ghost" size="md" magnetic={false} onClick={() => setDecision(null)}>
              Cancel
            </Button>
            <Button
              variant={decision === "accepted" ? "success" : "danger"}
              size="md"
              magnetic={false}
              loading={busy}
              onClick={submit}
            >
              {decision === "accepted" ? "Yes, accept" : "Decline"}
            </Button>
          </>
        }
      >
        <Textarea
          label={decision === "accepted" ? "Anything to add? (optional)" : "Why not? (optional, private)"}
          rows={3}
          maxChars={500}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </Modal>
    </>
  );
}

function Party({ label, response }: { label: string; response: "pending" | "accepted" | "declined" }) {
  const tone = {
    pending: "text-ink/50",
    accepted: "text-positive",
    declined: "text-critical",
  }[response];

  const icon = {
    pending: <Clock className="size-3.5" />,
    accepted: <Check className="size-3.5" strokeWidth={3} />,
    declined: <X className="size-3.5" strokeWidth={3} />,
  }[response];

  return (
    <span className={cn("inline-flex items-center gap-1.5 font-medium", tone)}>
      {icon}
      {label}: {response === "pending" ? "deciding" : response}
    </span>
  );
}
