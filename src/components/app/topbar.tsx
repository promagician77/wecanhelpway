"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, CheckCheck, Inbox } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { markAllNotificationsRead, markNotificationRead } from "@/actions/notifications";
import { cn, relativeTime } from "@/lib/utils";
import type { Notification, Profile } from "@/lib/types";

/**
 * Header for the app shell. Owns two live concerns: streaming new
 * notifications in, and publishing a presence heartbeat so the other side of a
 * chat can see an online dot.
 */
export function Topbar({
  profile,
  initialNotifications,
  title,
}: {
  profile: Profile;
  initialNotifications: Notification[];
  title?: string;
}) {
  const [notifications, setNotifications] = React.useState(initialNotifications);
  const [open, setOpen] = React.useState(false);
  const [flash, setFlash] = React.useState(false);
  const router = useRouter();
  const panelRef = React.useRef<HTMLDivElement>(null);

  const unread = notifications.filter((n) => !n.read_at).length;

  React.useEffect(() => setNotifications(initialNotifications), [initialNotifications]);

  /* ---------------------------- live notifications ---------------------- */
  React.useEffect(() => {
    const supabase = supabaseBrowser();
    const channel = supabase
      .channel(`notifications:${profile.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${profile.id}` },
        (payload: { new: Notification }) => {
          setNotifications((prev) => [payload.new, ...prev].slice(0, 50));
          setFlash(true);
          setTimeout(() => setFlash(false), 2400);
          router.refresh();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [profile.id, router]);

  /* ------------------------------- presence ----------------------------- */
  React.useEffect(() => {
    const supabase = supabaseBrowser();
    const beat = () => {
      void supabase.from("profiles").update({ last_seen_at: new Date().toISOString() }).eq("id", profile.id);
    };
    beat();
    const interval = setInterval(beat, 60_000);
    const onVisible = () => document.visibilityState === "visible" && beat();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [profile.id]);

  /* -------------------------- close on outside click -------------------- */
  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-ink/[0.06] bg-[#ffffff]/75 backdrop-blur-2xl backdrop-saturate-150">
      <div className="flex h-16 items-center gap-4 px-5 pl-18 sm:px-7 lg:pl-7">
        {title && (
          <h1 className="truncate text-[15px] font-semibold tracking-[-0.01em] text-ink/85">{title}</h1>
        )}

        <div className="ml-auto flex items-center gap-2" ref={panelRef}>
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label={`Notifications${unread ? ` (${unread} unread)` : ""}`}
            className={cn(
              "relative grid size-10 place-items-center rounded-sm material text-ink/60 transition-all duration-200",
              "hover:text-ink hover:brightness-125",
              open && "text-ink brightness-125",
            )}
          >
            <motion.span animate={flash ? { rotate: [0, -14, 12, -8, 0] } : {}} transition={{ duration: 0.6 }}>
              <Bell className="size-[18px]" />
            </motion.span>
            {unread > 0 && (
              <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-brand-500 px-1.5 py-0.5 text-[10.5px] font-semibold text-snow">
                {unread > 9 ? "9+" : unread}
                
              </span>
            )}
          </button>

          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
                className="absolute right-5 top-14 z-50 w-[min(24rem,calc(100vw-2.5rem))] overflow-hidden rounded-md glass-strong sm:right-7"
              >
                <div className="flex items-center justify-between border-b border-ink/[0.07] px-4 py-3">
                  <span className="text-[13px] font-semibold text-ink/85">Notifications</span>
                  {unread > 0 && (
                    <button
                      onClick={async () => {
                        setNotifications((prev) =>
                          prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })),
                        );
                        await markAllNotificationsRead();
                        router.refresh();
                      }}
                      className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-brand-700 transition-colors hover:text-brand-700"
                    >
                      <CheckCheck className="size-3.5" />
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="no-scrollbar max-h-[26rem] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
                      <Inbox className="size-7 text-ink/50" />
                      <p className="text-[13px] text-ink/58">Nothing yet. We&apos;ll tell you when something moves.</p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-ink/[0.05]">
                      {notifications.slice(0, 12).map((n) => (
                        <li key={n.id}>
                          <Link
                            href={n.link ?? "/notifications"}
                            onClick={async () => {
                              setOpen(false);
                              if (!n.read_at) {
                                setNotifications((prev) =>
                                  prev.map((x) => (x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x)),
                                );
                                await markNotificationRead(n.id);
                              }
                            }}
                            className={cn(
                              "flex gap-3 px-4 py-3.5 transition-colors hover:bg-ink/[0.045]",
                              !n.read_at && "bg-brand-500/[0.07]",
                            )}
                          >
                            <span
                              className={cn(
                                "mt-1.5 size-1.5 shrink-0 rounded-full",
                                n.read_at ? "bg-ink/15" : "bg-brand-500",
                              )}
                            />
                            <span className="min-w-0 flex-1">
                              <span className="block text-[13px] font-medium leading-snug text-ink/85">
                                {n.title}
                              </span>
                              {n.body && (
                                <span className="mt-0.5 line-clamp-2 block text-[12.5px] leading-relaxed text-ink/58">
                                  {n.body}
                                </span>
                              )}
                              <span className="mt-1 block font-mono text-[10.5px] text-ink/50">
                                {relativeTime(n.created_at)}
                              </span>
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <Link
                  href="/notifications"
                  onClick={() => setOpen(false)}
                  className="block border-t border-ink/[0.07] px-4 py-3 text-center text-[12.5px] font-medium text-ink/62 transition-colors hover:bg-ink/[0.04] hover:text-ink"
                >
                  See everything
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
