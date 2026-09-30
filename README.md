# WeCanHelpWay

Tell us what you need — even if you can't name it yet. A real person on the team reads it,
finds someone who can genuinely help, and asks you both before anyone is introduced.

This is the **Stage 1 production MVP**: authentication, profiles, "I Need Help", "I Want to Help",
a team dashboard with manual matching, a two-sided connection consent workflow, in-app + email
notifications, and realtime 1-on-1 chat.

**Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · Framer Motion · Supabase
(Postgres + Auth + Realtime + Storage)

---

## Getting it running

### 1. Install

```bash
npm install
```

### 2. Create a Supabase project

At [supabase.com](https://supabase.com), then open **SQL Editor** and run the whole of
[`supabase/schema.sql`](supabase/schema.sql). It is idempotent, so you can re-run it safely.

That one file creates every table, enum, trigger, row-level-security policy, realtime
publication, and the public `avatars` storage bucket.

### 3. Environment

```bash
cp .env.example .env.local
```

Fill it in from **Project Settings → API**:

| Variable | Where it comes from | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL | |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `anon` public key | |
| `SUPABASE_SERVICE_ROLE_KEY` | `service_role` secret | **Server-only.** Bypasses RLS. |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` in dev | Used for auth redirects and email links. |
| `RESEND_API_KEY` | [resend.com](https://resend.com) | Optional. Without it, emails are logged to the server console instead of sent. |
| `EMAIL_FROM` | e.g. `WeCanHelpWay <hello@yourdomain.com>` | Must be a domain verified with Resend. |

### 4. Configure auth in Supabase

**Authentication → URL Configuration**

- Site URL: `http://localhost:3000`
- Redirect URLs: `http://localhost:3000/auth/callback`, `http://localhost:3000/auth/confirm`

**Authentication → Providers**

- **Email** — enable *Confirm email* so the verification flow is exercised.
- **Google** — create an OAuth client in Google Cloud Console; the authorised redirect URI is
  `https://<your-project>.supabase.co/auth/v1/callback`. Paste the client ID and secret.
- **Apple** — create a Services ID and key in the Apple Developer portal; same callback URL.
- **Phone** — optional. Phone verification needs an SMS provider (Twilio, MessageBird, Vonage)
  configured here. Without one, the app shows the provider's error rather than failing silently;
  every other feature works.

### 5. Run

```bash
npm run dev
```

### 6. Make yourself an admin

Sign up through the app, then run [`supabase/make-admin.sql`](supabase/make-admin.sql) with your
email address. **Team Dashboard** then appears in the sidebar and `/admin` unlocks.

---

## The workflow this implements

```
Visitor → Sign up → Create profile
   → "I Need Help" → Submit need
   → Team reviews (Under Review → We're Looking for a Match)
   → Team manually picks a helper → Connection Proposed
   → User A accepts → User B accepts
   → Connected → private 1-on-1 chat opens
   → Need resolved / connection completed
```

And from the other direction: *"I Want to Help"* → describe your offer → team reviews → you're in
the matching pool → you're proposed to a specific person → you both accept → private chat.

**A conversation only ever opens when both people have said yes.** There is no way for one member
to message another otherwise — no directory, no search, no cold contact. Either side can decline
without giving a reason, and the team can withdraw a proposal before it is accepted.

### "I'm not sure what I need" is a first-class answer

It is the first option in the category picker, with the same visual weight as everything else, and
it flags the request for the team (`needs.not_sure`). Nobody is blocked from asking for help
because they can't categorise their own problem.

---

## Layout

```
src/
  app/
    page.tsx                  Landing page
    (auth)/                   Sign in, sign up, password reset, recovery
    auth/callback|confirm/    OAuth return leg + emailed-link handler
    (app)/                    Authenticated shell (sidebar + topbar)
      dashboard/  profile/  welcome/
      needs/                  Submit, list, status journey, edit
      offers/                 Submit, list, detail, pause
      connections/            Accept / decline introductions
      messages/               Inbox + realtime chat
      notifications/
    admin/                    WeCanHelpWay Team Dashboard
      needs/[id]/             Review, clarify, triage, propose a match
      offers/  connections/  users/
  actions/                    Server actions, one file per domain
  components/
    ui/                       Design system (button, field, feedback, misc, backdrop)
    marketing/  app/  admin/  auth/
  lib/                        supabase clients, auth guards, types, constants, email, notify
supabase/
  schema.sql                  Everything: tables, RLS, triggers, realtime, storage
  make-admin.sql              Promote your account to admin
```

### Server actions

Every mutation is a server action returning the same shape, so forms render errors uniformly:

```ts
type ActionResult<T> =
  | { ok: true; data?: T; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> }
```

### Two Supabase clients, on purpose

- `createClient()` — the user's own session. Subject to RLS. Used for anything the user owns.
- `createAdminClient()` — service role, **bypasses RLS**. Used only where the acting user
  legitimately cannot reach the row: notifying the *other* party, reading a helper's profile while
  proposing a match, and the admin dashboard's queries. Never imported into client code.

### Realtime

One channel per conversation carries three layers: `postgres_changes` for new message rows,
**presence** for the online dot, and a throttled **broadcast** event for the typing indicator —
which deliberately never touches the database. The notification bell and the inbox each subscribe
to their own channel.

---

## Design system

Dark-first, built around a small token set in `src/app/globals.css`. Every interactive element is
custom rather than a stock component:

- **Buttons** — pointer-tracked glow, magnetic hover, a sheen sweep, and an `aurora` variant whose
  border is a rotating conic gradient (which works because `--angle` is registered with
  `@property`, so it's actually interpolatable).
- **Fields** — floating labels, a gradient ring that draws itself on focus, outer bloom, character
  counters, a password strength meter, animated tag chips with suggestions, and a 6-digit OTP input.
- **Progress** — gradient fills with drifting stripes and a bright head; a segmented step bar for
  the multi-step forms.
- **Loaders** — conic-gradient spinners masked to a ring, an orbit loader, shimmer skeletons, and a
  top-of-window route progress bar.
- **Cards** — glass surfaces with a cursor-following spotlight, plus `AuroraCard` with a rotating
  border for the one thing on a page that needs an answer.
- **Journey rail** — the status timeline, showing the whole road rather than just the current step.

`prefers-reduced-motion` is respected globally.

---

## Notes and known constraints

- **Emails** are logged to the server console unless `RESEND_API_KEY` is set. Nothing fails
  silently in development.
- **Phone verification** requires an SMS provider on the Supabase project. Everything else works
  without one.
- **Message email** is only sent when the recipient has been away for more than three minutes —
  realtime already tells an open tab, and nobody wants mail for every line of a live chat.
- **`process.version` build warning** from `@supabase/supabase-js` in the Edge runtime is expected
  and harmless; `@supabase/ssr` is supported in middleware.
- **Webpack's filesystem cache is disabled for production builds** in `next.config.ts` because the
  machine this was built on was nearly out of disk. Delete that `webpack` block to get faster
  rebuilds back.

## Deliberately not in Stage 1

AI matching · automated recommendations · public user directory · direct user-to-user contact ·
group chat · public feed · payments · voice/video · mobile app · multi-language · gamification.

The matching is manual by design. The point of Stage 1 is to learn how people actually use the
platform before automating the judgement.
