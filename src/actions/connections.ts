"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { logStatusEvent, notify } from "@/lib/notify";
import type { ActionResult, Connection } from "@/lib/types";

/**
 * The consent workflow:
 *
 *   proposed → (requester accepts) → partially_accepted
 *            → (helper accepts)    → connected + conversation created
 *
 * Either party may decline at any point; the team may cancel. Nothing opens a
 * conversation except both parties saying yes.
 */

async function loadConnection(id: string): Promise<Connection | null> {
  const admin = createAdminClient();
  const { data } = await admin.from("connections").select("*").eq("id", id).single();
  return (data as Connection) ?? null;
}

async function nameOf(userId: string) {
  const admin = createAdminClient();
  const { data } = await admin.from("profiles").select("full_name").eq("id", userId).single();
  return data?.full_name ?? "Someone";
}

/* -------------------------- Responding to a proposal ---------------------- */

export async function respondToConnection(
  connectionId: string,
  decision: "accepted" | "declined",
  note?: string,
): Promise<ActionResult<{ conversationId?: string }>> {
  const user = await getUser();
  if (!user) return { ok: false, error: "You need to be signed in." };

  const connection = await loadConnection(connectionId);
  if (!connection) return { ok: false, error: "That connection no longer exists." };

  const isRequester = connection.requester_id === user.id;
  const isHelper = connection.helper_id === user.id;
  if (!isRequester && !isHelper) return { ok: false, error: "This connection isn't yours." };

  if (["declined", "cancelled", "completed"].includes(connection.status)) {
    return { ok: false, error: "This connection is already closed." };
  }

  const admin = createAdminClient();
  const otherId = isRequester ? connection.helper_id : connection.requester_id;
  const myName = await nameOf(user.id);

  /* ---------------------------- Decline path ---------------------------- */
  if (decision === "declined") {
    await admin
      .from("connections")
      .update({
        status: "declined",
        [isRequester ? "requester_response" : "helper_response"]: "declined",
        [isRequester ? "requester_note" : "helper_note"]: note ?? null,
      })
      .eq("id", connectionId);

    // A declined match sends the need back to the matching queue, not to a dead end.
    if (connection.need_id) {
      await admin.from("needs").update({ status: "looking_for_match" }).eq("id", connection.need_id);
      await logStatusEvent({
        entityType: "need",
        entityId: connection.need_id,
        ownerId: connection.requester_id,
        status: "looking_for_match",
        message: "That introduction didn't go ahead. We're looking for someone else.",
        actorId: user.id,
      });
    }
    if (connection.offer_id) {
      await admin.from("offers").update({ status: "active" }).eq("id", connection.offer_id);
    }

    await notify({
      userId: otherId,
      type: "connection_declined",
      title: "That introduction won't go ahead",
      body: "One side chose not to continue — which is always allowed here. We're already looking for another match.",
      link: "/connections",
    });

    revalidatePath("/connections");
    revalidatePath("/dashboard");
    return { ok: true, message: "Declined. We'll keep looking." };
  }

  /* ---------------------------- Accept path ----------------------------- */
  const responses = {
    requester_response: isRequester ? "accepted" : connection.requester_response,
    helper_response: isHelper ? "accepted" : connection.helper_response,
  };
  const bothAccepted = responses.requester_response === "accepted" && responses.helper_response === "accepted";

  await admin
    .from("connections")
    .update({
      ...responses,
      [isRequester ? "requester_note" : "helper_note"]: note ?? null,
      status: bothAccepted ? "connected" : "partially_accepted",
      ...(bothAccepted ? { connected_at: new Date().toISOString() } : {}),
    })
    .eq("id", connectionId);

  if (!bothAccepted) {
    await notify({
      userId: otherId,
      type: "connection_partial",
      title: `${myName} accepted the connection`,
      body: "It's over to you now. Take a look and decide whether you'd like to go ahead.",
      link: "/connections",
      emailCtaLabel: "Review the introduction",
    });

    if (connection.need_id) {
      await logStatusEvent({
        entityType: "need",
        entityId: connection.need_id,
        ownerId: connection.requester_id,
        status: "connection_proposed",
        message: isRequester
          ? "You accepted. We're waiting on the other person now."
          : `${myName} accepted. We're waiting on your answer.`,
        actorId: user.id,
      });
    }

    revalidatePath("/connections");
    revalidatePath("/dashboard");
    return { ok: true, message: "Accepted. Waiting on the other person." };
  }

  /* ------------------- Both accepted: open the channel ------------------ */
  const { data: conversation, error: convError } = await admin
    .from("conversations")
    .insert({ connection_id: connectionId })
    .select("id")
    .single();

  if (convError || !conversation) {
    // The conversation may already exist from a retry — recover rather than fail.
    const { data: existing } = await admin
      .from("conversations")
      .select("id")
      .eq("connection_id", connectionId)
      .single();
    if (!existing) return { ok: false, error: "We connected you, but couldn't open the chat. Please refresh." };
    return finish(existing.id);
  }

  return finish(conversation.id);

  async function finish(conversationId: string) {
    await admin.from("conversation_participants").upsert(
      [
        { conversation_id: conversationId, user_id: connection!.requester_id },
        { conversation_id: conversationId, user_id: connection!.helper_id },
      ],
      { onConflict: "conversation_id,user_id" },
    );

    if (connection!.need_id) {
      await admin.from("needs").update({ status: "connected" }).eq("id", connection!.need_id);
      await logStatusEvent({
        entityType: "need",
        entityId: connection!.need_id,
        ownerId: connection!.requester_id,
        status: "connected",
        message: "You're both in. A private conversation is open — say hello whenever you're ready.",
        actorId: user!.id,
      });
    }
    if (connection!.offer_id) {
      await admin.from("offers").update({ status: "matched" }).eq("id", connection!.offer_id);
    }

    await Promise.all([
      notify({
        userId: connection!.requester_id,
        type: "connected",
        title: "You're connected — the conversation is open",
        body: "Both of you agreed. You can now message each other privately on WeCanHelpWay.",
        link: `/messages/${conversationId}`,
        emailCtaLabel: "Open the conversation",
      }),
      notify({
        userId: connection!.helper_id,
        type: "connected",
        title: "You're connected — the conversation is open",
        body: "Both of you agreed. You can now message each other privately on WeCanHelpWay.",
        link: `/messages/${conversationId}`,
        emailCtaLabel: "Open the conversation",
      }),
    ]);

    revalidatePath("/connections");
    revalidatePath("/messages");
    revalidatePath("/dashboard");
    return { ok: true as const, data: { conversationId }, message: "You're connected." };
  }
}

