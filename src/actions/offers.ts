"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { logStatusEvent, notify } from "@/lib/notify";
import { OFFER_STATUS_META } from "@/lib/constants";
import type { ActionResult } from "@/lib/types";

const offerSchema = z.object({
  category: z.string().min(1, "Pick the closest category."),
  title: z.string().min(6, "Give it a short headline.").max(120),
  description: z.string().min(20, "Tell us a bit more — at least 20 characters.").max(4000),
  experience: z.string().max(200).optional(),
  availability: z.string().max(200).optional(),
  preferred_help: z.string().max(200).optional(),
  location: z.string().max(120).optional(),
  timezone: z.string().max(80).optional(),
});

function skills(formData: FormData): string[] {
  return String(formData.get("skills") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 30);
}

function fieldErrorsOf(error: z.ZodError) {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const k = String(issue.path[0] ?? "form");
    if (!out[k]) out[k] = issue.message;
  }
  return out;
}

export async function createOffer(_prev: unknown, formData: FormData): Promise<ActionResult<{ id: string }>> {
  const user = await getUser();
  if (!user) return { ok: false, error: "You need to be signed in." };

  const parsed = offerSchema.safeParse({
    category: formData.get("category"),
    title: formData.get("title"),
    description: formData.get("description"),
    experience: formData.get("experience") ?? "",
    availability: formData.get("availability") ?? "",
    preferred_help: formData.get("preferred_help") ?? "",
    location: formData.get("location") ?? "",
    timezone: formData.get("timezone") ?? "",
  });

  if (!parsed.success) {
    return { ok: false, error: "A couple of fields need attention.", fieldErrors: fieldErrorsOf(parsed.error) };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("offers")
    .insert({ user_id: user.id, ...parsed.data, skills: skills(formData), status: "submitted" })
    .select("id")
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? "We couldn't save that. Try again." };

  await logStatusEvent({
    entityType: "offer",
    entityId: data.id,
    ownerId: user.id,
    status: "submitted",
    message: OFFER_STATUS_META.submitted.blurb,
    actorId: user.id,
  });

  await notify({
    userId: user.id,
    type: "offer_submitted",
    title: "Thank you for offering to help",
    body: `We have “${parsed.data.title}”. Our team reviews every offer, then matches you with someone who needs exactly this.`,
    link: `/offers/${data.id}`,
    emailCtaLabel: "View your offer",
  });

  revalidatePath("/offers");
  revalidatePath("/dashboard");
  return { ok: true, data: { id: data.id } };
}

export async function updateOffer(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const user = await getUser();
  if (!user) return { ok: false, error: "You need to be signed in." };

  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "Missing offer." };

  const parsed = offerSchema.safeParse({
    category: formData.get("category"),
    title: formData.get("title"),
    description: formData.get("description"),
    experience: formData.get("experience") ?? "",
    availability: formData.get("availability") ?? "",
    preferred_help: formData.get("preferred_help") ?? "",
    location: formData.get("location") ?? "",
    timezone: formData.get("timezone") ?? "",
  });

  if (!parsed.success) {
    return { ok: false, error: "Please check the highlighted fields.", fieldErrors: fieldErrorsOf(parsed.error) };
  }

  const supabase = await createClient();
  const { data: current } = await supabase.from("offers").select("status").eq("id", id).single();
  const nextStatus = current?.status === "needs_clarification" ? "under_review" : undefined;

  const { error } = await supabase
    .from("offers")
    .update({ ...parsed.data, skills: skills(formData), ...(nextStatus ? { status: nextStatus } : {}) })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/offers/${id}`);
  revalidatePath("/offers");
  return { ok: true, message: "Offer updated." };
}

/** Let a helper step out of the matching pool without deleting anything. */
export async function setOfferPaused(id: string, paused: boolean): Promise<ActionResult> {
  const user = await getUser();
  if (!user) return { ok: false, error: "You need to be signed in." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("offers")
    .update({ status: paused ? "paused" : "active" })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { ok: false, error: error.message };

  await logStatusEvent({
    entityType: "offer",
    entityId: id,
    ownerId: user.id,
    status: paused ? "paused" : "active",
    message: paused
      ? "You paused this offer. We won't suggest you for new matches until you resume."
      : "You're back in the matching pool.",
    actorId: user.id,
  });

  revalidatePath(`/offers/${id}`);
  revalidatePath("/offers");
  return { ok: true, message: paused ? "Offer paused." : "Offer active again." };
}

export async function deleteOffer(id: string) {
  const user = await getUser();
  if (!user) redirect("/sign-in");

  const supabase = await createClient();
  await supabase.from("offers").delete().eq("id", id).eq("user_id", user.id);

  revalidatePath("/offers");
  redirect("/offers");
}
