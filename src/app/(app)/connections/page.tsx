import type { Metadata } from "next";
import { Link2 } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { listMyConnections } from "@/actions/connections";
import { PageHeader, PageShell } from "@/components/app/page-header";
import { EmptyState } from "@/components/ui/feedback";
import { ConnectionsBoard } from "@/components/app/connections-board";

export const metadata: Metadata = { title: "Connections" };

export default async function ConnectionsPage() {
  await requireUser();
  const connections = await listMyConnections();

  return (
    <PageShell>
      <PageHeader
        eyebrow="Connections"
        title="Introductions"
        description="Every introduction our team has proposed for you. Nothing opens until both people agree."
      />

      <div className="mt-8">
        {connections.length === 0 ? (
          <EmptyState
            icon={<Link2 />}
            title="No introductions yet"
            description="Once our team finds someone who fits what you need — or someone who needs what you offer — it will appear here first."
          />
        ) : (
          <ConnectionsBoard connections={connections} />
        )}
      </div>
    </PageShell>
  );
}
