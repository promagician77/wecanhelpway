"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/types";

async function origin() {
  const h = await headers();
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host") ?? "localhost:3000"}`
  );
}

/* --------------------------------- Sign up -------------------------------- */

const signUpSchema = z.object({
  fullName: z.string().min(2, "Please tell us your name.").max(80),
  email: z.string().email("That doesn't look like an email address."),
  password: z
    .string()
    .min(8, "Use at least 8 characters.")
    .regex(/[a-z]/i, "Include at least one letter.")
    .regex(/\d/, "Include at least one number."),
  accept: z.literal("on", { message: "Please accept the terms to continue." }),
});

export async function signUp(_prev: unknown, formData: FormData): Promise<ActionResult<{ email: string }>> {
  const parsed = signUpSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    accept: formData.get("accept"),
  });

  if (!parsed.success) {
    return { ok: false, error: "Please check the fields below.", fieldErrors: flatten(parsed.error) };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: `${await origin()}/auth/confirm`,
    },
  });

  if (error) return { ok: false, error: friendly(error.message) };

  return { ok: true, data: { email: parsed.data.email } };
}

/* --------------------------------- Sign in -------------------------------- */

const signInSchema = z.object({
  email: z.string().email("Enter the email you signed up with."),
  password: z.string().min(1, "Enter your password."),
});

export async function signIn(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { ok: false, error: "Please check the fields below.", fieldErrors: flatten(parsed.error) };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    if (/email not confirmed/i.test(error.message)) {
      return {
        ok: false,
        error: "Your email isn't verified yet. Check your inbox — or resend the link below.",
      };
    }
    return { ok: false, error: "That email and password don't match an account." };
  }

  const next = String(formData.get("next") ?? "") || "/dashboard";
  revalidatePath("/", "layout");
  redirect(next.startsWith("/") ? next : "/dashboard");
}

/* ---------------------------------- OAuth --------------------------------- */

export async function signInWithProvider(provider: "google" | "apple", next?: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${await origin()}/auth/callback?next=${encodeURIComponent(next ?? "/dashboard")}`,
      queryParams: provider === "google" ? { access_type: "offline", prompt: "consent" } : undefined,
    },
  });

  if (error || !data?.url) {
    redirect(`/sign-in?error=${encodeURIComponent(error?.message ?? "Could not start sign-in.")}`);
  }
  redirect(data.url);
}

/* --------------------------------- Sign out ------------------------------- */

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

/* ------------------------------ Password reset ---------------------------- */

export async function requestPasswordReset(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "").trim();
  if (!z.string().email().safeParse(email).success) {
    return { ok: false, error: "Enter a valid email address.", fieldErrors: { email: "Invalid email." } };
  }

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${await origin()}/auth/confirm?next=/reset-password`,
  });

  // Always report success — never reveal whether an address is registered.
  return {
    ok: true,
    message: "If that address has an account, a reset link is on its way.",
  };
}

export async function updatePassword(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password.length < 8) {
    return { ok: false, error: "Use at least 8 characters.", fieldErrors: { password: "Too short." } };
  }
  if (password !== confirm) {
    return { ok: false, error: "The two passwords don't match.", fieldErrors: { confirm: "Doesn't match." } };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { ok: false, error: friendly(error.message) };

  return { ok: true, message: "Your password is updated." };
}

/* -------------------------- Email verification ---------------------------- */

export async function resendVerification(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { ok: false, error: "We need your email address to resend the link." };

  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: `${await origin()}/auth/confirm` },
  });
  if (error) return { ok: false, error: friendly(error.message) };

  return { ok: true, message: "Sent. Give it a minute, and check your spam folder." };
}

/* -------------------------- Phone verification ---------------------------- */

export async function sendPhoneOtp(_prev: unknown, formData: FormData): Promise<ActionResult<{ phone: string }>> {
  const phone = String(formData.get("phone") ?? "").replace(/[^\d+]/g, "");
  if (!/^\+\d{7,15}$/.test(phone)) {
    return {
      ok: false,
      error: "Enter your number in international format, e.g. +14155552671.",
      fieldErrors: { phone: "Include the country code." },
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ phone });
  if (error) return { ok: false, error: friendly(error.message) };

  return { ok: true, data: { phone }, message: `We sent a 6-digit code to ${phone}.` };
}

export async function verifyPhoneOtp(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const phone = String(formData.get("phone") ?? "");
  const token = String(formData.get("token") ?? "");

  if (token.length !== 6) return { ok: false, error: "Enter the full 6-digit code." };

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ phone, token, type: "phone_change" });
  if (error) return { ok: false, error: "That code didn't work. Check it, or request a new one." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    await supabase.from("profiles").update({ phone, phone_verified: true }).eq("id", user.id);
  }

  revalidatePath("/profile");
  return { ok: true, message: "Your phone number is verified." };
}

/* -------------------------------- Recovery -------------------------------- */

/** Magic-link fallback for people locked out of their password. */
export async function sendRecoveryLink(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "").trim();
  if (!z.string().email().safeParse(email).success) {
    return { ok: false, error: "Enter a valid email address." };
  }

  const supabase = await createClient();
  await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${await origin()}/auth/confirm`, shouldCreateUser: false },
  });

  return { ok: true, message: "If that address has an account, a one-time sign-in link is on its way." };
}

/* --------------------------------- helpers -------------------------------- */

function flatten(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

function friendly(message: string) {
  if (/already registered|already been registered/i.test(message))
    return "There's already an account with that email. Try signing in instead.";
  if (/rate limit|too many/i.test(message)) return "Too many attempts. Please wait a minute and try again.";
  if (/weak password/i.test(message)) return "That password is too easy to guess. Try a longer one.";
  if (/same.*password/i.test(message)) return "That's already your current password.";
  return message;
}
