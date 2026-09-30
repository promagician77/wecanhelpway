"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Avatar } from "@/components/ui/misc";
import { cn, relativeTime, truncate } from "@/lib/utils";
import type { ConversationView } from "@/actions/messages";

const ONLINE_WINDOW = 3 * 60 * 1000;

export function ConversationList({ conversations }: { conversations: ConversationView[] }) {
  const router = useRouter();

  // New messages in any thread re-sort and re-badge the inbox live.
  React.useEffect(() => {
    const supabase = supabaseBrowser();
    const channel = supabase
      .channel("inbox")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => {
        router.refresh();
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [router]);

  return (
    <ul className="space-y-2">
      {conversations.map((c, i) => {
        const online = c.other.last_seen_at
          ? Date.now() - new Date(c.other.last_seen_at).getTime() < ONLINE_WINDOW
          : false;

        return (
          <motion.li
            key={c.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
          >
            <Link
              href={`/messages/${c.id}`}
              className={cn(
                "group flex items-center gap-4 rounded-md border p-4 transition-all duration-300",
                c.unread_count > 0
                  ? "border-brand-400/25 bg-brand-500/[0.07]"
                  : "border-ink/[0.07] bg-ink/[0.02] hover:border-ink/20 hover:bg-ink/[0.05]",
              )}
            >
              <Avatar src={c.other.avatar_url} name={c.other.full_name} size={50} online={online} />

              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3">
                  <p
                    className={cn(
                      "truncate text-[14.5px] font-semibold tracking-[-0.01em]",
                      c.unread_count > 0 ? "text-ink" : "text-ink/85",
                    )}
                  >
                    {c.other.full_name ?? "Your connection"}
                  </p>
                  {c.last_message && (
                    <span className="shrink-0 font-mono text-[10.5px] text-ink/50">
                      {relativeTime(c.last_message.created_at)}
                    </span>
                  )}
                </div>

                {c.need_title && (
                  <p className="mt-0.5 truncate text-[11.5px] text-brand-700/60">{c.need_title}</p>
                )}

                <p
                  className={cn(
                    "mt-1 truncate text-[13px]",
                    c.unread_count > 0 ? "font-medium text-ink/75" : "text-ink/58",
                  )}
                >
                  {c.last_message
                    ? truncate(c.last_message.body, 90)
                    : "No messages yet — say hello."}
                </p>
              </div>

              {c.unread_count > 0 && (
                <span className="grid min-w-6 shrink-0 place-items-center rounded-full bg-brand-500 px-2 py-1 text-[11.5px] font-semibold text-snow">
                  {c.unread_count > 99 ? "99+" : c.unread_count}
                </span>
              )}
            </Link>
          </motion.li>
        );
      })}
    </ul>
  );
}
