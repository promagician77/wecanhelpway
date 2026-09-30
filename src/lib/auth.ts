import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

/** Current auth user, or null. */
export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** Current user + profile row, or null if signed out. */
export async function getSession(): Promise<{ user: NonNullable<Awaited<ReturnType<typeof getUser>>>; profile: Profile } | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile) return null;

  return { user, profile: profile as Profile };
}

/** Use in any page that must not render for signed-out visitors. */
export async function requireUser() {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  return session;
}

/** Use in the admin area. Non-admins are bounced to their own dashboard. */
export async function requireAdmin() {
  const session = await getSession();
  if (!session) redirect("/sign-in?next=/admin");
  if (session.profile.role !== "admin") redirect("/dashboard");
  return session;
}

/** Best-effort presence heartbeat. Never blocks a render. */
export async function touchLastSeen(userId: string) {
  try {
    const supabase = await createClient();
    await supabase.from("profiles").update({ last_seen_at: new Date().toISOString() }).eq("id", userId);
  } catch {
    /* presence is cosmetic */
  }
}
