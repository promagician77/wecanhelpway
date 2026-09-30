"use client";

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, CheckCheck, Info, SendHorizontal, ShieldCheck } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { markConversationRead, sendMessage } from "@/actions/messages";
import { Avatar } from "@/components/ui/misc";
import { TypingDots, useToast } from "@/components/ui/feedback";
import { cn, clockTime, dayLabel } from "@/lib/utils";
import type { Message, Profile } from "@/lib/types";

const ONLINE_WINDOW = 3 * 60 * 1000;
const TYPING_TIMEOUT = 2600;

interface Other {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  country: string | null;
  skills: string[] | null;
  last_seen_at: string | null;
}

/**
 * One-to-one chat. Three realtime layers share a single Supabase channel:
 * postgres_changes for new rows, presence for online state, and a broadcast
 * event for typing — which deliberately never touches the database.
 */
export function ChatRoom({
  conversationId,
  me,
  other,
  initialMessages,
  otherReadAt,
  needTitle,
  connectionStatus,
}: {
  conversationId: string;
  me: Profile;
  other: Other;
  initialMessages: Message[];
  otherReadAt: string | null;
  needTitle: string | null;
  connectionStatus: string | null;
}) {
  const [messages, setMessages] = React.useState<Message[]>(initialMessages);
  const [draft, setDraft] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [theyTyping, setTheyTyping] = React.useState(false);
  const [theirReadAt, setTheirReadAt] = React.useState(otherReadAt);
  const [online, setOnline] = React.useState(
    other.last_seen_at ? Date.now() - new Date(other.last_seen_at).getTime() < ONLINE_WINDOW : false,
  );

  const bottomRef = React.useRef<HTMLDivElement>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const channelRef = React.useRef<ReturnType<ReturnType<typeof supabaseBrowser>["channel"]> | null>(null);
  const typingSentAt = React.useRef(0);
  const typingTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const { push } = useToast();

  const scrollToBottom = React.useCallback((behavior: ScrollBehavior = "smooth") => {
    requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior, block: "end" }));
  }, []);

  React.useEffect(() => scrollToBottom("auto"), [scrollToBottom]);

  /* -------------------------- realtime channel -------------------------- */
  React.useEffect(() => {
    const supabase = supabaseBrowser();
    const channel = supabase.channel(`conversation:${conversationId}`, {
      config: { presence: { key: me.id }, broadcast: { self: false } },
    });

    channel
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload: { new: Message }) => {
          const incoming = payload.new;
          setMessages((prev) => {
            // Our own message already sits here from the optimistic insert.
            if (prev.some((m) => m.id === incoming.id)) return prev;
            return [...prev, incoming];
          });
          if (incoming.sender_id !== me.id) {
            setTheyTyping(false);
            void markConversationRead(conversationId);
          }
          scrollToBottom();
        },
      )
      .on("broadcast", { event: "typing" }, ({ payload }: { payload: { userId: string } }) => {
        if (payload.userId === me.id) return;
        setTheyTyping(true);
        if (typingTimer.current) clearTimeout(typingTimer.current);
        typingTimer.current = setTimeout(() => setTheyTyping(false), TYPING_TIMEOUT);
      })
      .on("broadcast", { event: "read" }, ({ payload }: { payload: { userId: string; at: string } }) => {
        if (payload.userId !== me.id) setTheirReadAt(payload.at);
      })
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState() as Record<string, unknown[]>;
        setOnline(Object.keys(state).some((key) => key === other.id));
      })
      .subscribe(async (status: string) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ userId: me.id, at: new Date().toISOString() });
        }
      });

    channelRef.current = channel;

    return () => {
      if (typingTimer.current) clearTimeout(typingTimer.current);
      void supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [conversationId, me.id, other.id, scrollToBottom]);

  /* ------------------------- mark read on arrival ----------------------- */
  React.useEffect(() => {
    void markConversationRead(conversationId).then(() => {
      channelRef.current?.send({
        type: "broadcast",
        event: "read",
        payload: { userId: me.id, at: new Date().toISOString() },
      });
    });
  }, [conversationId, me.id, messages.length]);

  /* ------------------------------ sending ------------------------------- */
  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;

    setDraft("");
    setSending(true);
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    // Optimistic bubble, swapped for the real row when the insert returns.
    const tempId = `temp-${Date.now()}`;
    const optimistic: Message = {
      id: tempId,
      conversation_id: conversationId,
      sender_id: me.id,
      body: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    scrollToBottom();

    const result = await sendMessage(conversationId, text);
    setSending(false);

    if (result.ok && result.data) {
      setMessages((prev) => prev.map((m) => (m.id === tempId ? result.data! : m)));
    } else {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setDraft(text);
      push({
        tone: "danger",
        title: "Message didn't send",
        description: result.ok ? undefined : result.error,
      });
    }
  }

  function onDraftChange(value: string) {
    setDraft(value);

    // Throttle the typing broadcast — one ping per second is plenty.
    const now = Date.now();
    if (now - typingSentAt.current > 1000) {
      typingSentAt.current = now;
      channelRef.current?.send({ type: "broadcast", event: "typing", payload: { userId: me.id } });
    }

    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
    }
  }

  const grouped = groupByDay(messages);
  const lastMine = [...messages].reverse().find((m) => m.sender_id === me.id);
  const lastMineSeen =
    lastMine && theirReadAt ? new Date(theirReadAt) >= new Date(lastMine.created_at) : false;

  return (
    <div className="flex h-[calc(100dvh-4rem)] flex-col">
      {/* Header ----------------------------------------------------------- */}
      <header className="flex items-center gap-3.5 border-b border-ink/[0.06] bg-void/60 px-4 py-3 backdrop-blur-2xl sm:px-6">
        <Link
          href="/messages"
          className="grid size-9 shrink-0 place-items-center rounded-xs text-ink/58 transition-colors hover:bg-ink/[0.07] hover:text-ink"
          aria-label="Back to messages"
        >
          <ArrowLeft className="size-4.5" />
        </Link>

        <Avatar src={other.avatar_url} name={other.full_name} size={42} online={online} />

        <div className="min-w-0 flex-1">
          <p className="truncate text-[14.5px] font-semibold tracking-[-0.01em] text-ink">
            {other.full_name ?? "Your connection"}
          </p>
          <p className="truncate text-[11.5px] text-ink/58">
            {theyTyping ? (
              <span className="inline-flex items-center gap-1.5 text-brand-700">
                typing
                <TypingDots />
              </span>
            ) : online ? (
              <span className="text-positive">Online now</span>
            ) : needTitle ? (
              needTitle
            ) : (
              "Offline"
            )}
          </p>
        </div>

        {connectionStatus === "completed" && (
          <span className="hidden shrink-0 rounded-full border border-ink/12 bg-ink/[0.05] px-2.5 py-1 text-[11px] text-ink/58 sm:block">
            Completed
          </span>
        )}
      </header>

      {/* Messages --------------------------------------------------------- */}
      <div ref={scrollRef} className="no-scrollbar flex-1 overflow-y-auto px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <IntroCard other={other} needTitle={needTitle} />

          {grouped.map(([day, dayMessages]) => (
            <div key={day}>
              <div className="my-6 flex items-center gap-3">
                <span className="h-px flex-1 bg-ink/[0.07]" />
                <span className="rounded-full border border-ink/[0.07] bg-ink/[0.03] px-3 py-1 text-[11px] font-medium text-ink/50">
                  {day}
                </span>
                <span className="h-px flex-1 bg-ink/[0.07]" />
              </div>

              <div className="space-y-1.5">
                <AnimatePresence initial={false}>
                  {dayMessages.map((message, i) => {
                    const mine = message.sender_id === me.id;
                    const prev = dayMessages[i - 1];
                    const grouped = prev?.sender_id === message.sender_id;
                    const isLastMine = mine && message.id === lastMine?.id;

                    return (
                      <motion.div
                        key={message.id}
                        layout="position"
                        initial={{ opacity: 0, y: 12, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ type: "spring", stiffness: 480, damping: 34 }}
                        className={cn("flex items-end gap-2.5", mine ? "justify-end" : "justify-start")}
                      >
                        {!mine && (
                          <span className={cn("shrink-0", grouped && "invisible")}>
                            <Avatar src={other.avatar_url} name={other.full_name} size={28} />
                          </span>
                        )}

                        <div className={cn("max-w-[78%] sm:max-w-[68%]", mine && "items-end")}>
                          <div
                            className={cn(
                              "relative px-4 py-2.5 text-[14.5px] leading-relaxed",
                              mine
                                ? "rounded-[18px] rounded-br-[6px] skin-accent"
                                : "rounded-[18px] rounded-bl-[6px] bg-[#f1eee8] text-ink/90 shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]",
                              grouped && (mine ? "rounded-tr-[18px]" : "rounded-tl-[18px]"),
                            )}
                          >
                            <p className="whitespace-pre-wrap break-words">{message.body}</p>
                          </div>

                          <div
                            className={cn(
                              "mt-1 flex items-center gap-1.5 px-1 font-mono text-[10px] text-ink/50",
                              mine ? "justify-end" : "justify-start",
                            )}
                          >
                            {clockTime(message.created_at)}
                            {isLastMine && (
                              <CheckCheck
                                className={cn("size-3", lastMineSeen ? "text-aqua-600" : "text-ink/50")}
                              />
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          ))}

          <AnimatePresence>
            {theyTyping && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="mt-3 flex items-end gap-2.5"
              >
                <Avatar src={other.avatar_url} name={other.full_name} size={28} />
                <span className="rounded-[18px] rounded-bl-[6px] bg-[#f1eee8] px-4 py-3.5">
                  <TypingDots />
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={bottomRef} className="h-2" />
        </div>
      </div>

      {/* Composer --------------------------------------------------------- */}
      <div className="border-t border-ink/[0.06] bg-void/60 px-4 py-3.5 backdrop-blur-2xl sm:px-6">
        <form onSubmit={submit} className="mx-auto max-w-3xl">
          <div className="group relative rounded-md">
            <span
              aria-hidden
              className="pointer-events-none absolute -inset-px rounded-[inherit] p-px opacity-0 transition-opacity duration-300 focus-within:opacity-100 group-focus-within:opacity-100"
              style={{
                background: "linear-gradient(180deg,rgb(92 155 255/0.9),rgb(91 139 108/0.6))",
                WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                WebkitMaskComposite: "xor",
                maskComposite: "exclude",
              }}
            />
            <div className="relative flex items-end gap-2 rounded-[inherit] well p-2 transition-colors group-focus-within:border-transparent">
              <textarea
                ref={textareaRef}
                value={draft}
                onChange={(e) => onDraftChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void submit();
                  }
                }}
                rows={1}
                placeholder={`Message ${other.full_name?.split(" ")[0] ?? "them"}…`}
                className="max-h-40 min-h-11 flex-1 resize-none bg-transparent px-3 py-2.5 text-[14.5px] leading-relaxed text-ink/95 outline-none placeholder:text-ink/40"
              />

              <button
                type="submit"
                disabled={!draft.trim() || sending}
                aria-label="Send message"
                className={cn(
                  "relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-sm transition-all duration-300",
                  draft.trim()
                    ? "skin-accent"
                    : "bg-ink/[0.06] text-ink/50",
                  "disabled:cursor-not-allowed",
                )}
              >
                <motion.span animate={sending ? { rotate: 360 } : { rotate: 0 }} transition={{ duration: 0.5 }}>
                  <SendHorizontal className="size-[18px]" />
                </motion.span>
              </button>
            </div>
          </div>

          <p className="mt-2 flex items-center justify-center gap-1.5 text-[11px] text-ink/50">
            <ShieldCheck className="size-3" />
            Private between the two of you. Enter to send, Shift+Enter for a new line.
          </p>
        </form>
      </div>
    </div>
  );
}

function IntroCard({ other, needTitle }: { other: Other; needTitle: string | null }) {
  return (
    <div className="mb-2 rounded-lg border border-ink/[0.07] bg-ink/[0.02] p-6 text-center">
      <Avatar src={other.avatar_url} name={other.full_name} size={64} ring className="mx-auto" />
      <h2 className="mt-4 text-[17px] font-semibold tracking-[-0.02em] text-ink">
        {other.full_name ?? "Your connection"}
      </h2>
      {other.country && <p className="mt-1 text-[12.5px] text-ink/50">{other.country}</p>}
      {other.bio && (
        <p className="mx-auto mt-3 max-w-md text-[13.5px] leading-relaxed text-ink/62">{other.bio}</p>
      )}
      {other.skills && other.skills.length > 0 && (
        <ul className="mt-4 flex flex-wrap justify-center gap-1.5">
          {other.skills.slice(0, 8).map((s) => (
            <li
              key={s}
              className="rounded-full border border-ink/10 bg-ink/[0.04] px-2.5 py-1 text-[11.5px] text-ink/55"
            >
              {s}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-5 flex items-start gap-2.5 rounded-sm border border-brand-400/20 bg-brand-500/[0.07] px-4 py-3 text-left">
        <Info className="mt-0.5 size-4 shrink-0 text-brand-700" />
        <p className="text-[12.5px] leading-relaxed text-ink/55">
          {needTitle ? (
            <>
              You were introduced about{" "}
              <span className="font-medium text-ink/80">“{needTitle}”</span>. There&apos;s no script
              — a simple hello is a good start.
            </>
          ) : (
            <>You both agreed to this introduction. There&apos;s no script — a simple hello works.</>
          )}
        </p>
      </div>
    </div>
  );
}

/** Group messages into day buckets, preserving order. */
function groupByDay(messages: Message[]): [string, Message[]][] {
  const buckets = new Map<string, Message[]>();
  for (const m of messages) {
    const key = dayLabel(m.created_at);
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(m);
  }
  return [...buckets.entries()];
}
