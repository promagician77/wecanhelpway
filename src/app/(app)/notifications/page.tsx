import type { Metadata } from "next";
import { BellOff } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { listNotifications } from "@/actions/notifications";
import { PageHeader, PageShell } from "@/components/app/page-header";
import { EmptyState } from "@/components/ui/feedback";
import { NotificationList } from "@/components/app/notification-list";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  await requireUser();
  const notifications = await listNotifications(80);

  return (
    <PageShell className="max-w-3xl">
      <PageHeader
        eyebrow="Notifications"
        title="What's happened"
        description="Every update we've sent you, newest first. We email these too."
      />

      <div className="mt-8">
        {notifications.length === 0 ? (
          <EmptyState
            icon={<BellOff />}
            title="Nothing yet"
            description="When your request moves, or someone is proposed as a match, you'll hear about it here first."
          />
        ) : (
          <NotificationList notifications={notifications} />
        )}
      </div>
    </PageShell>
  );
}
