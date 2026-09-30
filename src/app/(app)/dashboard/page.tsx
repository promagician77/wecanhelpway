import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Clock3,
  HandHeart,
  LifeBuoy,
  Link2,
  MessagesSquare,
  Sparkles,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { listMyConnections } from "@/actions/connections";
import { listConversations } from "@/actions/messages";
import { PageHeader, PageShell } from "@/components/app/page-header";
import { Badge, EmptyState, Reveal, SpotlightCard } from "@/components/ui/feedback";
import { Avatar } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { NEED_STATUS_META, OFFER_STATUS_META, categoryLabel } from "@/lib/constants";
import { relativeTime, truncate } from "@/lib/utils";
import type { Need, Offer } from "@/lib/types";
import { ProfileCompletion } from "@/components/app/profile-completion";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const { profile } = await requireUser();
  const supabase = await createClient();

  const [{ data: needs }, { data: offers }, connections, conversations] = await Promise.all([
    supabase.from("needs").select("*").eq("user_id", profile.id).order("created_at", { ascending: false }).limit(4),
    supabase.from("offers").select("*").eq("user_id", profile.id).order("created_at", { ascending: false }).limit(4),
    listMyConnections(),
    listConversations(),
  ]);

  const awaiting = connections.filter(
    (c) => c.my_response === "pending" && ["proposed", "partially_accepted"].includes(c.status),
  );
  const live = connections.filter((c) => c.status === "connected");
  const firstName = profile.full_name?.split(" ")[0] ?? "there";

  const stats = [
    { label: "Open requests", value: (needs ?? []).filter((n) => !["resolved", "archived", "rejected"].includes(n.status)).length, icon: LifeBuoy, href: "/needs" },
    { label: "Ways you help", value: (offers ?? []).filter((o) => !["archived", "rejected"].includes(o.status)).length, icon: HandHeart, href: "/offers" },
    { label: "Live connections", value: live.length, icon: Link2, href: "/connections" },
    { label: "Conversations", value: conversations.length, icon: MessagesSquare, href: "/messages" },
  ];

  return (
    <PageShell>
      <PageHeader
        eyebrow={new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 18 ? "Good afternoon" : "Good evening"}
        title={
          <>
            Hello, <span className="text-gradient">{firstName}</span>
          </>
        }
        description="Everything that's moving on your side of WeCanHelpWay, in one place."
        actions={
          <>
            <Link href="/needs/new">
              <Button size="md" icon={<LifeBuoy />}>
                I need help
              </Button>
            </Link>
            <Link href="/offers/new">
              <Button size="md" variant="glass" icon={<HandHeart />} magnetic={false}>
                I want to help
              </Button>
            </Link>
          </>
        }
      />

      <ProfileCompletion profile={profile} />

      {/* Stats ------------------------------------------------------------ */}
      <div className="mt-8 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Reveal key={stat.label} delay={i * 0.06}>
            <Link href={stat.href}>
              <SpotlightCard className="h-full p-5 transition-transform duration-300 hover:-translate-y-0.5">
                <stat.icon className="size-[18px] text-brand-700" />
                <p className="mt-3.5 text-[2rem] font-semibold leading-none tracking-[-0.04em] text-ink tabular-nums">
                  {stat.value}
                </p>
                <p className="mt-1.5 text-[12.5px] text-ink/58">{stat.label}</p>
              </SpotlightCard>
            </Link>
          </Reveal>
        ))}
      </div>

      {/* Waiting on you --------------------------------------------------- */}
      {awaiting.length > 0 && (
        <Reveal className="mt-8">
          <section className="relative overflow-hidden rounded-lg material p-6 shadow-[inset_3px_0_0_var(--color-brand-500)] sm:p-7">
            
            <div className="relative">
              <Badge tone="progress" pulse>
                Waiting on you
              </Badge>
              <h2 className="mt-3.5 text-xl font-semibold tracking-[-0.025em] text-ink">
                {awaiting.length === 1
                  ? "There's an introduction waiting for your answer"
                  : `${awaiting.length} introductions are waiting for your answer`}
              </h2>
              <p className="mt-2 max-w-xl text-[14.5px] leading-relaxed text-ink/55">
                Nothing opens until both people say yes. Take a look and decide in your own time.
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <div className="flex -space-x-2.5">
                  {awaiting.slice(0, 5).map((c) => (
                    <Avatar key={c.id} src={c.other.avatar_url} name={c.other.full_name} size={38} ring />
                  ))}
                </div>
                <Link href="/connections">
                  <Button size="md" iconRight={<ArrowRight />}>
                    Review {awaiting.length === 1 ? "it" : "them"}
                  </Button>
                </Link>
              </div>
            </div>
          </section>
        </Reveal>
      )}

      {/* Two columns ------------------------------------------------------ */}
      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        <Reveal>
          <SectionCard
            title="Your requests"
            href="/needs"
            icon={<LifeBuoy className="size-[17px]" />}
            empty={
              <EmptyState
                icon={<Sparkles />}
                title="Nothing asked for yet"
                description="You don't need to know exactly what you need. Describe the situation and we'll work it out with you."
                action={
                  <Link href="/needs/new">
                    <Button size="md" iconRight={<ArrowRight />}>
                      Ask for help
                    </Button>
                  </Link>
                }
              />
            }
            items={(needs ?? []).map((n: Need) => ({
              id: n.id,
              href: `/needs/${n.id}`,
              title: n.title,
              meta: categoryLabel(n.category),
              body: truncate(n.description, 100),
              status: NEED_STATUS_META[n.status].label,
              tone: NEED_STATUS_META[n.status].tone,
              time: n.created_at,
            }))}
          />
        </Reveal>

        <Reveal delay={0.08}>
          <SectionCard
            title="What you're offering"
            href="/offers"
            icon={<HandHeart className="size-[17px]" />}
            empty={
              <EmptyState
                icon={<HandHeart />}
                title="You haven't offered anything yet"
                description="Somebody out there needs exactly what you already know. Tell us what you could give an hour to."
                action={
                  <Link href="/offers/new">
                    <Button size="md" variant="glass" iconRight={<ArrowRight />} magnetic={false}>
                      Offer to help
                    </Button>
                  </Link>
                }
              />
            }
            items={(offers ?? []).map((o: Offer) => ({
              id: o.id,
              href: `/offers/${o.id}`,
              title: o.title,
              meta: categoryLabel(o.category, "offer"),
              body: truncate(o.description, 100),
              status: OFFER_STATUS_META[o.status].label,
              tone: OFFER_STATUS_META[o.status].tone,
              time: o.created_at,
            }))}
          />
        </Reveal>
      </div>

      {/* Recent conversations --------------------------------------------- */}
      {conversations.length > 0 && (
        <Reveal className="mt-5">
          <SpotlightCard className="p-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="flex items-center gap-2.5 text-[15px] font-semibold text-ink/90">
                <MessagesSquare className="size-[17px] text-brand-700" />
                Recent conversations
              </h2>
              <Link
                href="/messages"
                className="text-[12.5px] font-medium text-brand-700 transition-colors hover:text-brand-700"
              >
                Open inbox
              </Link>
            </div>

            <ul className="mt-5 space-y-1">
              {conversations.slice(0, 4).map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/messages/${c.id}`}
                    className="flex items-center gap-3.5 rounded-sm px-2.5 py-3 transition-colors hover:bg-ink/[0.045]"
                  >
                    <Avatar
                      src={c.other.avatar_url}
                      name={c.other.full_name}
                      size={40}
                      online={
                        c.other.last_seen_at
                          ? Date.now() - new Date(c.other.last_seen_at).getTime() < 3 * 60 * 1000
                          : false
                      }
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-3">
                        <span className="truncate text-[13.5px] font-medium text-ink/90">
                          {c.other.full_name ?? "Your connection"}
                        </span>
                        {c.last_message && (
                          <span className="shrink-0 font-mono text-[10.5px] text-ink/50">
                            {relativeTime(c.last_message.created_at)}
                          </span>
                        )}
                      </span>
                      <span className="mt-0.5 block truncate text-[12.5px] text-ink/58">
                        {c.last_message?.body ?? "No messages yet — say hello."}
                      </span>
                    </span>
                    {c.unread_count > 0 && (
                      <span className="grid min-w-5 shrink-0 place-items-center rounded-full bg-brand-500 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-snow">
                        {c.unread_count}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </SpotlightCard>
        </Reveal>
      )}
    </PageShell>
  );
}

/* --------------------------------------------------------------------------
 * Shared list card
 * ------------------------------------------------------------------------ */

interface Item {
  id: string;
  href: string;
  title: string;
  meta: string;
  body: string;
  status: string;
  tone: "neutral" | "info" | "progress" | "success" | "warn" | "danger";
  time: string;
}

function SectionCard({
  title,
  href,
  icon,
  items,
  empty,
}: {
  title: string;
  href: string;
  icon: React.ReactNode;
  items: Item[];
  empty: React.ReactNode;
}) {
  return (
    <SpotlightCard className="h-full p-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="flex items-center gap-2.5 text-[15px] font-semibold text-ink/90">
          <span className="text-brand-700">{icon}</span>
          {title}
        </h2>
        {items.length > 0 && (
          <Link href={href} className="text-[12.5px] font-medium text-brand-700 transition-colors hover:text-brand-700">
            See all
          </Link>
        )}
      </div>

      {items.length === 0 ? (
        <div className="mt-5">{empty}</div>
      ) : (
        <ul className="mt-5 space-y-2">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                className="group block rounded-sm border border-ink/[0.06] bg-ink/[0.02] p-4 transition-all duration-300 hover:border-brand-400/30 hover:bg-ink/[0.05]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-medium text-ink/90 transition-colors group-hover:text-ink">
                      {item.title}
                    </p>
                    <p className="mt-0.5 text-[11.5px] text-ink/50">{item.meta}</p>
                  </div>
                  <Badge tone={item.tone} pulse={item.tone === "progress"}>
                    {item.status}
                  </Badge>
                </div>
                <p className="mt-2.5 line-clamp-2 text-[13px] leading-relaxed text-ink/58">{item.body}</p>
                <p className="mt-2.5 flex items-center gap-1.5 font-mono text-[10.5px] text-ink/50">
                  <Clock3 className="size-3" />
                  {relativeTime(item.time)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </SpotlightCard>
  );
}
