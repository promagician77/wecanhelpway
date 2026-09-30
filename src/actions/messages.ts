"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { notify } from "@/lib/notify";
import type { ActionResult, Message } from "@/lib/types";

export interface ConversationView {
  id: string;
  connection_id: string;
  last_message_at: string | null;
  created_at: string;
  other: { id: string; full_name: string | null; avatar_url: string | null; last_seen_at: string | null };
  last_message: { body: string; sender_id: string; created_at: string } | null;
  unread_count: number;
  need_title: string | null;
}

/** Inbox list: one row per conversation with preview and unread count. */
export async function listConversations(): Promise<ConversationView[]> {
  const user = await getUser();
  if (!user) return [];

  const supabase = await createClient();
  const { data: memberships } = await supabase
    .from("conversation_participants")
    .select("conversation_id, last_read_at")
    .eq("user_id", user.id);

  if (!memberships?.length) return [];

  const ids = memberships.map((m) => m.conversation_id);
  const readAtById = new Map(memberships.map((m) => [m.conversation_id, m.last_read_at]));

  const admin = createAdminClient();
  const [{ data: conversations }, { data: others }, { data: recent }] = await Promise.all([
    admin.from("conversations").select("*").in("id", ids).order("last_message_at", { ascending: false, nullsFirst: false }),
    admin.from("conversation_participants").select("conversation_id, user_id").in("conversation_id", ids).neq("user_id", user.id),
    admin.from("messages").select("conversation_id, body, sender_id, created_at").in("conversation_id", ids).order("created_at", { ascending: false }).limit(400),
  ]);

  const otherIdByConv = new Map((others ?? []).map((o) => [o.conversation_id, o.user_id]));
  const otherIds = [...new Set(otherIdByConv.values())];

  const connectionIds = (conversations ?? []).map((c) => c.connection_id);
  const [{ data: profiles }, { data: connections }] = await Promise.all([
    otherIds.length
      ? admin.from("profiles").select("id, full_name, avatar_url, last_seen_at").in("id", otherIds)
      : Promise.resolve({ data: [] }),
    connectionIds.length
      ? admin.from("connections").select("id, need_id").in("id", connectionIds)
      : Promise.resolve({ data: [] }),
  ]);

  const needIds = (connections ?? []).map((c) => c.need_id).filter(Boolean) as string[];
  const { data: needs } = needIds.length
    ? await admin.from("needs").select("id, title").in("id", needIds)
    : { data: [] as { id: string; title: string }[] };

  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));
  const needTitleById = new Map((needs ?? []).map((n) => [n.id, n.title]));
  const needIdByConnection = new Map((connections ?? []).map((c) => [c.id, c.need_id]));

  // One pass over the recent messages fills both preview and unread count.
  const lastByConv = new Map<string, { body: string; sender_id: string; created_at: string }>();
  const unreadByConv = new Map<string, number>();
  for (const m of recent ?? []) {
    if (!lastByConv.has(m.conversation_id)) {
      lastByConv.set(m.conversation_id, { body: m.body, sender_id: m.sender_id, created_at: m.created_at });
    }
    const readAt = readAtById.get(m.conversation_id);
    if (m.sender_id !== user.id && (!readAt || new Date(m.created_at) > new Date(readAt))) {
      unreadByConv.set(m.conversation_id, (unreadByConv.get(m.conversation_id) ?? 0) + 1);
    }
  }

  return (conversations ?? []).map((c) => {
    const otherId = otherIdByConv.get(c.id) ?? "";
    const needId = needIdByConnection.get(c.connection_id);
    return {
      id: c.id,
      connection_id: c.connection_id,
      last_message_at: c.last_message_at,
      created_at: c.created_at,
      other: (profileById.get(otherId) as ConversationView["other"]) ?? {
        id: otherId,
        full_name: "Someone",
        avatar_url: null,
        last_seen_at: null,
      },
      last_message: lastByConv.get(c.id) ?? null,
      unread_count: unreadByConv.get(c.id) ?? 0,
      need_title: needId ? needTitleById.get(needId) ?? null : null,
    };
  });
}

