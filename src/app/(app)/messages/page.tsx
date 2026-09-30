import type { Metadata } from "next";
import { MessagesSquare } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { listConversations } from "@/actions/messages";
import { PageHeader, PageShell } from "@/components/app/page-header";
import { EmptyState } from "@/components/ui/feedback";
import { ConversationList } from "@/components/app/conversation-list";

export const metadata: Metadata = { title: "Messages" };

export default async function MessagesPage() {
  await requireUser();
  const conversations = await listConversations();

  return (
    <PageShell className="max-w-3xl">
      <PageHeader
        eyebrow="Messages"
        title="Your conversations"
        description="Private, one-to-one, and only with people you both agreed to meet."
      />

      <div className="mt-8">
        {conversations.length === 0 ? (
          <EmptyState
            icon={<MessagesSquare />}
            title="No conversations yet"
            description="A conversation opens the moment you and another person both accept an introduction. Until then, nobody can message you."
          />
        ) : (
          <ConversationList conversations={conversations} />
        )}
      </div>
    </PageShell>
  );
}
