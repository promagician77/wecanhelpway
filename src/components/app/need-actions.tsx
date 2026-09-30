"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Archive, CheckCircle2, MoreHorizontal, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { deleteNeed, resolveNeed } from "@/actions/needs";
import { Modal } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/feedback";
import type { Need } from "@/lib/types";

export function NeedActions({ need }: { need: Need }) {
  const [open, setOpen] = React.useState(false);
  const [confirm, setConfirm] = React.useState<"resolve" | "archive" | "delete" | null>(null);
  const [busy, setBusy] = React.useState(false);
  const { push } = useToast();
  const router = useRouter();
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const closed = ["resolved", "archived", "rejected"].includes(need.status);

  async function run(kind: "resolve" | "archive") {
    setBusy(true);
    const result = await resolveNeed(need.id, kind === "resolve" ? "resolved" : "archived");
    setBusy(false);
    setConfirm(null);
    if (result.ok) {
      push({ tone: "success", title: result.message ?? "Done" });
      router.refresh();
    } else {
      push({ tone: "danger", title: "That didn't work", description: result.error });
    }
  }

  const copy = {
    resolve: {
      title: "Mark this as resolved?",
      body: "Tell us it worked out. It closes the request, and it teaches us who to match next time.",
      confirmLabel: "Yes, it's resolved",
      variant: "success" as const,
    },
    archive: {
      title: "Archive this request?",
      body: "We'll stop looking for a match. Nothing is deleted — you can submit it again any time.",
      confirmLabel: "Archive it",
      variant: "outline" as const,
    },
    delete: {
      title: "Delete this request?",
      body: "This removes it permanently, along with its history. This can't be undone.",
      confirmLabel: "Delete permanently",
      variant: "danger" as const,
    },
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="More actions"
        className="grid size-9 place-items-center rounded-xs border border-ink/12 bg-ink/[0.04] text-ink/55 transition-all hover:border-ink/25 hover:bg-ink/[0.08] hover:text-ink"
      >
        <MoreHorizontal className="size-4" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.16 }}
            className="absolute right-0 top-11 z-40 w-56 overflow-hidden rounded-sm glass-strong p-1"
          >
            {!closed && (
              <>
                <MenuItem
                  icon={<CheckCircle2 className="size-4" />}
                  onClick={() => {
                    setOpen(false);
                    setConfirm("resolve");
                  }}
                >
                  Mark as resolved
                </MenuItem>
                <MenuItem
                  icon={<Archive className="size-4" />}
                  onClick={() => {
                    setOpen(false);
                    setConfirm("archive");
                  }}
                >
                  Archive
                </MenuItem>
              </>
            )}
            <MenuItem
              icon={<Trash2 className="size-4" />}
              destructive
              onClick={() => {
                setOpen(false);
                setConfirm("delete");
              }}
            >
              Delete
            </MenuItem>
          </motion.div>
        )}
      </AnimatePresence>

      <Modal
        open={confirm !== null}
        onClose={() => setConfirm(null)}
        title={confirm ? copy[confirm].title : undefined}
        description={confirm ? copy[confirm].body : undefined}
        size="sm"
        footer={
          confirm && (
            <>
              <Button variant="ghost" size="md" magnetic={false} onClick={() => setConfirm(null)}>
                Never mind
              </Button>
              {confirm === "delete" ? (
                <form action={deleteNeed.bind(null, need.id)}>
                  <Button type="submit" variant="danger" size="md" magnetic={false}>
                    {copy.delete.confirmLabel}
                  </Button>
                </form>
              ) : (
                <Button
                  variant={copy[confirm].variant}
                  size="md"
                  magnetic={false}
                  loading={busy}
                  onClick={() => run(confirm as "resolve" | "archive")}
                >
                  {copy[confirm].confirmLabel}
                </Button>
              )}
            </>
          )
        }
      />
    </div>
  );
}

function MenuItem({
  icon,
  children,
  onClick,
  destructive,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick: () => void;
  destructive?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={
        "flex w-full items-center gap-2.5 rounded-xs px-3 py-2.5 text-left text-[13px] font-medium transition-colors " +
        (destructive
          ? "text-critical/80 hover:bg-critical/12 hover:text-critical"
          : "text-ink/65 hover:bg-ink/[0.07] hover:text-ink")
      }
    >
      {icon}
      {children}
    </button>
  );
}
