"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";
import { logStatusEvent, notify } from "@/lib/notify";
import { NEED_STATUS_META, OFFER_STATUS_META } from "@/lib/constants";
import type { ActionResult, NeedStatus, OfferStatus, Priority, Profile } from "@/lib/types";

/** Every admin action funnels through here — one place that proves the role. */
async function requireAdminSession() {
  const session = await getSession();
  if (!session || session.profile.role !== "admin") return null;
  return session;
}

/* ------------------------------ Need triage ------------------------------- */

export async function setNeedStatus(
  needId: string,
  status: NeedStatus,
  message?: string,
): Promise<ActionResult> {
  const session = await requireAdminSession();
  if (!session) return { ok: false, error: "Admins only." };

  const admin = createAdminClient();
  const { data: need } = await admin.from("needs").select("user_id, title").eq("id", needId).single();
  if (!need) return { ok: false, error: "That request no longer exists." };

  const { error } = await admin
    .from("needs")
    .update({ status, ...(status === "resolved" ? { resolved_at: new Date().toISOString() } : {}) })
    .eq("id", needId);
  if (error) return { ok: false, error: error.message };

  const meta = NEED_STATUS_META[status];

  await logStatusEvent({
    entityType: "need",
    entityId: needId,
    ownerId: need.user_id,
    status,
    message: message?.trim() || meta.blurb,
    actorId: session.user.id,
  });

  // Silent housekeeping shouldn't ping anyone.
  if (!["archived"].includes(status)) {
    await notify({
      userId: need.user_id,
      type: `need_${status}`,
      title: `Your request is now “${meta.label}”`,
      body: message?.trim() || meta.blurb,
      link: `/needs/${needId}`,
      emailCtaLabel: "See what's happening",
    });
  }

  revalidatePath("/admin/needs");
  revalidatePath(`/admin/needs/${needId}`);
  revalidatePath(`/needs/${needId}`);
  return { ok: true, message: `Marked as ${meta.label}.` };
}

