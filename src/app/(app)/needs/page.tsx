import type { Metadata } from "next";
import Link from "next/link";
import { LifeBuoy, Plus } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, PageShell } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { NeedList } from "@/components/app/need-list";
import type { Need } from "@/lib/types";

export const metadata: Metadata = { title: "I Need Help" };

export default async function NeedsPage() {
  const { profile } = await requireUser();
  const supabase = await createClient();

  const { data } = await supabase
    .from("needs")
    .select("*")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false });

  const needs = (data ?? []) as Need[];

  return (
    <PageShell>
      <PageHeader
        eyebrow="I need help"
        title="Your requests"
        description="Every request you've made, and exactly where each one stands right now."
        actions={
          <Link href="/needs/new">
            <Button size="md" icon={<Plus />}>
              New request
            </Button>
          </Link>
        }
      />

      <div className="mt-8">
        {needs.length === 0 ? (
          <EmptyState
            icon={<LifeBuoy />}
            title="You haven't asked for anything yet"
            description="You don't have to know exactly what you need. Describe the situation in your own words and we'll take it from there."
            action={
              <Link href="/needs/new">
                <Button size="lg" icon={<Plus />}>
                  Ask for help
                </Button>
              </Link>
            }
          />
        ) : (
          <NeedList needs={needs} />
        )}
      </div>
    </PageShell>
  );
}
