"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Archive,
  Ban,
  CheckCircle2,
  HelpCircle,
  Search,
  ShieldCheck,
  Siren,
} from "lucide-react";
import { requestClarification, setNeedPriority, setNeedStatus } from "@/actions/admin";
import { SpotlightCard, useToast } from "@/components/ui/feedback";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/misc";
import { Select, Textarea } from "@/components/ui/field";
import { PRIORITY_META } from "@/lib/constants";
import type { Need, NeedStatus, Priority } from "@/lib/types";

/** The triage panel: everything an admin can do to a request, in one card. */
export function AdminNeedControls({ need }: { need: Need }) {
  const [busy, setBusy] = React.useState<string | null>(null);
  const [dialog, setDialog] = React.useState<null | { kind: "status"; status: NeedStatus } | { kind: "clarify" }>(null);
  const [message, setMessage] = React.useState("");
  const { push } = useToast();
  const router = useRouter();

  async function apply(status: NeedStatus, note?: string) {
    setBusy(status);
    const result = await setNeedStatus(need.id, status, note);
    setBusy(null);
    setDialog(null);
    setMessage("");
    if (result.ok) {
      push({ tone: "success", title: result.message ?? "Updated", description: "We've notified them." });
      router.refresh();
    } else {
      push({ tone: "danger", title: "That didn't work", description: result.error });
    }
  }

  async function clarify() {
    if (!message.trim()) return;
    setBusy("clarify");
    const result = await requestClarification(need.id, message);
    setBusy(null);
    setDialog(null);
    setMessage("");
    if (result.ok) {
      push({ tone: "success", title: "Question sent", description: "They'll get it by email too." });
      router.refresh();
    } else {
      push({ tone: "danger", title: "That didn't work", description: result.error });
    }
  }

  const actions: { status: NeedStatus; label: string; icon: React.ReactNode; variant?: "outline" | "ghost" | "success" | "danger" }[] = [
    { status: "under_review", label: "Start reviewing", icon: <ShieldCheck /> },
    { status: "looking_for_match", label: "Looking for a match", icon: <Search /> },
    { status: "resolved", label: "Mark resolved", icon: <CheckCircle2 />, variant: "success" },
    { status: "rejected", label: "Close request", icon: <Ban />, variant: "danger" },
    { status: "archived", label: "Archive", icon: <Archive />, variant: "ghost" },
  ];

  return (
    <>
      <SpotlightCard className="p-6">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-ink/50">
          Triage
        </h2>

        <div className="mt-5">
          <Select
            label="Priority"
            icon={<Siren />}
            defaultValue={need.priority}
            onChange={async (e) => {
              const result = await setNeedPriority(need.id, e.target.value as Priority);
              if (result.ok) {
                push({ tone: "success", title: result.message ?? "Priority updated" });
                router.refresh();
              }
            }}
          >
            {Object.entries(PRIORITY_META).map(([value, meta]) => (
              <option key={value} value={value}>
                {meta.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="mt-5 space-y-2">
          <Button
            fullWidth
            size="md"
            variant="outline"
            magnetic={false}
            icon={<HelpCircle />}
            onClick={() => setDialog({ kind: "clarify" })}
          >
            Ask them a question
          </Button>

          {actions.map((action) => (
            <Button
              key={action.status}
              fullWidth
              size="md"
              variant={action.variant ?? "glass"}
              magnetic={false}
              loading={busy === action.status}
              disabled={need.status === action.status}
              icon={action.icon}
              onClick={() =>
                action.variant === "danger" || action.variant === "success"
                  ? setDialog({ kind: "status", status: action.status })
                  : apply(action.status)
              }
            >
              {action.label}
            </Button>
          ))}
        </div>

        <p className="mt-4 border-t border-ink/[0.07] pt-4 text-[11.5px] leading-relaxed text-ink/50">
          Every change here is logged on their timeline and sent to them by email. Nothing happens
          to someone&apos;s request invisibly.
        </p>
      </SpotlightCard>

      {/* Clarification --------------------------------------------------- */}
      <Modal
        open={dialog?.kind === "clarify"}
        onClose={() => setDialog(null)}
        title="Ask a question"
        description="This goes straight to them, in-app and by email. Their request moves to “Clarification Needed” until they answer."
        size="sm"
        footer={
          <>
            <Button variant="ghost" size="md" magnetic={false} onClick={() => setDialog(null)}>
              Cancel
            </Button>
            <Button size="md" magnetic={false} loading={busy === "clarify"} disabled={!message.trim()} onClick={clarify}>
              Send question
            </Button>
          </>
        }
      >
        <Textarea
          label="Your question"
          rows={4}
          maxChars={800}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          hint="Plain language. Remember they may not know the vocabulary of their own problem."
        />
      </Modal>

      {/* Status with a message ------------------------------------------- */}
      <Modal
        open={dialog?.kind === "status"}
        onClose={() => setDialog(null)}
        title={dialog?.kind === "status" && dialog.status === "resolved" ? "Mark as resolved?" : "Close this request?"}
        description="Add a short note explaining why. They'll see exactly this text."
        size="sm"
        footer={
          <>
            <Button variant="ghost" size="md" magnetic={false} onClick={() => setDialog(null)}>
              Cancel
            </Button>
            <Button
              size="md"
              magnetic={false}
              variant={dialog?.kind === "status" && dialog.status === "resolved" ? "success" : "danger"}
              loading={busy !== null}
              onClick={() => dialog?.kind === "status" && apply(dialog.status, message)}
            >
              Confirm
            </Button>
          </>
        }
      >
        <Textarea
          label="Note to them (optional)"
          rows={3}
          maxChars={600}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </Modal>
    </>
  );
}