export async function setNeedPriority(needId: string, priority: Priority): Promise<ActionResult> {
  const session = await requireAdminSession();
  if (!session) return { ok: false, error: "Admins only." };

  const admin = createAdminClient();
  const { error } = await admin.from("needs").update({ priority }).eq("id", needId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/needs");
  revalidatePath(`/admin/needs/${needId}`);
  return { ok: true, message: `Priority set to ${priority}.` };
}

/** Asks the person a question and moves the need into a blocked state. */
export async function requestClarification(needId: string, question: string): Promise<ActionResult> {
  const session = await requireAdminSession();
  if (!session) return { ok: false, error: "Admins only." };
  if (!question.trim()) return { ok: false, error: "Write the question you want to ask." };

  const admin = createAdminClient();
  const { data: need } = await admin.from("needs").select("user_id").eq("id", needId).single();
  if (!need) return { ok: false, error: "That request no longer exists." };

  await admin.from("needs").update({ status: "needs_clarification" }).eq("id", needId);

  await logStatusEvent({
    entityType: "need",
    entityId: needId,
    ownerId: need.user_id,
    status: "needs_clarification",
    message: question.trim(),
    actorId: session.user.id,
  });

  await notify({
    userId: need.user_id,
    type: "need_clarification",
    title: "We have a question about your request",
    body: question.trim(),
    link: `/needs/${needId}`,
    emailCtaLabel: "Answer the question",
  });

  revalidatePath("/admin/needs");
  revalidatePath(`/admin/needs/${needId}`);
  return { ok: true, message: "Question sent." };
}

/* ------------------------------ Offer triage ------------------------------ */

export async function setOfferStatus(
  offerId: string,
  status: OfferStatus,
  message?: string,
): Promise<ActionResult> {
  const session = await requireAdminSession();
  if (!session) return { ok: false, error: "Admins only." };

  const admin = createAdminClient();
  const { data: offer } = await admin.from("offers").select("user_id").eq("id", offerId).single();
  if (!offer) return { ok: false, error: "That offer no longer exists." };

  const { error } = await admin.from("offers").update({ status }).eq("id", offerId);
  if (error) return { ok: false, error: error.message };

  const meta = OFFER_STATUS_META[status];

  await logStatusEvent({
    entityType: "offer",
    entityId: offerId,
    ownerId: offer.user_id,
    status,
    message: message?.trim() || meta.blurb,
    actorId: session.user.id,
  });

  if (!["archived"].includes(status)) {
    await notify({
      userId: offer.user_id,
      type: `offer_${status}`,
      title: `Your offer is now “${meta.label}”`,
      body: message?.trim() || meta.blurb,
      link: `/offers/${offerId}`,
    });
  }

  revalidatePath("/admin/offers");
  return { ok: true, message: `Marked as ${meta.label}.` };
}

/* ------------------------------ Internal notes ---------------------------- */

export async function addAdminNote(
  entityType: "need" | "offer" | "profile" | "connection",
  entityId: string,
  body: string,
): Promise<ActionResult> {
  const session = await requireAdminSession();
  if (!session) return { ok: false, error: "Admins only." };
  if (!body.trim()) return { ok: false, error: "The note is empty." };

  const admin = createAdminClient();
  const { error } = await admin
    .from("admin_notes")
    .insert({ entity_type: entityType, entity_id: entityId, author_id: session.user.id, body: body.trim() });
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/admin/${entityType}s/${entityId}`);
  revalidatePath("/admin/needs");
  return { ok: true, message: "Note added." };
}

/* --------------------------- Proposing a match ---------------------------- */

/**
 * The manual match. Deliberately human: an admin reads a need, picks a person,
 * and proposes. No scoring, no automation — we want to learn how people
 * actually use this before we automate any of it.
 */
export async function proposeConnection(input: {
  needId: string;
  helperId: string;
  offerId?: string | null;
  message?: string;
}): Promise<ActionResult<{ connectionId: string }>> {
  const session = await requireAdminSession();
  if (!session) return { ok: false, error: "Admins only." };

  const admin = createAdminClient();
  const { data: need } = await admin
    .from("needs")
    .select("id, user_id, title, category")
    .eq("id", input.needId)
    .single();
  if (!need) return { ok: false, error: "That request no longer exists." };

  if (need.user_id === input.helperId) {
    return { ok: false, error: "You can't connect someone to their own request." };
  }

  // Don't stack duplicate live proposals between the same two people.
  const { data: existing } = await admin
    .from("connections")
    .select("id")
    .eq("need_id", input.needId)
    .eq("helper_id", input.helperId)
    .in("status", ["proposed", "partially_accepted", "connected"])
    .maybeSingle();

  if (existing) return { ok: false, error: "There's already a live proposal between these two." };

  const { data: connection, error } = await admin
    .from("connections")
    .insert({
      need_id: input.needId,
      offer_id: input.offerId ?? null,
      requester_id: need.user_id,
      helper_id: input.helperId,
      proposed_by: session.user.id,
      status: "proposed",
      admin_message: input.message?.trim() || null,
    })
    .select("id")
    .single();

  if (error || !connection) return { ok: false, error: error?.message ?? "Couldn't create the proposal." };

  await admin.from("needs").update({ status: "connection_proposed" }).eq("id", input.needId);

  await logStatusEvent({
    entityType: "need",
    entityId: input.needId,
    ownerId: need.user_id,
    status: "connection_proposed",
    message:
      input.message?.trim() ||
      "We found someone who may be able to help. Have a look — nothing happens until you both agree.",
    actorId: session.user.id,
  });

  const [{ data: requesterProfile }, { data: helperProfile }] = await Promise.all([
    admin.from("profiles").select("full_name").eq("id", need.user_id).single(),
    admin.from("profiles").select("full_name").eq("id", input.helperId).single(),
  ]);

  await Promise.all([
    notify({
      userId: need.user_id,
      type: "connection_proposed",
      title: "We found someone who may be able to help",
      body:
        input.message?.trim() ||
        `We think ${helperProfile?.full_name ?? "someone in our community"} could help with “${need.title}”. Take a look — they'll only be able to message you if you both agree.`,
      link: "/connections",
      emailCtaLabel: "Review the introduction",
    }),
    notify({
      userId: input.helperId,
      type: "connection_proposed",
      title: "Someone could use your help",
      body:
        input.message?.trim() ||
        `${requesterProfile?.full_name ?? "Someone"} needs help with “${need.title}”. If it feels like a fit, accept and we'll open a private conversation.`,
      link: "/connections",
      emailCtaLabel: "See the request",
    }),
  ]);

  revalidatePath("/admin/needs");
  revalidatePath(`/admin/needs/${input.needId}`);
  revalidatePath("/admin/connections");
  return { ok: true, data: { connectionId: connection.id }, message: "Connection proposed to both people." };
}