/* ---------------------- Marking a connection complete --------------------- */

export async function completeConnection(connectionId: string): Promise<ActionResult> {
  const user = await getUser();
  if (!user) return { ok: false, error: "You need to be signed in." };

  const connection = await loadConnection(connectionId);
  if (!connection) return { ok: false, error: "That connection no longer exists." };
  if (connection.requester_id !== user.id && connection.helper_id !== user.id) {
    return { ok: false, error: "This connection isn't yours." };
  }

  const admin = createAdminClient();
  await admin
    .from("connections")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", connectionId);

  const otherId = connection.requester_id === user.id ? connection.helper_id : connection.requester_id;
  await notify({
    userId: otherId,
    type: "connection_completed",
    title: "This connection has been marked complete",
    body: "Your conversation stays available, and either of you can pick it back up any time.",
    link: "/connections",
  });

  revalidatePath("/connections");
  return { ok: true, message: "Marked complete." };
}

/* -------------------------- Reading for the UI ---------------------------- */

export interface ConnectionView extends Connection {
  other: { id: string; full_name: string | null; avatar_url: string | null; bio: string | null; country: string | null; skills: string[] };
  need: { id: string; title: string; category: string } | null;
  offer: { id: string; title: string; category: string } | null;
  conversation_id: string | null;
  my_role: "requester" | "helper";
  my_response: "pending" | "accepted" | "declined";
}

/** Everything the /connections screen needs, in one round trip per table. */
export async function listMyConnections(): Promise<ConnectionView[]> {
  const user = await getUser();
  if (!user) return [];

  const supabase = await createClient();
  const { data: connections } = await supabase
    .from("connections")
    .select("*")
    .or(`requester_id.eq.${user.id},helper_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  if (!connections?.length) return [];

  const admin = createAdminClient();
  const otherIds = connections.map((c) => (c.requester_id === user.id ? c.helper_id : c.requester_id));
  const needIds = connections.map((c) => c.need_id).filter(Boolean) as string[];
  const offerIds = connections.map((c) => c.offer_id).filter(Boolean) as string[];

  const [{ data: profiles }, { data: needs }, { data: offers }, { data: conversations }] = await Promise.all([
    admin.from("profiles").select("id, full_name, avatar_url, bio, country, skills").in("id", otherIds),
    needIds.length ? admin.from("needs").select("id, title, category").in("id", needIds) : Promise.resolve({ data: [] }),
    offerIds.length ? admin.from("offers").select("id, title, category").in("id", offerIds) : Promise.resolve({ data: [] }),
    admin.from("conversations").select("id, connection_id").in("connection_id", connections.map((c) => c.id)),
  ]);

  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));
  const needById = new Map((needs ?? []).map((n) => [n.id, n]));
  const offerById = new Map((offers ?? []).map((o) => [o.id, o]));
  const convByConnection = new Map((conversations ?? []).map((c) => [c.connection_id, c.id]));

  return connections.map((c) => {
    const isRequester = c.requester_id === user.id;
    const otherId = isRequester ? c.helper_id : c.requester_id;
    return {
      ...(c as Connection),
      other: (profileById.get(otherId) as ConnectionView["other"]) ?? {
        id: otherId,
        full_name: "Someone",
        avatar_url: null,
        bio: null,
        country: null,
        skills: [],
      },
      need: c.need_id ? (needById.get(c.need_id) as ConnectionView["need"]) ?? null : null,
      offer: c.offer_id ? (offerById.get(c.offer_id) as ConnectionView["offer"]) ?? null : null,
      conversation_id: convByConnection.get(c.id) ?? null,
      my_role: isRequester ? "requester" : "helper",
      my_response: isRequester ? c.requester_response : c.helper_response,
    };
  });
}