export async function getConversation(conversationId: string) {
  const user = await getUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data: membership } = await supabase
    .from("conversation_participants")
    .select("last_read_at")
    .eq("conversation_id", conversationId)
    .eq("user_id", user.id)
    .single();

  if (!membership) return null;

  const admin = createAdminClient();
  const [{ data: conversation }, { data: participants }, { data: messages }] = await Promise.all([
    admin.from("conversations").select("*").eq("id", conversationId).single(),
    admin.from("conversation_participants").select("user_id, last_read_at").eq("conversation_id", conversationId),
    admin.from("messages").select("*").eq("conversation_id", conversationId).order("created_at", { ascending: true }).limit(500),
  ]);

  if (!conversation) return null;

  const otherId = (participants ?? []).find((p) => p.user_id !== user.id)?.user_id ?? "";
  const otherReadAt = (participants ?? []).find((p) => p.user_id !== user.id)?.last_read_at ?? null;

  const [{ data: other }, { data: connection }] = await Promise.all([
    admin.from("profiles").select("id, full_name, avatar_url, bio, country, skills, last_seen_at").eq("id", otherId).single(),
    admin.from("connections").select("*").eq("id", conversation.connection_id).single(),
  ]);

  const { data: need } = connection?.need_id
    ? await admin.from("needs").select("id, title, category").eq("id", connection.need_id).single()
    : { data: null };

  return {
    conversation,
    messages: (messages ?? []) as Message[],
    other,
    otherReadAt,
    connection,
    need,
    myId: user.id,
  };
}

export async function sendMessage(conversationId: string, body: string): Promise<ActionResult<Message>> {
  const user = await getUser();
  if (!user) return { ok: false, error: "You need to be signed in." };

  const text = body.trim();
  if (!text) return { ok: false, error: "Write something first." };
  if (text.length > 4000) return { ok: false, error: "That message is too long (4000 characters max)." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, sender_id: user.id, body: text })
    .select("*")
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? "Message didn't send." };

  // Sending implies reading everything before it.
  await supabase
    .from("conversation_participants")
    .update({ last_read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .eq("user_id", user.id);

  void notifyRecipient(conversationId, user.id, text);

  return { ok: true, data: data as Message };
}

/**
 * Email the other party only if they've been away — realtime already tells
 * an open tab, and nobody wants mail for every line of a live chat.
 */
async function notifyRecipient(conversationId: string, senderId: string, preview: string) {
  try {
    const admin = createAdminClient();
    const { data: participants } = await admin
      .from("conversation_participants")
      .select("user_id")
      .eq("conversation_id", conversationId)
      .neq("user_id", senderId);

    const recipient = participants?.[0]?.user_id;
    if (!recipient) return;

    const [{ data: sender }, { data: recipientProfile }] = await Promise.all([
      admin.from("profiles").select("full_name").eq("id", senderId).single(),
      admin.from("profiles").select("last_seen_at").eq("id", recipient).single(),
    ]);

    const awayFor = recipientProfile?.last_seen_at
      ? Date.now() - new Date(recipientProfile.last_seen_at).getTime()
      : Infinity;
    const isAway = awayFor > 3 * 60 * 1000;

    await notify({
      userId: recipient,
      type: "message",
      title: `New message from ${sender?.full_name ?? "your connection"}`,
      body: preview.length > 160 ? `${preview.slice(0, 159)}…` : preview,
      link: `/messages/${conversationId}`,
      email: isAway,
      emailCtaLabel: "Reply",
    });
  } catch (err) {
    console.error("[message:notify]", err);
  }
}

export async function markConversationRead(conversationId: string) {
  const user = await getUser();
  if (!user) return;

  const supabase = await createClient();
  await supabase
    .from("conversation_participants")
    .update({ last_read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .eq("user_id", user.id);

  revalidatePath("/messages");
}

/** Total unread across every conversation — drives the sidebar badge. */
export async function unreadTotal(): Promise<number> {
  const conversations = await listConversations();
  return conversations.reduce((sum, c) => sum + c.unread_count, 0);
}
