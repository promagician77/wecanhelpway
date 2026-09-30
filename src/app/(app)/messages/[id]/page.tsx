import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getConversation } from "@/actions/messages";
import { ChatRoom } from "@/components/app/chat-room";

export const metadata: Metadata = { title: "Conversation" };

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { profile } = await requireUser();

  const data = await getConversation(id);
  if (!data || !data.other) notFound();

  return (
    <ChatRoom
      conversationId={id}
      me={profile}
      other={data.other}
      initialMessages={data.messages}
      otherReadAt={data.otherReadAt}
      needTitle={data.need?.title ?? null}
      connectionStatus={data.connection?.status ?? null}
    />
  );
}
