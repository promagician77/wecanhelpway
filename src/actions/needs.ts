"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { logStatusEvent, notify } from "@/lib/notify";
import { NEED_STATUS_META } from "@/lib/constants";
import type { ActionResult } from "@/lib/types";

const needSchema = z.object({
  category: z.string().min(1, "Pick the closest option — or 'I'm not sure'."),
  title: z.string().min(6, "Give it a short title (at least 6 characters).").max(120),
  description: z.string().min(20, "Tell us a bit more — at least 20 characters.").max(4000),
  goal: z.string().max(1000).optional(),
  help_type: z.string().max(200).optional(),
  location: z.string().max(120).optional(),
  availability: z.string().max(200).optional(),
  preferences: z.string().max(1000).optional(),
});

export async function createNeed(_prev: unknown, formData: FormData): Promise<ActionResult<{ id: string }>> {
  const user = await getUser();
  if (!user) return { ok: false, error: "You need to be signed in." };

  const parsed = needSchema.safeParse({
    category: formData.get("category"),
    title: formData.get("title"),
    description: formData.get("description"),
    goal: formData.get("goal") ?? "",
    help_type: formData.get("help_type") ?? "",
    location: formData.get("location") ?? "",
    availability: formData.get("availability") ?? "",
    preferences: formData.get("preferences") ?? "",
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const k = String(issue.path[0] ?? "form");
      if (!fieldErrors[k]) fieldErrors[k] = issue.message;
    }
    return { ok: false, error: "Almost there — a couple of fields need attention.", fieldErrors };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("needs")
    .insert({
      user_id: user.id,
      ...parsed.data,
      not_sure: parsed.data.category === "not_sure",
      status: "submitted",
    })
    .select("id")
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? "We couldn't save that. Try again." };

  await logStatusEvent({
    entityType: "need",
    entityId: data.id,
    ownerId: user.id,
    status: "submitted",
    message: NEED_STATUS_META.submitted.blurb,
    actorId: user.id,
  });

  await notify({
    userId: user.id,
    type: "need_submitted",
    title: "We have your request",
    body: `“${parsed.data.title}” is with our team. We'll let you know the moment there's news.`,
    link: `/needs/${data.id}`,
    emailCtaLabel: "Track your request",
  });

  revalidatePath("/needs");
  revalidatePath("/dashboard");
  return { ok: true, data: { id: data.id } };
}

export async function updateNeed(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const user = await getUser();
  if (!user) return { ok: false, error: "You need to be signed in." };

  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "Missing request." };

  const parsed = needSchema.safeParse({
    category: formData.get("category"),
    title: formData.get("title"),
    description: formData.get("description"),
    goal: formData.get("goal") ?? "",
    help_type: formData.get("help_type") ?? "",
    location: formData.get("location") ?? "",
    availability: formData.get("availability") ?? "",
    preferences: formData.get("preferences") ?? "",
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const k = String(issue.path[0] ?? "form");
      if (!fieldErrors[k]) fieldErrors[k] = issue.message;
    }
    return { ok: false, error: "Please check the highlighted fields.", fieldErrors };
  }

  const supabase = await createClient();

  // Answering a clarification request puts the need back in the review queue.
  const { data: current } = await supabase.from("needs").select("status").eq("id", id).single();
  const nextStatus = current?.status === "needs_clarification" ? "under_review" : undefined;

  const { error } = await supabase
    .from("needs")
    .update({ ...parsed.data, not_sure: parsed.data.category === "not_sure", ...(nextStatus ? { status: nextStatus } : {}) })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { ok: false, error: error.message };

  if (nextStatus) {
    await logStatusEvent({
      entityType: "need",
      entityId: id,
      ownerId: user.id,
      status: "under_review",
      message: "You answered our question — this is back with the team.",
      actorId: user.id,
    });
  }

  revalidatePath(`/needs/${id}`);
  revalidatePath("/needs");
  return { ok: true, message: "Request updated." };
}

/** The user closing their own request — either happily or otherwise. */
export async function resolveNeed(id: string, outcome: "resolved" | "archived"): Promise<ActionResult> {
  const user = await getUser();
  if (!user) return { ok: false, error: "You need to be signed in." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("needs")
    .update({ status: outcome, resolved_at: outcome === "resolved" ? new Date().toISOString() : null })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { ok: false, error: error.message };

  await logStatusEvent({
    entityType: "need",
    entityId: id,
    ownerId: user.id,
    status: outcome,
    message:
      outcome === "resolved"
        ? "You marked this as resolved. Thank you for telling us — it teaches us who to match next."
        : "You archived this request.",
    actorId: user.id,
  });

  revalidatePath(`/needs/${id}`);
  revalidatePath("/needs");
  revalidatePath("/dashboard");
  return { ok: true, message: outcome === "resolved" ? "Marked resolved." : "Archived." };
}

export async function deleteNeed(id: string) {
  const user = await getUser();
  if (!user) redirect("/sign-in");

  const supabase = await createClient();
  await supabase.from("needs").delete().eq("id", id).eq("user_id", user.id);

  revalidatePath("/needs");
  redirect("/needs");
}

/** Read the user-visible timeline for a need. */
export async function getNeedTimeline(needId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("status_events")
    .select("*")
    .eq("entity_type", "need")
    .eq("entity_id", needId)
    .eq("is_internal", false)
    .order("created_at", { ascending: true });
  return data ?? [];
}
