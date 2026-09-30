"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client. Session persistence and refresh are handled by
 * @supabase/ssr writing to cookies, which the middleware then keeps alive.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

let singleton: ReturnType<typeof createBrowserClient> | null = null;

/** Reuse one client so realtime channels share a single socket. */
export function supabaseBrowser() {
  if (!singleton) singleton = createClient();
  return singleton;
}
