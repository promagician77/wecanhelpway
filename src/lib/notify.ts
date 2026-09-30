import "server-only";
import { createAdminClient } from "@/lib/supabase/server";
import { sendMail } from "@/lib/email";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export interface NotifyInput {
  userId: string;
  type: string;
  title: string;
  body?: string;
  /** App-relative path, e.g. "/needs/abc". */
  link?: string;
  /** Also send an email. Defaults to true — Stage 1 ships in-app + email. */
  email?: boolean;
  emailCtaLabel?: string;
}

/**
 * Writes an in-app notification and (by default) mirrors it to email.
 * Uses the service-role client because we routinely notify the *other* party,
 * whose notification rows the acting user cannot insert under RLS.
 */
export async function notify(input: NotifyInput) {
  const admin = createAdminClient();

  const { error } = await admin.from("notifications").insert({
    user_id: input.userId,
    type: input.type,
    title: input.title,
    body: input.body ?? null,
    link: input.link ?? null,
  });
  if (error) console.error("[notify:insert]", error.message);

  if (input.email === false) return;

  const { data: profile } = await admin
    .from("profiles")
    .select("email, full_name")
    .eq("id", input.userId)
    .single();

  if (!profile?.email) return;

  await sendMail({
    to: profile.email,
    subject: input.title,
    heading: input.title,
    body: input.body ?? "",
    cta: input.link
      ? { label: input.emailCtaLabel ?? "Open WeCanHelpWay", href: `${SITE}${input.link}` }
      : undefined,
  });
}

/** Fan-out helper for the rare case where both parties get the same message. */
export async function notifyMany(userIds: string[], input: Omit<NotifyInput, "userId">) {
  await Promise.all(userIds.map((userId) => notify({ ...input, userId })));
}

/** Records a user-visible (or internal) event on the entity timeline. */
export async function logStatusEvent(args: {
  entityType: "need" | "offer" | "connection";
  entityId: string;
  ownerId: string | null;
  status: string;
  message?: string | null;
  actorId?: string | null;
  internal?: boolean;
}) {
  const admin = createAdminClient();
  const { error } = await admin.from("status_events").insert({
    entity_type: args.entityType,
    entity_id: args.entityId,
    owner_id: args.ownerId,
    status: args.status,
    message: args.message ?? null,
    actor_id: args.actorId ?? null,
    is_internal: args.internal ?? false,
  });
  if (error) console.error("[status_event]", error.message);
}