export async function cancelConnection(connectionId: string, reason: string): Promise<ActionResult> {
  const session = await requireAdminSession();
  if (!session) return { ok: false, error: "Admins only." };

  const admin = createAdminClient();
  const { data: connection } = await admin
    .from("connections")
    .select("requester_id, helper_id, need_id, status")
    .eq("id", connectionId)
    .single();
  if (!connection) return { ok: false, error: "That connection no longer exists." };

  await admin
    .from("connections")
    .update({ status: "cancelled", cancel_reason: reason.trim() || null })
    .eq("id", connectionId);

  if (connection.need_id) {
    await admin.from("needs").update({ status: "looking_for_match" }).eq("id", connection.need_id);
    await logStatusEvent({
      entityType: "need",
      entityId: connection.need_id,
      ownerId: connection.requester_id,
      status: "looking_for_match",
      message: reason.trim() || "We withdrew that introduction and are looking for a better match.",
      actorId: session.user.id,
    });
  }

  await Promise.all(
    [connection.requester_id, connection.helper_id].map((userId) =>
      notify({
        userId,
        type: "connection_cancelled",
        title: "We've withdrawn that introduction",
        body: reason.trim() || "Our team cancelled this proposed connection. We're looking for a better fit.",
        link: "/connections",
      }),
    ),
  );

  revalidatePath("/admin/connections");
  revalidatePath("/connections");
  return { ok: true, message: "Connection cancelled." };
}

/* ------------------------------ People admin ------------------------------ */

export async function setUserRole(userId: string, role: "user" | "admin"): Promise<ActionResult> {
  const session = await requireAdminSession();
  if (!session) return { ok: false, error: "Admins only." };
  if (userId === session.user.id) return { ok: false, error: "You can't change your own role." };

  const admin = createAdminClient();
  const { error } = await admin.from("profiles").update({ role }).eq("id", userId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/users");
  return { ok: true, message: `Role set to ${role}.` };
}

export async function setAccountStatus(
  userId: string,
  status: Profile["account_status"],
): Promise<ActionResult> {
  const session = await requireAdminSession();
  if (!session) return { ok: false, error: "Admins only." };
  if (userId === session.user.id) return { ok: false, error: "You can't change your own account status." };

  const admin = createAdminClient();
  const { error } = await admin.from("profiles").update({ account_status: status }).eq("id", userId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/users");
  return { ok: true, message: `Account marked ${status}.` };
}

/* ------------------------ Candidate helper search ------------------------- */

export interface Candidate {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  country: string | null;
  bio: string | null;
  skills: string[];
  offer: { id: string; title: string; category: string; description: string; availability: string | null } | null;
  /** Why this person surfaced — shown to the admin, never scored automatically. */
  reasons: string[];
}

/**
 * Surfaces people an admin might propose. This is search, not matching: it
 * ranks nothing and decides nothing. The admin reads and chooses.
 */
export async function findCandidates(needId: string, query?: string): Promise<Candidate[]> {
  const session = await requireAdminSession();
  if (!session) return [];

  const admin = createAdminClient();
  const { data: need } = await admin
    .from("needs")
    .select("id, user_id, category, title, description")
    .eq("id", needId)
    .single();
  if (!need) return [];

  let offerQuery = admin
    .from("offers")
    .select("id, user_id, title, category, description, availability, skills, status")
    .in("status", ["active", "submitted", "under_review", "matched"])
    .neq("user_id", need.user_id)
    .limit(60);

  const q = query?.trim();
  if (q) {
    offerQuery = offerQuery.or(`title.ilike.%${q}%,description.ilike.%${q}%,category.ilike.%${q}%`);
  }

  const { data: offers } = await offerQuery;
  if (!offers?.length) return [];

  const userIds = [...new Set(offers.map((o) => o.user_id))];
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, full_name, avatar_url, country, bio, skills, account_status")
    .in("id", userIds)
    .eq("account_status", "active");

  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));

  return offers
    .filter((o) => profileById.has(o.user_id))
    .map((o) => {
      const profile = profileById.get(o.user_id)!;
      const reasons: string[] = [];
      if (o.category === need.category) reasons.push("Same category");

      const needText = `${need.title} ${need.description}`.toLowerCase();
      const overlap = (o.skills ?? []).filter((s: string) => needText.includes(s.toLowerCase()));
      if (overlap.length) reasons.push(`Mentions ${overlap.slice(0, 3).join(", ")}`);
      if (o.status === "active") reasons.push("Available now");

      return {
        id: profile.id,
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
        country: profile.country,
        bio: profile.bio,
        skills: profile.skills ?? [],
        offer: {
          id: o.id,
          title: o.title,
          category: o.category,
          description: o.description,
          availability: o.availability,
        },
        reasons,
      };
    });
}
