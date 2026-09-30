"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import type { ActionResult } from "@/lib/types";

const profileSchema = z.object({
  full_name: z.string().min(2, "Please give us a name we can use.").max(80),
  phone: z
    .string()
    .trim()
    .max(24)
    .refine((v) => !v || /^\+?[\d\s().-]{6,24}$/.test(v), "That doesn't look like a phone number.")
    .optional(),
  country: z.string().max(80).optional(),
  address: z.string().max(200).optional(),
  bio: z.string().max(600, "Keep it under 600 characters.").optional(),
  what_they_need: z.string().max(400).optional(),
  what_they_offer: z.string().max(400).optional(),
});

function tags(formData: FormData, key: string): string[] {
  return String(formData.get(key) ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 30);
}

export async function updateProfile(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const user = await getUser();
  if (!user) return { ok: false, error: "You need to be signed in." };

  const parsed = profileSchema.safeParse({
    full_name: formData.get("full_name"),
    phone: formData.get("phone") ?? "",
    country: formData.get("country") ?? "",
    address: formData.get("address") ?? "",
    bio: formData.get("bio") ?? "",
    what_they_need: formData.get("what_they_need") ?? "",
    what_they_offer: formData.get("what_they_offer") ?? "",
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
  const { error } = await supabase
    .from("profiles")
    .update({
      ...parsed.data,
      languages: tags(formData, "languages"),
      skills: tags(formData, "skills"),
      interests: tags(formData, "interests"),
      onboarding_done: true,
    })
    .eq("id", user.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  return { ok: true, message: "Profile saved." };
}

/** Uploads to the public `avatars` bucket under the user's own folder. */
export async function uploadAvatar(formData: FormData): Promise<ActionResult<{ url: string }>> {
  const user = await getUser();
  if (!user) return { ok: false, error: "You need to be signed in." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Choose an image first." };
  }
  if (file.size > 4 * 1024 * 1024) {
    return { ok: false, error: "That image is over 4 MB. Try a smaller one." };
  }
  if (!file.type.startsWith("image/")) {
    return { ok: false, error: "That file isn't an image." };
  }

  const supabase = await createClient();
  const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `${user.id}/avatar-${Date.now()}.${ext || "jpg"}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type, cacheControl: "3600" });

  if (uploadError) return { ok: false, error: uploadError.message };

  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(path);

  const { error } = await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", user.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/profile");
  revalidatePath("/", "layout");
  return { ok: true, data: { url: publicUrl }, message: "Photo updated." };
}

export async function completeOnboarding(): Promise<ActionResult> {
  const user = await getUser();
  if (!user) return { ok: false, error: "You need to be signed in." };

  const supabase = await createClient();
  await supabase.from("profiles").update({ onboarding_done: true }).eq("id", user.id);
  revalidatePath("/", "layout");
  return { ok: true };
}
