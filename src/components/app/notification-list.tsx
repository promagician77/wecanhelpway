"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, CheckCheck } from "lucide-react";
import { markAllNotificationsRead, markNotificationRead } from "@/actions/notifications";
import { Tabs } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { cn, relativeTime } from "@/lib/utils";
import type { Notification } from "@/lib/types";

export function NotificationList({ notifications: initial }: { notifications: Notification[] }) {
  const [notifications, setNotifications] = React.useState(initial);
  const [tab, setTab] = React.useState("all");
  const router = useRouter();

  const unread = notifications.filter((n) => !n.read_at);
  const shown = tab === "unread" ? unread : notifications;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { value: "all", label: "All", count: notifications.length },
            { value: "unread", label: "Unread", count: unread.length },
          ]}
        />

        {unread.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            magnetic={false}
            icon={<CheckCheck />}
            onClick={async () => {
              setNotifications((prev) =>
                prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })),
              );
              await markAllNotificationsRead();
              router.refresh();
            }}
          >
            Mark all read
          </Button>
        )}
      </div>

      <ul className="mt-6 space-y-2">
        <AnimatePresence initial={false}>
          {shown.map((n, i) => {
            const markRead = async () => {
              if (n.read_at) return;
              setNotifications((prev) =>
                prev.map((x) => (x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x)),
              );
              await markNotificationRead(n.id);
            };

            const className = cn(
              "group flex gap-3.5 rounded-sm border p-4 transition-all duration-300",
              n.read_at ? "border-ink/[0.06] bg-ink/[0.018]" : "border-brand-400/25 bg-brand-500/[0.08]",
              n.link && "cursor-pointer hover:border-ink/20 hover:bg-ink/[0.05]",
            );

            const body = (
              <>
                <span
                  className={cn(
                    "mt-1.5 size-2 shrink-0 rounded-full",
                    n.read_at
                      ? "bg-ink/15"
                      : "bg-brand-500",
                  )}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p
                      className={cn(
                        "text-[14px] font-semibold leading-snug",
                        n.read_at ? "text-ink/70" : "text-ink",
                      )}
                    >
                      {n.title}
                    </p>
                    {n.link && (
                      <ArrowUpRight className="size-4 shrink-0 text-ink/50 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand-700" />
                    )}
                  </div>
                  {n.body && <p className="mt-1.5 text-[13px] leading-relaxed text-ink/62">{n.body}</p>}
                  <p className="mt-2 font-mono text-[10.5px] text-ink/50">{relativeTime(n.created_at)}</p>
                </div>
              </>
            );

            return (
              <motion.li
                key={n.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.3) }}
              >
                {n.link ? (
                  <Link href={n.link} onClick={markRead} className={className}>
                    {body}
                  </Link>
                ) : (
                  <div onClick={markRead} className={className}>
                    {body}
                  </div>
                )}
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>

      {shown.length === 0 && (
        <p className="py-14 text-center text-[13.5px] text-ink/50">Nothing unread.</p>
      )}
    </div>
  );
}
