"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, Plus } from "lucide-react";
import { addAdminNote } from "@/actions/admin";
import { SpotlightCard, useToast } from "@/components/ui/feedback";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/field";
import { relativeTime } from "@/lib/utils";
import type { AdminNote } from "@/lib/types";

/** Internal-only notes. Never surfaced to the person who submitted anything. */
export function AdminNotes({
  entityType,
  entityId,
  notes,
}: {
  entityType: "need" | "offer" | "profile" | "connection";
  entityId: string;
  notes: AdminNote[];
}) {
  const [body, setBody] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const { push } = useToast();
  const router = useRouter();

  async function submit() {
    if (!body.trim()) return;
    setBusy(true);
    const result = await addAdminNote(entityType, entityId, body);
    setBusy(false);
    if (result.ok) {
      setBody("");
      push({ tone: "success", title: "Note added" });
      router.refresh();
    } else {
      push({ tone: "danger", title: "That didn't work", description: result.error });
    }
  }

  return (
    <SpotlightCard className="p-6">
      <h2 className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.14em] text-ink/50">
        <Lock className="size-3.5" />
        Internal notes
      </h2>
      <p className="mt-1.5 text-[11.5px] text-ink/50">Only the team can see these.</p>

      <div className="mt-4 space-y-3">
        <Textarea
          label="Add a note"
          rows={3}
          maxChars={2000}
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        <Button
          size="sm"
          fullWidth
          magnetic={false}
          loading={busy}
          disabled={!body.trim()}
          icon={<Plus />}
          onClick={submit}
        >
          Save note
        </Button>
      </div>

      {notes.length > 0 && (
        <ul className="mt-5 space-y-2.5 border-t border-ink/[0.07] pt-5">
          {notes.map((note, i) => (
            <motion.li
              key={note.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="rounded-sm border border-ink/[0.06] bg-ink/[0.025] p-3.5"
            >
              <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-ink/65">{note.body}</p>
              <p className="mt-2 font-mono text-[10.5px] text-ink/50">
                {relativeTime(note.created_at)}
              </p>
            </motion.li>
          ))}
        </ul>
      )}
    </SpotlightCard>
  );
}
