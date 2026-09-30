import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * Handles every emailed link: signup confirmation, password recovery, email
 * change and magic-link sign-in. Supabase sends either `token_hash`+`type`
 * (PKCE email templates) or `code` (link-based flows), so both are accepted.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  const supabase = await createClient();

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      const target = next ?? (type === "recovery" ? "/reset-password" : "/welcome");
      return NextResponse.redirect(`${origin}${target}`);
    }
    return NextResponse.redirect(
      `${origin}/sign-in?error=${encodeURIComponent("That link has expired. Request a new one.")}`,
    );
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next ?? "/welcome"}`);
  }

  return NextResponse.redirect(
    `${origin}/sign-in?error=${encodeURIComponent("That link is no longer valid. Request a new one.")}`,
  );
}
